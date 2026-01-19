import { AuditLog } from '../models/AuditLog.js';

/**
 * Log an audit event with Okta user identity
 */
export const logAuditEvent = async (action, resource, resourceId, details, user) => {
  try {
    await AuditLog.create({
      action,
      resource,
      resourceId,
      details,
      actor: {
        oktaSub: user.oktaSub,
        email: user.email,
        groups: user.groups || [],
      },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
    // Don't throw - audit logging should not break the main flow
  }
};

