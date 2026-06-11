import { Queue } from 'bullmq';
import { bullConnection } from '../cache/redis.js';

export const notificationsQueue = new Queue('placement-notifications', {
  connection: bullConnection,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: 1000,
    removeOnFail: 5000,
  },
});

export async function enqueuePlacementEvent(name, payload) {
  return notificationsQueue.add(name, payload);
}

