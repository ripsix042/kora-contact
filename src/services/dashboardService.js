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
  const [
    totalContacts,
    totalDevices,
    lastSyncLog,
    withPhone,
    withLinkedIn,
    withPhoto,
  ] = await Promise.all([
    Contact.countDocuments(),
    Device.countDocuments(),
    SyncLog.findOne().sort({ createdAt: -1 }),
    Contact.countDocuments({ phone: { $exists: true, $ne: null, $ne: '' } }),
    Contact.countDocuments({ linkedIn: { $exists: true, $ne: null, $ne: '' } }),
    Contact.countDocuments({ profileImage: { $exists: true, $ne: null, $ne: '' } }),
  ]);

  const withPhonePct = totalContacts ? Math.round((withPhone / totalContacts) * 100) : 0;
  const withLinkedInPct = totalContacts ? Math.round((withLinkedIn / totalContacts) * 100) : 0;
  const withPhotoPct = totalContacts ? Math.round((withPhoto / totalContacts) * 100) : 0;
  const completePct = Math.round((withPhonePct + withLinkedInPct + withPhotoPct) / 3);

  const metrics = {
    totalContacts,
    totalDevices,
    withPhonePct,
    withLinkedInPct,
    withPhotoPct,
    completePct,
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

