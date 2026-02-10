import express from 'express';
import * as contactController from '../controllers/contactController.js';
import { verifyOktaToken } from '../middlewares/oktaAuth.js';
import { validateContact, validateId, validatePagination } from '../middlewares/validation.js';

const router = express.Router();

// All routes require Okta authentication
router.use(verifyOktaToken);

router.get('/', validatePagination, contactController.getAllContacts);
router.get('/departments', contactController.getDepartments);
router.get('/:id/scans', validateId, contactController.getContactScans);
router.post('/:id/share-link', validateId, contactController.createShareLink);
router.get('/:id', validateId, contactController.getContactById);
router.post('/', validateContact, contactController.createContact);
router.put('/:id', validateId, validateContact, contactController.updateContact);
router.delete('/:id', validateId, contactController.deleteContact);

export default router;

