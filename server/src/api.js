import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { z } from 'zod';
import { connectRedis, closeRedis, redis } from './cache/redis.js';
import { env } from './config/env.js';
import { connectMongo, disconnectMongo } from './db/mongoose.js';
import {
  domainToKey,
  extractDomain,
  findSimilarCollegeDomains,
  isPersonalEmailDomain,
  normalizeCompanyKey,
  normalizeCompanyName,
} from './lib/domain.js';
import { requireStudent, signStudentToken } from './middleware/auth.js';
import { CompanyVisit } from './models/CompanyVisit.js';
import { College } from './models/College.js';
import { Student } from './models/Student.js';
import { enqueuePlacementEvent } from './queues/notifications.js';
import { addSseClient, startRealtimeBridge } from './realtime/events.js';
import {
  getLeaderboard,
  getPlacementSnapshot,
  invalidatePlacementCaches,
  publishPlacementEvent,
} from './services/snapshotService.js';

const emailSchema = z.string().email().transform((value) => value.trim().toLowerCase());
const linkedinSchema = z.string().min(8).refine(
  (value) => value.includes('linkedin.com/in/'),
  'LinkedIn profile must include linkedin.com/in/',
);

const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: emailSchema,
  linkedin: linkedinSchema,
  collegeName: z.string().trim().min(2).max(180).optional(),
});

const addCompanySchema = z.object({
  name: z.string().trim().min(1).max(120),
  visitDate: z.string().optional().nullable(),
  jobRoles: z.array(z.string().trim().min(1).max(80)).default([]),
  selectedForCurrentUser: z.boolean().default(false),
  totalSelections: z.number().int().min(0).optional().nullable(),
});

function asyncRoute(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function serializeStudentSession(student) {
  return {
    id: String(student._id),
    name: student.name,
    email: student.email,
    linkedin: student.linkedin,
    collegeDomain: student.collegeDomain,
    selections: (student.selections || []).map((selection) => ({
      companyId: selection.companyId ? String(selection.companyId) : undefined,
      companyName: selection.companyName,
      selectedAt: new Date(selection.selectedAt).toISOString(),
    })),
    registeredAt: new Date(student.registeredAt).toISOString(),
  };
}

function buildApp() {
  const app = express();

  app.use(helmet());
  app.use(compression());
  app.use(cors({
    origin(origin, callback) {
      if (!origin || env.clientOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin not allowed by CORS: ${origin}`));
    },
    credentials: true,
  }));
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

  app.get('/health', asyncRoute(async (_req, res) => {
    const redisPong = await redis.ping();
    res.json({
      status: 'ok',
      service: 'college-connect-api',
      redis: redisPong,
      timestamp: new Date().toISOString(),
    });
  }));

  app.get('/api/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    addSseClient(res);

    const keepAlive = setInterval(() => {
      res.write('event: ping\n');
      res.write(`data: ${Date.now()}\n\n`);
    }, 25000);

    req.on('close', () => {
      clearInterval(keepAlive);
    });
  });

  app.get('/api/placement/snapshot', asyncRoute(async (_req, res) => {
    res.json({ colleges: await getPlacementSnapshot() });
  }));

  app.get('/api/leaderboards/colleges', asyncRoute(async (_req, res) => {
    res.json(await getLeaderboard());
  }));

  app.get('/api/company-threads/:companyName', asyncRoute(async (req, res) => {
    const nameKey = normalizeCompanyKey(req.params.companyName);
    const cacheKey = `placement:company-thread:${nameKey}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const visits = await CompanyVisit.find({ nameKey }).sort({ addedAt: -1 }).lean();
    const colleges = await College.find({
      domainKey: { $in: visits.map((visit) => visit.collegeDomainKey) },
    }).lean();
    const collegeByKey = new Map(colleges.map((college) => [college.domainKey, college]));

    const response = {
      companyName: normalizeCompanyName(req.params.companyName),
      visits: visits.map((visit) => ({
        id: String(visit._id),
        college: collegeByKey.get(visit.collegeDomainKey)?.name || visit.collegeDomain,
        collegeDomain: visit.collegeDomain,
        visitDate: visit.visitDate ? new Date(visit.visitDate).toISOString().slice(0, 10) : undefined,
        jobRoles: visit.jobRoles || [],
        selections: visit.totalSelections ?? visit.selectedStudentIds?.length ?? 0,
      })),
    };

    await redis.setex(cacheKey, env.snapshotCacheSeconds, JSON.stringify(response));
    return res.json(response);
  }));

  app.get('/api/colleges/status', asyncRoute(async (req, res) => {
    const domain = extractDomain(req.query.email);

    if (!domain) {
      return res.status(400).json({ error: 'Provide a valid email query parameter' });
    }

    const domainKey = domainToKey(domain);
    const [college, colleges] = await Promise.all([
      College.findOne({ domainKey }).lean(),
      College.find().lean(),
    ]);

    return res.json({
      domain,
      domainKey,
      exists: Boolean(college),
      college,
      similarColleges: college ? [] : findSimilarCollegeDomains(domain, colleges),
    });
  }));

  app.post('/api/auth/register', asyncRoute(async (req, res) => {
    const input = registerSchema.parse(req.body);
    const domain = extractDomain(input.email);

    if (!domain || isPersonalEmailDomain(domain)) {
      return res.status(400).json({
        code: 'COLLEGE_EMAIL_REQUIRED',
        error: 'Use an official college or university email address.',
      });
    }

    const domainKey = domainToKey(domain);
    const existingStudent = await Student.findOne({ email: input.email });

    if (existingStudent) {
      return res.json({
        token: signStudentToken(existingStudent),
        student: serializeStudentSession(existingStudent),
        existing: true,
      });
    }

    let college = await College.findOne({ domainKey });

    if (!college && !input.collegeName) {
      const colleges = await College.find().lean();
      return res.status(409).json({
        code: 'COLLEGE_REQUIRED',
        domain,
        domainKey,
        similarColleges: findSimilarCollegeDomains(domain, colleges),
      });
    }

    if (!college) {
      college = await College.findOneAndUpdate(
        { domainKey },
        {
          $setOnInsert: {
            name: input.collegeName,
            domain,
            domainKey,
          },
        },
        { new: true, upsert: true },
      );
    }

    const student = await Student.create({
      name: input.name,
      email: input.email,
      linkedin: input.linkedin,
      collegeDomain: domain,
      collegeDomainKey: domainKey,
      selections: [],
    });

    await Promise.all([
      invalidatePlacementCaches(),
      enqueuePlacementEvent('student.registered', {
        studentId: String(student._id),
        collegeDomain: domain,
      }),
      publishPlacementEvent('student.registered', {
        studentId: String(student._id),
        collegeDomain: domain,
      }),
    ]);

    return res.status(201).json({
      token: signStudentToken(student),
      student: serializeStudentSession(student),
      existing: false,
    });
  }));

  app.post('/api/companies', requireStudent, asyncRoute(async (req, res) => {
    const input = addCompanySchema.parse(req.body);
    const student = req.student;
    const college = await College.findOne({ domainKey: student.collegeDomainKey });

    if (!college) {
      return res.status(404).json({ error: 'College not found for current student' });
    }

    const selectedStudentIds = input.selectedForCurrentUser ? [student._id] : [];
    const company = await CompanyVisit.create({
      name: normalizeCompanyName(input.name),
      nameKey: normalizeCompanyKey(input.name),
      visitDate: input.visitDate || undefined,
      jobRoles: input.jobRoles,
      addedBy: student._id,
      collegeDomain: college.domain,
      collegeDomainKey: college.domainKey,
      selectedStudentIds,
      totalSelections: input.totalSelections ?? undefined,
    });

    if (input.selectedForCurrentUser) {
      await Student.updateOne(
        { _id: student._id },
        {
          $addToSet: {
            selections: {
              companyId: company._id,
              companyName: company.name,
              selectedAt: new Date(),
            },
          },
        },
      );
    }

    await Promise.all([
      invalidatePlacementCaches(),
      enqueuePlacementEvent('company.added', {
        companyId: String(company._id),
        collegeDomain: college.domain,
      }),
      publishPlacementEvent('company.added', {
        companyId: String(company._id),
        collegeDomain: college.domain,
      }),
    ]);

    return res.status(201).json({ companyId: String(company._id) });
  }));

  app.post('/api/companies/:companyId/toggle-selection', requireStudent, asyncRoute(async (req, res) => {
    const student = req.student;
    const company = await CompanyVisit.findOne({
      _id: req.params.companyId,
      collegeDomainKey: student.collegeDomainKey,
    });

    if (!company) {
      return res.status(404).json({ error: 'Company visit not found' });
    }

    const selectedIds = (company.selectedStudentIds || []).map((id) => String(id));
    const alreadySelected = selectedIds.includes(String(student._id));

    if (alreadySelected) {
      company.selectedStudentIds = company.selectedStudentIds.filter((id) => String(id) !== String(student._id));
      await Student.updateOne(
        { _id: student._id },
        { $pull: { selections: { companyId: company._id } } },
      );
    } else {
      company.selectedStudentIds.push(student._id);
      await Student.updateOne(
        { _id: student._id },
        {
          $addToSet: {
            selections: {
              companyId: company._id,
              companyName: company.name,
              selectedAt: new Date(),
            },
          },
        },
      );
    }

    await company.save();

    await Promise.all([
      invalidatePlacementCaches(),
      enqueuePlacementEvent('selection.changed', {
        companyId: String(company._id),
        studentId: String(student._id),
        selected: !alreadySelected,
      }),
      publishPlacementEvent('selection.changed', {
        companyId: String(company._id),
        studentId: String(student._id),
        selected: !alreadySelected,
      }),
    ]);

    return res.json({ selected: !alreadySelected });
  }));

  app.use((error, _req, res, _next) => {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        issues: error.issues,
      });
    }

    if (error?.code === 11000) {
      return res.status(409).json({
        error: 'Duplicate data rejected',
        details: error.keyValue,
      });
    }

    console.error('[api] Unhandled error', error);
    return res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

async function start() {
  await connectMongo();
  await connectRedis();
  await startRealtimeBridge();

  const app = buildApp();
  const server = app.listen(env.port, () => {
    console.log(`[api] Listening on http://localhost:${env.port}`);
  });

  const shutdown = async () => {
    console.log('[api] Shutting down');
    server.close();
    await Promise.allSettled([closeRedis(), disconnectMongo()]);
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((error) => {
  console.error('[api] Failed to start', error);
  process.exit(1);
});
