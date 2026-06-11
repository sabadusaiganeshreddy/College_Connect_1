import mongoose from 'mongoose';
import { env } from '../config/env.js';

export async function connectMongo() {
  mongoose.set('strictQuery', true);

  await mongoose.connect(env.mongoUri, {
    autoIndex: env.nodeEnv !== 'production',
  });

  console.log(`[api] MongoDB connected: ${mongoose.connection.name}`);
}

export async function disconnectMongo() {
  await mongoose.disconnect();
}

