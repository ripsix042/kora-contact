import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema(
  {
    // New fields (preferred)
    firstName: {
      type: String,
      trim: true,
      maxlength: 100,
      index: 'text',
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: 100,
      index: 'text',
    },
    // Legacy field (for backward compatibility)
    name: {
      type: String,
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
    linkedIn: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          if (!v) return true; // Optional
          return /^https?:\/\/.*linkedin\.com/.test(v);
        },
        message: 'LinkedIn must be a valid LinkedIn URL',
      },
    },
    department: {
      type: String,
      trim: true,
      maxlength: 100,
      index: true,
    },
    // Legacy fields (for backward compatibility)
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
    profileImage: {
      type: String,
      trim: true,
      // Store as base64 data URL (data:image/png;base64,...)
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

// Virtual for full name (backward compatibility)
contactSchema.virtual('fullName').get(function () {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`.trim();
  }
  return this.name || '';
});

// Pre-save middleware to ensure name is set for backward compatibility
contactSchema.pre('save', function (next) {
  // If firstName/lastName exist but name doesn't, set name
  if (this.firstName && this.lastName && !this.name) {
    this.name = `${this.firstName} ${this.lastName}`.trim();
  }
  // If name exists but firstName/lastName don't, try to split
  if (this.name && (!this.firstName || !this.lastName)) {
    const nameParts = this.name.trim().split(/\s+/);
    if (nameParts.length > 0 && !this.firstName) {
      this.firstName = nameParts[0];
    }
    if (nameParts.length > 1 && !this.lastName) {
      this.lastName = nameParts.slice(1).join(' ');
    }
  }
  // Map legacy fields to new fields if needed
  if (this.company && !this.department) {
    this.department = this.company;
  }
  next();
});

// Compound index for email + phone uniqueness
contactSchema.index({ email: 1, phone: 1 }, { unique: true });

// Compound index for firstName + lastName
contactSchema.index({ firstName: 1, lastName: 1 });

// Text search index
contactSchema.index({ 
  firstName: 'text', 
  lastName: 'text', 
  name: 'text', 
  email: 'text', 
  company: 'text',
  department: 'text'
});

export const Contact = mongoose.model('Contact', contactSchema);

