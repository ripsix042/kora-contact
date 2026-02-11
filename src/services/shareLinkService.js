import crypto from 'crypto';
import { ShareLink } from '../models/ShareLink.js';
import { AppError } from '../middlewares/errorHandler.js';

const DEFAULT_TTL_MINUTES = () => {
  const raw = parseInt(process.env.SHARE_LINK_TTL_MINUTES || '2', 10);
  return Number.isFinite(raw) && raw > 0 ? raw : 2;
};

const MIN_TTL_SECONDS = 30;
const MAX_TTL_SECONDS = 60 * 60 * 24;

const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const createShareLink = async ({ contactId, createdBy, ttlSeconds, maxUses }) => {
  const token = crypto.randomBytes(32).toString('base64url');
  const tokenHash = hashToken(token);
  const defaultTtlSeconds = DEFAULT_TTL_MINUTES() * 60;
  const isNoExpiry = ttlSeconds === null;
  const resolvedTtl = isNoExpiry ? null : (ttlSeconds ?? defaultTtlSeconds);
  const ttl = resolvedTtl === null ? null : (Number.isFinite(resolvedTtl) ? parseInt(resolvedTtl, 10) : defaultTtlSeconds);

  if (ttl !== null && (ttl < MIN_TTL_SECONDS || ttl > MAX_TTL_SECONDS)) {
    throw new AppError(`TTL must be between ${MIN_TTL_SECONDS}s and ${MAX_TTL_SECONDS}s`, 400);
  }

  const expiresAt = ttl === null ? null : new Date(Date.now() + ttl * 1000);

  let resolvedMaxUses = 1;
  if (maxUses === null) {
    resolvedMaxUses = null;
  } else if (maxUses !== undefined) {
    const parsed = parseInt(maxUses, 10);
    if (!Number.isFinite(parsed) || parsed < 1) {
      throw new AppError('maxUses must be a positive number or null for unlimited', 400);
    }
    resolvedMaxUses = parsed;
  }

  await ShareLink.create({
    contactId,
    tokenHash,
    expiresAt,
    createdBy,
    maxUses: resolvedMaxUses,
  });

  return { token, expiresAt };
};

export const consumeShareLink = async ({ contactId, token }) => {
  if (!token || typeof token !== 'string') {
    throw new AppError('Share link token is required', 400);
  }

  const now = new Date();
  const tokenHash = hashToken(token);

  const result = await ShareLink.findOneAndUpdate(
    {
      contactId,
      tokenHash,
      $and: [
        { $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] },
        { $or: [{ maxUses: null }, { $expr: { $lt: ['$usesCount', '$maxUses'] } }] },
      ],
    },
    { $inc: { usesCount: 1 }, $set: { usedAt: now } },
    { new: true }
  );

  if (!result) {
    throw new AppError('Share link has expired or been used', 410);
  }

  return result;
};
