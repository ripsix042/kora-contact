import { IntegrationSettings } from '../models/IntegrationSettings.js';
import { logAuditEvent } from '../utils/auditLogger.js';
import { syncMosyleDevices } from '../services/mosyleService.js';
import { syncAllContactsToCardDAV, testCardDAVConnection } from '../services/carddavService.js';
import { SyncLog } from '../models/SyncLog.js';
import { AppError } from '../middlewares/errorHandler.js';

export const getIntegrationSettings = async (req, res, next) => {
  try {
    const settings = await IntegrationSettings.find();
    const result = settings.map((setting) => ({
      type: setting.type,
      enabled: setting.enabled,
      config: setting.getDecryptedConfig(),
      updatedAt: setting.updatedAt,
    }));
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const updateCardDAVSettings = async (req, res, next) => {
  try {
    const { enabled, url, username, password } = req.body;

    let settings = await IntegrationSettings.findOne({ type: 'carddav' });
    if (!settings) {
      settings = new IntegrationSettings({ type: 'carddav' });
    }

    settings.enabled = enabled !== undefined ? enabled : settings.enabled;
    
    // Build config object, excluding password (it's stored encrypted separately)
    const { password: _, ...configWithoutPassword } = settings.config || {};
    settings.config = {
      ...configWithoutPassword,
      url: url || settings.config?.url,
      username: username || settings.config?.username,
    };

    if (password) {
      settings.setEncryptedField('password', password);
      // Ensure password is removed from config if it exists
      delete settings.config.password;
    }

    await settings.save();

    // Log audit event (skip if no user)
    if (req.user) {
      await logAuditEvent(
        'settings-update',
        'settings',
        'carddav',
        { enabled: settings.enabled },
        req.user
      );
    }

    res.json({
      type: settings.type,
      enabled: settings.enabled,
      config: settings.getDecryptedConfig(),
    });
  } catch (error) {
    next(error);
  }
};

export const updateMosyleSettings = async (req, res, next) => {
  try {
    const { enabled, apiKey, baseUrl } = req.body;

    let settings = await IntegrationSettings.findOne({ type: 'mosyle' });
    if (!settings) {
      settings = new IntegrationSettings({ type: 'mosyle' });
    }

    settings.enabled = enabled !== undefined ? enabled : settings.enabled;
    
    // Build config object, excluding apiKey (it's stored encrypted separately)
    const { apiKey: _, ...configWithoutApiKey } = settings.config || {};
    settings.config = {
      ...configWithoutApiKey,
      baseUrl: baseUrl || settings.config?.baseUrl || 'https://businessapi.mosyle.com',
    };

    if (apiKey) {
      settings.setEncryptedField('apiKey', apiKey);
      // Ensure apiKey is removed from config if it exists
      delete settings.config.apiKey;
    }

    await settings.save();

    // Log audit event (skip if no user)
    if (req.user) {
      await logAuditEvent(
        'settings-update',
        'settings',
        'mosyle',
        { enabled: settings.enabled },
        req.user
      );
    }

    res.json({
      type: settings.type,
      enabled: settings.enabled,
      config: settings.getDecryptedConfig(),
    });
  } catch (error) {
    next(error);
  }
};

export const triggerSync = async (req, res, next) => {
  try {
    const { type } = req.params;

    if (type === 'mosyle') {
      const syncLog = await syncMosyleDevices();
      res.json({
        message: 'Mosyle sync initiated',
        syncLogId: syncLog._id.toString(),
      });
    } else if (type === 'carddav') {
      // Trigger bulk sync for CardDAV
      const syncLog = await syncAllContactsToCardDAV();
      res.json({
        message: 'CardDAV sync initiated',
        syncLogId: syncLog._id.toString(),
        status: syncLog.status,
        recordsProcessed: syncLog.recordsProcessed,
        recordsSucceeded: syncLog.recordsSucceeded,
        recordsFailed: syncLog.recordsFailed,
      });
    } else {
      throw new AppError('Invalid sync type', 400);
    }
  } catch (error) {
    next(error);
  }
};

export const testCardDAVConnectionController = async (req, res, next) => {
  try {
    const result = await testCardDAVConnection();
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getLastSyncStatus = async (req, res, next) => {
  try {
    const { type } = req.query;
    const query = type ? { type } : {};
    
    const lastSync = await SyncLog.findOne(query)
      .sort({ createdAt: -1 })
      .lean();

    if (!lastSync) {
      return res.json(null);
    }

    res.json({
      id: lastSync._id.toString(),
      type: lastSync.type,
      status: lastSync.status,
      startedAt: lastSync.startedAt,
      completedAt: lastSync.completedAt,
      recordsProcessed: lastSync.recordsProcessed,
      recordsSucceeded: lastSync.recordsSucceeded,
      recordsFailed: lastSync.recordsFailed,
      errorDetails: lastSync.errorDetails,
      createdAt: lastSync.createdAt,
      updatedAt: lastSync.updatedAt,
    });
  } catch (error) {
    next(error);
  }
};
