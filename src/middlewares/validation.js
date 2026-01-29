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
  // Accept both firstName/lastName (new) and name (legacy)
  body('firstName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('First name must be less than 100 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Last name must be less than 100 characters'),
  body('name')
    .optional()
    .trim(),
  // Ensure at least firstName+lastName OR name is provided
  body().custom((value) => {
    const hasFirstName = value.firstName && value.firstName.trim();
    const hasLastName = value.lastName && value.lastName.trim();
    const hasName = value.name && value.name.trim();
    
    if (!hasFirstName && !hasLastName && !hasName) {
      throw new Error('Either firstName+lastName or name is required');
    }
    if (hasFirstName && !hasLastName) {
      throw new Error('Both firstName and lastName are required when using firstName');
    }
    if (hasLastName && !hasFirstName) {
      throw new Error('Both firstName and lastName are required when using lastName');
    }
    return true;
  }),
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
  body('linkedIn')
    .optional()
    .trim()
    .isURL()
    .withMessage('LinkedIn must be a valid URL'),
  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Department must be less than 100 characters'),
  body('profileImage')
    .optional()
    .trim()
    .custom((value) => {
      if (!value) return true; // Optional
      // Validate base64 data URL format (data:image/...;base64,...)
      if (typeof value === 'string' && value.startsWith('data:image/')) {
        return true;
      }
      throw new Error('Profile image must be a valid base64 data URL');
    }),
  // Legacy fields (for backward compatibility)
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
  body('deviceType')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Device type must be less than 100 characters'),
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