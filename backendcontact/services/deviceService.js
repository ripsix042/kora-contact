import { Device } from '../models/Device.js';
import { logAuditEvent } from '../utils/auditLogger.js';
import { getQueue } from '../config/redis.js';
import { AppError } from '../middlewares/errorHandler.js';

export const getAllDevices = async (query = {}) => {
  const { search, status, page = 1, limit = 50 } = query;
  const skip = (page - 1) * limit;

  let filter = {};
  // Only use search if it's a valid non-empty string (not "undefined" or empty)
  if (search && search !== 'undefined' && search.trim() !== '') {
    filter = { $text: { $search: search } };
  }
  if (status) {
    filter.status = status;
  }

  console.log('🔍 MongoDB Query - Filter:', filter, 'Skip:', skip, 'Limit:', limit);

  const devices = await Device.find(filter)
    .populate('assignedTo', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean(); // Use lean() for better performance

  const total = await Device.countDocuments(filter);

  console.log('📦 MongoDB returned:', devices.length, 'devices');
  if (devices.length > 0) {
    console.log('📝 First device sample:', {
      _id: devices[0]._id,
      name: devices[0].name,
      serialNumber: devices[0].serialNumber,
    });
  }

  return {
    devices,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

export const getDeviceById = async (id) => {
  const device = await Device.findById(id).populate('assignedTo', 'name email');
  if (!device) {
    throw new AppError('Device not found', 404);
  }
  return device;
};

export const createDevice = async (deviceData, user) => {
  // Check for duplicate serial number
  const existing = await Device.findOne({ serialNumber: deviceData.serialNumber.toUpperCase() });
  if (existing) {
    throw new AppError('Device with this serial number already exists', 409);
  }

  const device = await Device.create({
    ...deviceData,
    serialNumber: deviceData.serialNumber.toUpperCase(),
    syncStatus: 'pending',
  });

  // Log audit event
  await logAuditEvent('create', 'device', device._id.toString(), deviceData, user);

  // Trigger Mosyle sync (only if Redis is configured)
  const syncQueue = getQueue('device-sync');
  if (syncQueue) {
    await syncQueue.add('sync-device', {
      deviceId: device._id.toString(),
      action: 'create',
    });
  }

  return device;
};

export const updateDevice = async (id, updateData, user) => {
  const device = await Device.findById(id);
  if (!device) {
    throw new AppError('Device not found', 404);
  }

  // Check for duplicate serial number if being updated
  if (updateData.serialNumber) {
    const existing = await Device.findOne({
      _id: { $ne: id },
      serialNumber: updateData.serialNumber.toUpperCase(),
    });

    if (existing) {
      throw new AppError('Device with this serial number already exists', 409);
    }
    updateData.serialNumber = updateData.serialNumber.toUpperCase();
  }

  Object.assign(device, updateData);
  device.syncStatus = 'pending';
  await device.save();

  // Log audit event
  await logAuditEvent('update', 'device', id, updateData, user);

  // Trigger Mosyle sync (only if Redis is configured)
  const syncQueue = getQueue('device-sync');
  if (syncQueue) {
    await syncQueue.add('sync-device', {
      deviceId: id,
      action: 'update',
    });
  }

  return device;
};

export const deleteDevice = async (id, user) => {
  const device = await Device.findById(id);
  if (!device) {
    throw new AppError('Device not found', 404);
  }

  await Device.findByIdAndDelete(id);

  // Log audit event
  await logAuditEvent('delete', 'device', id, { deletedDevice: device }, user);

  // Trigger Mosyle sync (only if Redis is configured)
  const syncQueue = getQueue('device-sync');
  if (syncQueue) {
    await syncQueue.add('sync-device', {
      deviceId: id,
      action: 'delete',
    });
  }

  return { message: 'Device deleted successfully' };
};
