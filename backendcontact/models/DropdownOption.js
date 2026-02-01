import mongoose from 'mongoose';

const dropdownOptionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['department', 'role'],
      required: true,
      index: true,
    },
    value: {
      type: String,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

dropdownOptionSchema.index({ type: 1, value: 1 }, { unique: true });

export const DropdownOption = mongoose.model('DropdownOption', dropdownOptionSchema);
