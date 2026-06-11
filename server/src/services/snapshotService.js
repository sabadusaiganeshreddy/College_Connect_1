import { env } from '../config/env.js';
import { redis, redisPublisher } from '../cache/redis.js';
import { CompanyVisit } from '../models/CompanyVisit.js';
import { College } from '../models/College.js';
import { Student } from '../models/Student.js';
import { PLACEMENT_EVENTS_CHANNEL } from '../realtime/events.js';

const SNAPSHOT_CACHE_KEY = 'placement:snapshot:v1';
const LEADERBOARD_CACHE_KEY = 'placement:leaderboard:v1';

function toIsoDate(value) {
  return value ? new Date(value).toISOString() : undefined;
}

function serializeStudent(student) {
  return {
    id: String(student._id),
    name: student.name,
    email: student.email,
    linkedin: student.linkedin,
    collegeDomain: student.collegeDomain,
    selections: (student.selections || []).map((selection) => ({
      companyId: selection.companyId ? String(selection.companyId) : undefined,
      companyName: selection.companyName,
      selectedAt: toIsoDate(selection.selectedAt),
    })),
    registeredAt: toIsoDate(student.registeredAt),
  };
}

function serializeCompany(company) {
  return {
    id: String(company._id),
    name: company.name,
    visitDate: company.visitDate ? toIsoDate(company.visitDate).slice(0, 10) : undefined,
    jobRoles: company.jobRoles || [],
    addedBy: String(company.addedBy),
    selectedStudents: (company.selectedStudentIds || []).map((id) => String(id)),
    totalSelections: company.totalSelections,
    addedAt: toIsoDate(company.addedAt),
  };
}

export async function buildPlacementSnapshot() {
  const [colleges, students, companies] = await Promise.all([
    College.find().sort({ name: 1 }).lean(),
    Student.find().sort({ registeredAt: 1 }).lean(),
    CompanyVisit.find().sort({ addedAt: -1 }).lean(),
  ]);

  const studentsByCollege = new Map();
  const companiesByCollege = new Map();

  for (const student of students) {
    const list = studentsByCollege.get(student.collegeDomainKey) || [];
    list.push(serializeStudent(student));
    studentsByCollege.set(student.collegeDomainKey, list);
  }

  for (const company of companies) {
    const list = companiesByCollege.get(company.collegeDomainKey) || [];
    list.push(serializeCompany(company));
    companiesByCollege.set(company.collegeDomainKey, list);
  }

  const snapshot = {};

  for (const college of colleges) {
    snapshot[college.domainKey] = {
      name: college.name,
      domain: college.domain,
      students: studentsByCollege.get(college.domainKey) || [],
      companies: companiesByCollege.get(college.domainKey) || [],
      createdAt: toIsoDate(college.createdAt),
    };
  }

  return snapshot;
}

export async function getPlacementSnapshot() {
  const cached = await redis.get(SNAPSHOT_CACHE_KEY);
  if (cached) {
    return JSON.parse(cached);
  }

  const snapshot = await buildPlacementSnapshot();
  await redis.setex(SNAPSHOT_CACHE_KEY, env.snapshotCacheSeconds, JSON.stringify(snapshot));
  return snapshot;
}

export async function invalidatePlacementCaches() {
  await redis.del(SNAPSHOT_CACHE_KEY);
  await redis.del(LEADERBOARD_CACHE_KEY);
}

export async function publishPlacementEvent(type, payload = {}) {
  await redisPublisher.publish(
    PLACEMENT_EVENTS_CHANNEL,
    JSON.stringify({
      type,
      payload,
      publishedAt: new Date().toISOString(),
    }),
  );
}

export async function getLeaderboard() {
  const cached = await redis.get(LEADERBOARD_CACHE_KEY);
  if (cached) {
    return JSON.parse(cached);
  }

  const colleges = await College.find().lean();
  const companies = await CompanyVisit.find().lean();
  const students = await Student.find().lean();

  const byCollege = colleges.map((college) => {
    const collegeCompanies = companies.filter((company) => company.collegeDomainKey === college.domainKey);
    const collegeStudents = students.filter((student) => student.collegeDomainKey === college.domainKey);
    const selectionCount = collegeCompanies.reduce(
      (total, company) => total + (company.totalSelections ?? company.selectedStudentIds?.length ?? 0),
      0,
    );

    return {
      college: college.name,
      domain: college.domain,
      students: collegeStudents.length,
      companies: collegeCompanies.length,
      selections: selectionCount,
    };
  }).sort((left, right) => right.selections - left.selections);

  const leaderboard = {
    generatedAt: new Date().toISOString(),
    colleges: byCollege,
  };

  await redis.setex(LEADERBOARD_CACHE_KEY, env.snapshotCacheSeconds, JSON.stringify(leaderboard));
  return leaderboard;
}
