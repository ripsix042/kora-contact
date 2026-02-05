/**
 * Redis client and queue helpers.
 * When Redis is not configured, returns null so services skip caching and background jobs.
 */

let redisClient = null;
let redisConnected = false;

/**
 * Connect to Redis (optional). Used by src/server.js; root server does not call this.
 */
export async function connectRedis() {
  const url =
    process.env.REDIS_URL ||
    (process.env.REDIS_HOST && `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}`);
  if (!url || url === 'redis://undefined:6379') {
    return;
  }
  try {
    const Redis = (await import('ioredis')).default;
    redisClient = new Redis(url);
    redisClient.on('connect', () => {
      redisConnected = true;
    });
    redisClient.on('error', (err) => {
      console.error('Redis error:', err.message);
    });
  } catch (error) {
    throw error;
  }
}

/**
 * Get Redis client for caching. Returns null if Redis is not configured.
 */
export function getRedisClient() {
  if (redisClient && redisConnected) return redisClient;
  return null;
}

/**
 * Get BullMQ queue by name. Returns null if Redis is not configured (background jobs disabled).
 */
export function getQueue() {
  return null;
}

/**
 * Create a BullMQ worker. No-op when Redis not configured (root server does not run workers).
 */
export function createWorker() {
  return null;
}
