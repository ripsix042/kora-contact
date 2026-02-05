import express from 'express';
import * as settingsController from '../controllers/settingsController.js';
// Comment out Okta middleware (temporarily disabled)
// import { verifyOktaToken, requireAdmin } from '../middlewares/oktaAuth.js';

const router = express.Router();

// All routes require Okta authentication (commented out temporarily)
// router.use(verifyOktaToken);
// router.use(requireAdmin);

router.get('/integrations', settingsController.getIntegrationSettings);
router.put('/integrations/carddav', settingsController.updateCardDAVSettings);
router.put('/integrations/mosyle', settingsController.updateMosyleSettings);
router.post('/integrations/:type/sync', settingsController.triggerSync);
router.post('/integrations/carddav/test', settingsController.testCardDAVConnectionController);
router.get('/integrations/sync-status', settingsController.getLastSyncStatus);

export default router;

