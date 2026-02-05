import mongoose from 'mongoose';
import { encrypt, decrypt } from '../utils/encryption.js';

const integrationSettingsSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ['carddav', 'mosyle'],
      unique: true,
    },
    enabled: {
      type: Boolean,
      default: false,
    },
    config: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Encrypted fields stored separately
    encryptedFields: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Virtual to decrypt sensitive fields
integrationSettingsSchema.methods.getDecryptedConfig = function () {
  const decrypted = { ...this.config };
  const encryptedFields = this.encryptedFields || {};

  for (const [key, encryptedValue] of Object.entries(encryptedFields)) {
    try {
      decrypted[key] = decrypt(encryptedValue);
    } catch (error) {
      console.error(`Failed to decrypt ${key}:`, error);
    }
  }

  return decrypted;
};

// Method to encrypt and store sensitive fields
integrationSettingsSchema.methods.setEncryptedField = function (key, value) {
  if (!this.encryptedFields) {
    this.encryptedFields = {};
  }
  this.encryptedFields[key] = encrypt(value);
};

export const IntegrationSettings = mongoose.model(
  'IntegrationSettings',
  integrationSettingsSchema
);

