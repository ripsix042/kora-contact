import { Contact } from '../models/Contact.js';
import { Device } from '../models/Device.js';
import { SyncLog } from '../models/SyncLog.js';
import { getRedisClient } from '../config/redis.js';

const CACHE_TTL = 300; // 5 minutes

/**
 * Get dashboard metrics with Redis caching
 */
export const getDashboardMetrics = async () => {
  const redis = getRedisClient();
  const cacheKey = 'dashboard:metrics';

  // Try to get from cache
  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.error('Redis cache read error:', error);
    }
  }

  // Calculate metrics
  const [totalContacts, totalDevices, lastSyncLog] = await Promise.all([
    Contact.countDocuments(),
    Device.countDocuments(),
    SyncLog.findOne().sort({ createdAt: -1 }),
  ]);

  const metrics = {
    totalContacts,
    totalDevices,
    lastSync: lastSyncLog
      ? {
          type: lastSyncLog.type,
          status: lastSyncLog.status,
          completedAt: lastSyncLog.completedAt,
          recordsProcessed: lastSyncLog.recordsProcessed,
        }
      : null,
    timestamp: new Date(),
  };

  // Cache the result
  if (redis) {
    try {
      await redis.setEx(cacheKey, CACHE_TTL, JSON.stringify(metrics));
    } catch (error) {
      console.error('Redis cache write error:', error);
    }
  }

  return metrics;
};

