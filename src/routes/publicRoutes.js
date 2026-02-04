import express from 'express';
import * as contactController from '../controllers/contactController.js';
import { validateId } from '../middlewares/validation.js';

const router = express.Router();

/** GET /api/public/contacts/:id - No auth required (for QR code / share links) */
router.get('/contacts/:id', validateId, contactController.getPublicContactById);

export default router;
