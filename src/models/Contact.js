import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: 'text',
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
      validate: {
        validator: function (v) {
          return v.endsWith('@korapay.com');
        },
        message: 'Email must be a @korapay.com address',
      },
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    company: {
      type: String,
      trim: true,
    },
    title: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    syncedAt: {
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

// Compound index for email + phone uniqueness
contactSchema.index({ email: 1, phone: 1 }, { unique: true });

// Text search index
contactSchema.index({ name: 'text', email: 'text', company: 'text' });

export const Contact = mongoose.model('Contact', contactSchema);

