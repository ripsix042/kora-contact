import mongoose from 'mongoose';

const syncLogSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ['carddav', 'mosyle', 'bulk-upload'],
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'in-progress', 'completed', 'failed'],
      default: 'pending',
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    recordsProcessed: {
      type: Number,
      default: 0,
    },
    recordsSucceeded: {
      type: Number,
      default: 0,
    },
    recordsFailed: {
      type: Number,
      default: 0,
    },
    errorDetails: [
      {
        row: Number,
        message: String,
        data: mongoose.Schema.Types.Mixed,
      },
    ],
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

export const SyncLog = mongoose.model('SyncLog', syncLogSchema);

