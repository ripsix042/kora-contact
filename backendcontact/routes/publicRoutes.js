import express from 'express';
import * as contactController from '../controllers/contactController.js';
import { validateId } from '../middlewares/validation.js';

const router = express.Router();

/** GET /contacts/:id?token=... - No auth (for QR/share links). Token required in query. */
router.get('/contacts/:id', validateId, contactController.getPublicContactById);

export default router;
