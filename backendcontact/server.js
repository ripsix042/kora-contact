import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load .env from backend directory before any code that reads process.env (e.g. oktaAuth)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '.env');
const envExists = fs.existsSync(envPath);
console.log('dotenv: path=', envPath, '| exists=', envExists);

const result = dotenv.config({ path: envPath, override: true });

if (result.error) {
  console.warn('dotenv: error', result.error.message);
} else if (result.parsed) {
  const keys = Object.keys(result.parsed);
  const oktaKeys = keys.filter((k) => k.toUpperCase().includes('OKTA'));
  const hasIssuer = Object.prototype.hasOwnProperty.call(result.parsed, 'OKTA_ISSUER');
  console.log('dotenv: parsed', keys.length, 'vars | OKTA_ISSUER key present?', hasIssuer, '| Okta keys:', oktaKeys.length ? oktaKeys.join(', ') : 'none');
  if (!hasIssuer && keys.length > 0) console.log('dotenv: parsed key names (last 5):', keys.slice(-5).map((k) => JSON.stringify(k)));
}

// Log Okta config status (no secrets)
const oktaIssuer = process.env.OKTA_ISSUER?.trim();
console.log(
  oktaIssuer
    ? `Okta: issuer configured (login + JWT verification enabled)`
    : 'Okta: OKTA_ISSUER not set (login disabled, using dev mock user)'
);

// Dynamic import so app (and oktaAuth) load after .env is loaded
const { default: app } = await import('./app.js');

const PORT = process.env.PORT || 8085;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI is not defined');
  process.exit(1);
}

// Optional: validate ENCRYPTION_KEY for IntegrationSettings / encryption
if (process.env.ENCRYPTION_KEY && process.env.ENCRYPTION_KEY.length !== 64) {
  console.warn('ENCRYPTION_KEY should be 32 bytes (64 hex characters) for encrypted settings');
}

mongoose.connection.on('disconnected', () => console.log('MongoDB disconnected'));
mongoose.connection.on('error', (err) => console.error('MongoDB error:', err));

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  process.exit(0);
});

try {
  await mongoose.connect(MONGODB_URI);
  console.log('MongoDB connected:', mongoose.connection.name);

  app.listen(PORT, () => {
    console.log(`Server on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
  });
} catch (err) {
  console.error('MongoDB connection error:', err.message);
  process.exit(1);
}
