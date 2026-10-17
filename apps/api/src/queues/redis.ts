import { RedisOptions } from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

export const redisConnectionOptions: RedisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false,
  enableOfflineQueue: false,  // Do not hang HTTP requests when Redis is offline
  connectTimeout: 800,        // Fast fail if local Redis is not running
  retryStrategy: (times: number) => {
    if (times > 3) return null; // Stop retrying quickly if no server
    return 1000;
  },
};
