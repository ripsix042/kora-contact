import mongoose from 'mongoose';

const deviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: 'text',
    },
    serialNumber: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      uppercase: true,
    },
    model: {
      type: String,
      trim: true,
    },
    deviceType: {
      type: String,
      trim: true,
      enum: ['phone', 'laptop'],
      default: 'laptop',
      index: true,
    },
    osVersion: {
      type: String,
      trim: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contact',
      default: null,
    },
    dateAssigned: {
      type: Date,
      default: null,
    },
    costAmount: {
      type: Number,
      default: null,
    },
    costCurrency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'NGN', 'GBP'],
    },
    status: {
      type: String,
      enum: ['available', 'assigned', 'maintenance', 'retired'],
      default: 'available',
    },
    mosyleDeviceId: {
      type: String,
      trim: true,
    },
    lastSyncedAt: {
      type: Date,
      default: null,
    },
    syncStatus: {
      type: String,
      enum: ['pending', 'synced', 'failed'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Text search index
deviceSchema.index({ name: 'text', serialNumber: 'text', model: 'text', deviceType: 'text' });

export const Device = mongoose.model('Device', deviceSchema);

