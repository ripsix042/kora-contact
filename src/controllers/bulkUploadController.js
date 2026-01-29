import multer from 'multer';
import csv from 'csv-parser';
import { Readable } from 'stream';
import * as bulkUploadService from '../services/bulkUploadService.js';
import { AppError } from '../middlewares/errorHandler.js';

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: bulkUploadService.MAX_FILE_SIZE,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new AppError('Only CSV files are allowed', 400), false);
    }
  },
});

/**
 * Parse CSV from buffer
 */
const parseCSV = (buffer) => {
  return new Promise((resolve, reject) => {
    const rows = [];
    const stream = Readable.from(buffer);

    stream
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('end', () => resolve(rows))
      .on('error', (error) => reject(error));
  });
};

export const uploadContacts = [
  upload.single('file'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        throw new AppError('No file uploaded', 400);
      }

      const rows = await parseCSV(req.file.buffer);
      const syncLog = await bulkUploadService.processBulkContactUpload(rows, req.user);

      res.status(201).json({
        message: 'Bulk upload processed',
        syncLog: {
          id: syncLog._id.toString(),
          status: syncLog.status,
          recordsProcessed: syncLog.recordsProcessed,
          recordsSucceeded: syncLog.recordsSucceeded,
          recordsFailed: syncLog.recordsFailed,
          errors: syncLog.errorDetails.slice(0, 100), // Limit error details
        },
      });
    } catch (error) {
      next(error);
    }
  },
];

export const uploadDevices = [
  upload.single('file'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        throw new AppError('No file uploaded', 400);
      }

      const rows = await parseCSV(req.file.buffer);
      const syncLog = await bulkUploadService.processBulkDeviceUpload(rows, req.user);

      res.status(201).json({
        message: 'Bulk upload processed',
        syncLog: {
          id: syncLog._id.toString(),
          status: syncLog.status,
          recordsProcessed: syncLog.recordsProcessed,
          recordsSucceeded: syncLog.recordsSucceeded,
          recordsFailed: syncLog.recordsFailed,
          errors: syncLog.errorDetails.slice(0, 100), // Limit error details
        },
      });
    } catch (error) {
      next(error);
    }
  },
];

