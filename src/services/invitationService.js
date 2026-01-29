import crypto from 'crypto';
import { Invitation } from '../models/Invitation.js';
import { logAuditEvent } from '../utils/auditLogger.js';
import { AppError } from '../middlewares/errorHandler.js';

// Invitation expires in 7 days
const INVITATION_EXPIRY_DAYS = 7;

export const createInvitation = async (email, createdBy) => {
  // Check if there's already an active invitation for this email
  const existingInvitation = await Invitation.findOne({
    email: email.toLowerCase(),
    used: false,
    expiresAt: { $gt: new Date() },
  });

  if (existingInvitation) {
    throw new AppError('An active invitation already exists for this email', 400);
  }

  // Generate secure token
  const token = crypto.randomBytes(32).toString('hex');
  
  // Calculate expiration date
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);

  const invitation = new Invitation({
    email: email.toLowerCase(),
    token,
    expiresAt,
    createdBy: createdBy.email || createdBy.oktaSub || 'system',
  });

  await invitation.save();

  // Log audit event
  await logAuditEvent({
    action: 'invitation.created',
    resource: 'invitation',
    resourceId: invitation._id.toString(),
    actor: createdBy.email || createdBy.oktaSub || 'system',
    changes: {
      email: invitation.email,
      expiresAt: invitation.expiresAt,
    },
  });

  return invitation;
};

export const getAllInvitations = async () => {
  const invitations = await Invitation.find()
    .sort({ createdAt: -1 })
    .lean();
  
  return invitations;
};

export const getInvitationByToken = async (token) => {
  const invitation = await Invitation.findOne({ token });
  
  if (!invitation) {
    throw new AppError('Invitation not found', 404);
  }

  if (invitation.used) {
    throw new AppError('Invitation has already been used', 400);
  }

  if (new Date() > invitation.expiresAt) {
    throw new AppError('Invitation has expired', 400);
  }

  return invitation;
};

export const markInvitationAsUsed = async (token, usedBy) => {
  const invitation = await Invitation.findOne({ token });
  
  if (!invitation) {
    throw new AppError('Invitation not found', 404);
  }

  invitation.used = true;
  invitation.usedAt = new Date();
  await invitation.save();

  // Log audit event
  await logAuditEvent({
    action: 'invitation.used',
    resource: 'invitation',
    resourceId: invitation._id.toString(),
    actor: usedBy.email || usedBy.oktaSub || 'system',
    changes: {
      usedAt: invitation.usedAt,
    },
  });

  return invitation;
};


