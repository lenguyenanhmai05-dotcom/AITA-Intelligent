import Redis from 'ioredis';
import { redisConnectionOptions } from './redis';

const cacheRedis = new Redis({
  ...redisConnectionOptions,
  maxRetriesPerRequest: 1,
  retryStrategy: (times) => (times > 2 ? null : 250),
});

cacheRedis.on('error', () => {
  // Redis is optional for API availability; cache operations fail open.
});

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const value = await cacheRedis.get(key);
    return value ? JSON.parse(value) as T : null;
  } catch {
    return null;
  }
}

export async function setCached(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  try {
    await cacheRedis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {
    // Cache failure must not make report or telemetry endpoints unavailable.
  }
}