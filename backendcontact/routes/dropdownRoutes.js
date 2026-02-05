import express from 'express';
import * as dropdownController from '../controllers/dropdownController.js';
import { verifyOktaToken, requireAdmin } from '../middlewares/oktaAuth.js';
import { validateId } from '../middlewares/validation.js';

const router = express.Router();

// All routes require Okta authentication
router.use(verifyOktaToken);

// Read access for authenticated users
router.get('/', dropdownController.getDropdowns);

// Write access for admins only
router.use(requireAdmin);
router.post('/', dropdownController.createDropdown);
router.put('/:id', validateId, dropdownController.updateDropdown);
router.delete('/:id', validateId, dropdownController.deleteDropdown);

export default router;
