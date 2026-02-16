import express from 'express';
import * as scanController from '../controllers/scanController.js';
import { verifyOktaToken } from '../middlewares/oktaAuth.js';

const router = express.Router();

router.use(verifyOktaToken);

router.get('/stats', scanController.getScanStats);
router.get('/', scanController.getAllScans);

export default router;
