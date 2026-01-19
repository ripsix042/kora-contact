import { Device } from '../models/Device.js';
import { IntegrationSettings } from '../models/IntegrationSettings.js';
import { SyncLog } from '../models/SyncLog.js';
import { AppError } from '../middlewares/errorHandler.js';

/**
 * Fetch devices from Mosyle API
 */
export const fetchMosyleDevices = async () => {
  const settings = await IntegrationSettings.findOne({ type: 'mosyle' });
  if (!settings || !settings.enabled) {
    throw new AppError('Mosyle integration not configured or enabled', 400);
  }

  const config = settings.getDecryptedConfig();
  const apiKey = config.apiKey;
  const baseUrl = config.baseUrl || 'https://businessapi.mosyle.com';

  if (!apiKey) {
    throw new AppError('Mosyle API key not configured', 400);
  }

  try {
    const response = await fetch(`${baseUrl}/v1/devices`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Mosyle API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.devices || [];
  } catch (error) {
    console.error('Mosyle API fetch error:', error);
    throw new AppError(`Failed to fetch from Mosyle: ${error.message}`, 500);
  }
};

/**
 * Sync devices from Mosyle to local database
 */
export const syncMosyleDevices = async () => {
  const syncLog = await SyncLog.create({
    type: 'mosyle',
    status: 'in-progress',
    startedAt: new Date(),
  });

  try {
    const mosyleDevices = await fetchMosyleDevices();
    let processed = 0;
    let succeeded = 0;
    let failed = 0;
    const errors = [];

    for (const mosyleDevice of mosyleDevices) {
      processed++;
      try {
        // Match by serial number
        const existingDevice = await Device.findOne({
          serialNumber: mosyleDevice.serial_number?.toUpperCase(),
        });

        const deviceData = {
          name: mosyleDevice.name || mosyleDevice.device_name || 'Unknown Device',
          serialNumber: mosyleDevice.serial_number?.toUpperCase(),
          model: mosyleDevice.model || mosyleDevice.device_model,
          osVersion: mosyleDevice.os_version || mosyleDevice.osversion,
          mosyleDeviceId: mosyleDevice.id?.toString(),
          lastSyncedAt: new Date(),
          syncStatus: 'synced',
        };

        if (existingDevice) {
          Object.assign(existingDevice, deviceData);
          await existingDevice.save();
        } else {
          await Device.create(deviceData);
        }

        succeeded++;
      } catch (error) {
        failed++;
        errors.push({
          row: processed,
          message: error.message,
          data: mosyleDevice,
        });
      }
    }

    syncLog.status = 'completed';
    syncLog.completedAt = new Date();
    syncLog.recordsProcessed = processed;
    syncLog.recordsSucceeded = succeeded;
    syncLog.recordsFailed = failed;
    syncLog.errorDetails = errors;
    await syncLog.save();

    return syncLog;
  } catch (error) {
    syncLog.status = 'failed';
    syncLog.completedAt = new Date();
    syncLog.errorDetails.push({
      row: 0,
      message: error.message,
    });
    await syncLog.save();
    throw error;
  }
};

