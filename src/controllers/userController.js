import * as userService from '../services/userService.js';
import { AppError } from '../middlewares/errorHandler.js';

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await userService.getAllUsers();
    res.json({ users });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (req, res, next) => {
  try {
    // Get or create user based on authenticated email
    // Set admin role if user is in kora-admin group
    const isAdmin = req.user.groups?.includes('kora-admin') || false;
    const user = await userService.createOrUpdateUser(req.user.email, req.user.oktaSub, isAdmin);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const { id } = req.params;

    if (!role || !['admin', 'user'].includes(role)) {
      throw new AppError('Role is required and must be "admin" or "user"', 400);
    }

    const user = await userService.updateUserRole(id, role, req.user);
    res.json(user);
  } catch (error) {
    next(error);
  }
};
