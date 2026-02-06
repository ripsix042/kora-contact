import mongoose from 'mongoose';

const contactScanSchema = new mongoose.Schema(
  {
    contactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contact',
      required: true,
      index: true,
    },
    ip: {
      type: String,
      trim: true,
    },
    location: {
      country: { type: String, trim: true },
      region: { type: String, trim: true },
      city: { type: String, trim: true },
    },
    device: {
      type: { type: String, trim: true }, // mobile, tablet, desktop
      browser: { type: String, trim: true },
      os: { type: String, trim: true },
    },
    userAgent: {
      type: String,
      trim: true,
      select: false, // Don't include in default queries (can be large)
    },
  },
  {
    timestamps: true,
  }
);

contactScanSchema.index({ contactId: 1, createdAt: -1 });

export const ContactScan = mongoose.model('ContactScan', contactScanSchema);
