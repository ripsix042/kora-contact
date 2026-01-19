import * as invitationService from '../services/invitationService.js';
import { AppError } from '../middlewares/errorHandler.js';

export const createInvitation = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      throw new AppError('Valid email address is required', 400);
    }

    const invitation = await invitationService.createInvitation(email, req.user);
    res.status(201).json(invitation);
  } catch (error) {
    next(error);
  }
};

export const getAllInvitations = async (req, res, next) => {
  try {
    const invitations = await invitationService.getAllInvitations();
    res.json({ invitations });
  } catch (error) {
    next(error);
  }
};

export const getInvitationByToken = async (req, res, next) => {
  try {
    const { token } = req.params;
    const invitation = await invitationService.getInvitationByToken(token);
    res.json(invitation);
  } catch (error) {
    next(error);
  }
};


