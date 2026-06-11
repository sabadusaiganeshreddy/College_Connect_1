import { Worker } from 'bullmq';
import { bullConnection, closeRedis } from './cache/redis.js';
import { connectMongo, disconnectMongo } from './db/mongoose.js';

async function handlePlacementNotification(job) {
  const { name, data } = job;

  console.log(`[worker] Processing ${name}`, data);

  if (name === 'student.registered') {
    return { delivered: true, channel: 'audit-log' };
  }

  if (name === 'company.added') {
    return { delivered: true, channel: 'college-feed' };
  }

  if (name === 'selection.changed') {
    return { delivered: true, channel: 'student-feed' };
  }

  return { delivered: true, channel: 'default' };
}

async function start() {
  await connectMongo();

  const worker = new Worker('placement-notifications', handlePlacementNotification, {
    connection: bullConnection,
    concurrency: Number(process.env.WORKER_CONCURRENCY || 5),
  });

  worker.on('completed', (job) => {
    console.log(`[worker] Completed job ${job.id}:${job.name}`);
  });

  worker.on('failed', (job, error) => {
    console.error(`[worker] Failed job ${job?.id}:${job?.name}`, error);
  });

  console.log('[worker] Placement notification worker running');

  const shutdown = async () => {
    console.log('[worker] Shutting down');
    await worker.close();
    await Promise.allSettled([closeRedis(), disconnectMongo()]);
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((error) => {
  console.error('[worker] Failed to start', error);
  process.exit(1);
});

