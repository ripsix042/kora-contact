import express from 'express';
import * as dashboardController from '../controllers/dashboardController.js';
import { verifyOktaToken } from '../middlewares/oktaAuth.js';

const router = express.Router();

// All routes require Okta authentication
router.use(verifyOktaToken);

router.get('/', dashboardController.getDashboard);

export default router;

