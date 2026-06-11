import IORedis from 'ioredis';
import { env } from '../config/env.js';

export const redis = new IORedis(env.redisUrl);
export const redisPublisher = new IORedis(env.redisUrl);
export const redisSubscriber = new IORedis(env.redisUrl);

export const bullConnection = new IORedis(env.redisUrl, {
  maxRetriesPerRequest: null,
});

export async function connectRedis() {
  await Promise.all([redis.ping(), redisPublisher.ping(), redisSubscriber.ping()]);

  console.log('[api] Redis connected');
}

export async function closeRedis() {
  await Promise.allSettled([
    redis.quit(),
    redisPublisher.quit(),
    redisSubscriber.quit(),
    bullConnection.quit(),
  ]);
}
