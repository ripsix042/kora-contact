import express from 'express';
import * as deviceController from '../controllers/deviceController.js';
import { verifyOktaToken } from '../middlewares/oktaAuth.js';
import { validateDevice, validateId, validatePagination } from '../middlewares/validation.js';

const router = express.Router();

// All routes require Okta authentication
router.use(verifyOktaToken);

router.get('/', validatePagination, deviceController.getAllDevices);
router.get('/:id', validateId, deviceController.getDeviceById);
router.post('/', validateDevice, deviceController.createDevice);
router.put('/:id', validateId, validateDevice, deviceController.updateDevice);
router.delete('/:id', validateId, deviceController.deleteDevice);

export default router;

