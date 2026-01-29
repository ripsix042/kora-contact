import { createWorker } from '../config/redis.js';
import { syncContactToCardDAV } from '../services/carddavService.js';
import { logger } from '../middlewares/errorHandler.js';

/**
 * Worker to process CardDAV contact sync jobs
 */
export const startContactSyncWorker = () => {
  const worker = createWorker('contact-sync', async (job) => {
    const { contactId, action } = job.data;

    try {
      logger.info(`Processing contact sync: ${action} for contact ${contactId}`);
      await syncContactToCardDAV(contactId, action);
      logger.info(`Contact sync completed: ${contactId}`);
    } catch (error) {
      logger.error(`Contact sync failed for ${contactId}:`, error);
      throw error; // Retry will be handled by BullMQ
    }
  });

  if (!worker) {
    logger.warn('Contact sync worker not started - Redis not configured');
    return null;
  }

  worker.on('completed', (job) => {
    logger.info(`Contact sync job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`Contact sync job ${job.id} failed:`, err);
  });

  return worker;
};

