/**
 * Redis is disabled for now. All helpers return null so services skip queue/cache.
 * To re-enable: restore full implementation and add REDIS_URL to .env.
 */

export const connectRedis = async () => null;

export const getQueue = () => null;

export const createWorker = () => null;

export const getRedisClient = () => null;
