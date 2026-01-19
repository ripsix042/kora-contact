import { createClient } from 'redis';
import { Queue, Worker } from 'bullmq';

let redisClient = null;
const queues = {};

export const connectRedis = async () => {
  try {
    redisClient = createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
      },
      password: process.env.REDIS_PASSWORD || undefined,
    });

    redisClient.on('error', (err) => console.error('Redis Client Error', err));
    await redisClient.connect();
    console.log('Redis Connected');
    return redisClient;
  } catch (error) {
    console.error('Redis connection error:', error);
    throw error;
  }
};

export const getRedisClient = () => redisClient;

export const getQueue = (name) => {
  if (!queues[name]) {
    queues[name] = new Queue(name, {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
      },
    });
  }
  return queues[name];
};

export const createWorker = (name, processor) => {
  return new Worker(
    name,
    processor,
    {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
      },
    }
  );
};

