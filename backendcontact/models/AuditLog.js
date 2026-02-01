import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        'create',
        'update',
        'delete',
        'read',
        'sync',
        'bulk-upload',
        'settings-update',
      ],
    },
    resource: {
      type: String,
      required: true,
      enum: ['contact', 'device', 'invitation', 'user', 'sync', 'settings'],
    },
    resourceId: {
      type: String,
      default: null,
    },
    actor: {
      oktaSub: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
      groups: [String],
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for querying by actor
auditLogSchema.index({ 'actor.oktaSub': 1, timestamp: -1 });
auditLogSchema.index({ resource: 1, resourceId: 1, timestamp: -1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);

