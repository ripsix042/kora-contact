import * as deviceService from '../services/deviceService.js';
import { AppError } from '../middlewares/errorHandler.js';

export const getAllDevices = async (req, res, next) => {
  try {
    console.log('📥 GET /api/devices - Query params:', req.query);
    const result = await deviceService.getAllDevices(req.query);
    console.log('✅ Devices fetched from MongoDB:', result.devices?.length || 0, 'devices');
    console.log('📊 Total devices in DB:', result.pagination?.total || 0);
    res.json(result);
  } catch (error) {
    console.error('❌ Error fetching devices:', error);
    next(error);
  }
};

export const getDeviceById = async (req, res, next) => {
  try {
    const device = await deviceService.getDeviceById(req.params.id);
    res.json(device);
  } catch (error) {
    next(error);
  }
};

export const createDevice = async (req, res, next) => {
  try {
    const device = await deviceService.createDevice(req.body, req.user);
    res.status(201).json(device);
  } catch (error) {
    next(error);
  }
};

export const updateDevice = async (req, res, next) => {
  try {
    const device = await deviceService.updateDevice(req.params.id, req.body, req.user);
    res.json(device);
  } catch (error) {
    next(error);
  }
};

export const deleteDevice = async (req, res, next) => {
  try {
    const result = await deviceService.deleteDevice(req.params.id, req.user);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

