import { createClient } from 'redis';
import { Queue, Worker } from 'bullmq';

let redisClient = null;
const queues = {};

export const connectRedis = async () => {
  // If Redis is not configured, skip connection
  if (!process.env.REDIS_HOST) {
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

    redisClient.on('error', (err) => console.error('Redis Client Error', err));
    await redisClient.connect();
    console.log(`Redis Connected to ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);
    return redisClient;
  } catch (error) {
    console.error('Redis connection error:', error);
    console.warn('⚠️  Continuing without Redis - background jobs will be disabled');
    return null;
  }
};

export const getRedisClient = () => redisClient;

export const getQueue = (name) => {
  if (!process.env.REDIS_HOST) {
    console.warn(`Queue ${name} not available - Redis not configured`);
    return null;
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
  if (!process.env.REDIS_HOST) {
    console.warn(`Worker ${name} not started - Redis not configured`);
    return null;
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

