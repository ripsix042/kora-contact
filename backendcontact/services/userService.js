import { User } from '../models/User.js';
import { logAuditEvent } from '../utils/auditLogger.js';
import { AppError } from '../middlewares/errorHandler.js';

export const getAllUsers = async () => {
  const users = await User.find()
    .sort({ createdAt: -1 })
    .lean();
  
  return users;
};

export const getUserByEmail = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  return user;
};

export const createOrUpdateUser = async (email, oktaSub = null, isAdmin = false) => {
  const updateData = {
    email: email.toLowerCase(),
    ...(oktaSub && { oktaSub }),
  };

  // If this is a new user and they should be admin, set role to admin
  // If existing user, only update admin role if explicitly requested
  const user = await User.findOne({ email: email.toLowerCase() });
  
  if (!user) {
    // New user - set role based on isAdmin parameter
    updateData.role = isAdmin ? 'admin' : 'user';
  } else if (isAdmin && user.role !== 'admin') {
    // Existing user - upgrade to admin if they're in the admin group
    updateData.role = 'admin';
  }

  const updatedUser = await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    updateData,
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );
  
  return updatedUser;
};

export const updateUserRole = async (userId, newRole, actor) => {
  if (!['admin', 'user'].includes(newRole)) {
    throw new AppError('Invalid role. Must be "admin" or "user"', 400);
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const oldRole = user.role;
  user.role = newRole;
  await user.save();

  await logAuditEvent(
    'update',
    'user',
    user._id.toString(),
    { old: { role: oldRole }, new: { role: newRole } },
    actor
  );

  return user;
};
