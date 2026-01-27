import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
    },
    role: {
      type: String,
      enum: ['admin', 'user'],
      default: 'user',
    },
    oktaSub: {
      type: String,
      sparse: true, // Allow null but unique when present
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model('User', userSchema);
