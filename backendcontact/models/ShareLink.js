import mongoose from 'mongoose';

const shareLinkSchema = new mongoose.Schema(
  {
    contactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contact',
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    usedAt: {
      type: Date,
      default: null,
    },
    usesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxUses: {
      type: Number,
      default: 1,
      min: 1,
    },
    createdBy: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

shareLinkSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const ShareLink = mongoose.model('ShareLink', shareLinkSchema);
