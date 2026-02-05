import express from 'express';
import * as invitationController from '../controllers/invitationController.js';
import { verifyOktaToken, requireAdmin } from '../middlewares/oktaAuth.js';
import { validateInvitation } from '../middlewares/validation.js';

const router = express.Router();

// All routes require Okta authentication
router.use(verifyOktaToken);

// All routes require admin access
router.use(requireAdmin);

router.post('/', validateInvitation, invitationController.createInvitation);
router.get('/', invitationController.getAllInvitations);
router.get('/:token', invitationController.getInvitationByToken);

export default router;


