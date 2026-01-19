import { createClient } from 'redis';
import { Queue, Worker } from 'bullmq';

let redisClient = null;
const queues = {};

export const connectRedis = async () => {
  // If Redis is not configured, skip connection
  // Also check if it's set to localhost (which won't work on Render)
  const redisHost = process.env.REDIS_HOST?.trim();
  if (!redisHost || redisHost === 'localhost' || redisHost === '127.0.0.1') {
    console.warn('⚠️  Redis not configured - background jobs will be disabled');
    console.warn('   Set REDIS_HOST, REDIS_PORT, and REDIS_PASSWORD to enable Redis');
    return null;
  }

  try {
    redisClient = createClient({
      socket: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('Redis: Max reconnection attempts reached');
            return false;
          }
          return Math.min(retries * 100, 3000);
        },
      },
      password: process.env.REDIS_PASSWORD || undefined,
    });

    // Only log errors if we're actually trying to use Redis
    redisClient.on('error', (err) => {
      // Suppress connection refused errors if Redis isn't properly configured
      if (err.code === 'ECONNREFUSED' && !process.env.REDIS_HOST) {
        return; // Silently ignore if Redis wasn't configured
      }
      console.error('Redis Client Error', err);
    });
    
    await redisClient.connect();
    console.log(`Redis Connected to ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);
    return redisClient;
  } catch (error) {
    // Only log if we actually tried to connect (REDIS_HOST was set)
    if (process.env.REDIS_HOST) {
      console.error('Redis connection error:', error.message);
      console.warn('⚠️  Continuing without Redis - background jobs will be disabled');
    }
    return null;
  }
};

export const getRedisClient = () => redisClient;

export const getQueue = (name) => {
  const redisHost = process.env.REDIS_HOST?.trim();
  if (!redisHost || redisHost === 'localhost' || redisHost === '127.0.0.1') {
    return null; // Silently return null, don't log warnings for every queue access
  }
  
  if (!queues[name]) {
    queues[name] = new Queue(name, {
      connection: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
      },
    });
  }
  return queues[name];
};

export const createWorker = (name, processor) => {
  const redisHost = process.env.REDIS_HOST?.trim();
  if (!redisHost || redisHost === 'localhost' || redisHost === '127.0.0.1') {
    return null; // Silently return null, don't log warnings
  }
  
  return new Worker(
    name,
    processor,
    {
      connection: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
      },
    }
  );
};

