import { Contact } from '../models/Contact.js';
import { Device } from '../models/Device.js';
import { SyncLog } from '../models/SyncLog.js';
import { logAuditEvent } from '../utils/auditLogger.js';
import { AppError } from '../middlewares/errorHandler.js';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_ROWS = 10000;

/**
 * Process bulk contact upload
 */
export const processBulkContactUpload = async (rows, user) => {
  if (rows.length > MAX_ROWS) {
    throw new AppError(`Maximum ${MAX_ROWS} rows allowed`, 400);
  }

  const syncLog = await SyncLog.create({
    type: 'bulk-upload',
    status: 'in-progress',
    startedAt: new Date(),
    metadata: { resource: 'contact', uploadedBy: user.email },
  });

  let processed = 0;
  let succeeded = 0;
  let failed = 0;
  const errors = [];

  for (const [index, row] of rows.entries()) {
    processed++;
    try {
      // Validate required fields
      if (!row.name || !row.email || !row.phone) {
        throw new Error('Missing required fields: name, email, phone');
      }

      // Validate @korapay.com email
      if (!row.email.endsWith('@korapay.com')) {
        throw new Error('Email must be a @korapay.com address');
      }

      // Check for duplicates
      const existing = await Contact.findOne({
        $or: [{ email: row.email }, { phone: row.phone }],
      });

      if (existing) {
        throw new Error('Contact with this email or phone already exists');
      }

      await Contact.create({
        name: row.name,
        email: row.email.toLowerCase(),
        phone: row.phone,
        company: row.company || '',
        title: row.title || '',
        notes: row.notes || '',
        syncStatus: 'pending',
      });

      succeeded++;
    } catch (error) {
      failed++;
      errors.push({
        row: index + 1,
        message: error.message,
        data: row,
      });
    }
  }

  syncLog.status = 'completed';
  syncLog.completedAt = new Date();
  syncLog.recordsProcessed = processed;
  syncLog.recordsSucceeded = succeeded;
  syncLog.recordsFailed = failed;
  syncLog.errorDetails = errors;
  await syncLog.save();

  // Log audit event
  await logAuditEvent(
    'bulk-upload',
    'contact',
    null,
    { processed, succeeded, failed, syncLogId: syncLog._id.toString() },
    user
  );

  return syncLog;
};

/**
 * Process bulk device upload
 */
export const processBulkDeviceUpload = async (rows, user) => {
  if (rows.length > MAX_ROWS) {
    throw new AppError(`Maximum ${MAX_ROWS} rows allowed`, 400);
  }

  const syncLog = await SyncLog.create({
    type: 'bulk-upload',
    status: 'in-progress',
    startedAt: new Date(),
    metadata: { resource: 'device', uploadedBy: user.email },
  });

  let processed = 0;
  let succeeded = 0;
  let failed = 0;
  const errors = [];

  for (const [index, row] of rows.entries()) {
    processed++;
    try {
      // Validate required fields
      if (!row.name || !row.serialNumber) {
        throw new Error('Missing required fields: name, serialNumber');
      }

      // Check for duplicates
      const existing = await Device.findOne({
        serialNumber: row.serialNumber.toUpperCase(),
      });

      if (existing) {
        throw new Error('Device with this serial number already exists');
      }

      await Device.create({
        name: row.name,
        serialNumber: row.serialNumber.toUpperCase(),
        model: row.model || '',
        osVersion: row.osVersion || '',
        status: row.status || 'available',
        syncStatus: 'pending',
      });

      succeeded++;
    } catch (error) {
      failed++;
      errors.push({
        row: index + 1,
        message: error.message,
        data: row,
      });
    }
  }

  syncLog.status = 'completed';
  syncLog.completedAt = new Date();
  syncLog.recordsProcessed = processed;
  syncLog.recordsSucceeded = succeeded;
  syncLog.recordsFailed = failed;
  syncLog.errorDetails = errors;
  await syncLog.save();

  // Log audit event
  await logAuditEvent(
    'bulk-upload',
    'device',
    null,
    { processed, succeeded, failed, syncLogId: syncLog._id.toString() },
    user
  );

  return syncLog;
};

export { MAX_FILE_SIZE, MAX_ROWS };

