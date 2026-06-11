import 'dotenv/config';

const requiredInProduction = ['MONGODB_URI', 'REDIS_URL', 'JWT_SECRET'];

for (const key of requiredInProduction) {
  if (process.env.NODE_ENV === 'production' && !process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  clientOrigins: (process.env.CLIENT_ORIGINS || process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/college_connect',
  redisUrl: process.env.REDIS_URL
    || (process.env.REDIS_HOST && process.env.REDIS_PORT ? `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}` : undefined)
    || 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET || 'dev-only-change-me',
  snapshotCacheSeconds: Number(process.env.SNAPSHOT_CACHE_SECONDS || 30),
};
