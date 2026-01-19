import express from 'express';
import * as userController from '../controllers/userController.js';
import { verifyOktaToken, requireAdmin } from '../middlewares/oktaAuth.js';
import { validateId, validateUserRole } from '../middlewares/validation.js';

const router = express.Router();

// All routes require Okta authentication
router.use(verifyOktaToken);

// Route to get current user (no admin required)
router.get('/me', userController.getCurrentUser);

// All other routes require admin access
router.use(requireAdmin);

router.get('/', userController.getAllUsers);
router.put('/:id/role', validateId, validateUserRole, userController.updateUserRole);

export default router;
