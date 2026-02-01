import express from 'express';
import * as bulkUploadController from '../controllers/bulkUploadController.js';
import { verifyOktaToken, requireAdmin } from '../middlewares/oktaAuth.js';

const router = express.Router();

// All routes require Okta authentication and admin group
router.use(verifyOktaToken);
router.use(requireAdmin);

router.post('/contacts', bulkUploadController.uploadContacts);
router.post('/devices', bulkUploadController.uploadDevices);

export default router;

