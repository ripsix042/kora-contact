import { body, param, query, validationResult } from 'express-validator';
import { AppError } from './errorHandler.js';

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(
      errors.array().map((e) => e.msg).join(', '),
      400
    );
  }
  next();
};

// Contact validation rules
export const validateContact = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .custom((value) => {
      if (!value.endsWith('@korapay.com')) {
        throw new Error('Email must be a @korapay.com address');
      }
      return true;
    }),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('company').optional().trim(),
  body('title').optional().trim(),
  body('notes').optional().trim(),
  handleValidationErrors,
];

// Device validation rules
export const validateDevice = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('serialNumber').trim().notEmpty().withMessage('Serial number is required'),
  body('model').optional().trim(),
  body('osVersion').optional().trim(),
  body('status')
    .optional()
    .isIn(['available', 'assigned', 'maintenance', 'retired'])
    .withMessage('Invalid status'),
  handleValidationErrors,
];

// ID parameter validation
export const validateId = [
  param('id').isMongoId().withMessage('Invalid ID format'),
  handleValidationErrors,
];

// Pagination validation
export const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 10000 }).withMessage('Limit must be between 1 and 10000'),
  handleValidationErrors,
];

// User role validation
export const validateUserRole = [
  body('role')
    .isIn(['admin', 'user'])
    .withMessage('Role must be either "admin" or "user"'),
  handleValidationErrors,
];// Invitation validation
export const validateInvitation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email address is required')
    .normalizeEmail(),
  handleValidationErrors,
];