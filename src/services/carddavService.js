import { Contact } from '../models/Contact.js';
import { IntegrationSettings } from '../models/IntegrationSettings.js';
import { SyncLog } from '../models/SyncLog.js';
import { AppError } from '../middlewares/errorHandler.js';

/**
 * Generate vCard format for a contact
 */
const generateVCard = (contact) => {
  // Get full name - prefer firstName/lastName, fallback to name
  const fullName = (contact.firstName && contact.lastName)
    ? `${contact.firstName} ${contact.lastName}`.trim()
    : (contact.name || '');
  
  const lastName = contact.lastName || '';
  const firstName = contact.firstName || '';
  
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${fullName}`,
  ];
  
  // Add structured name (N field)
  if (lastName || firstName) {
    lines.push(`N:${lastName};${firstName};;;`);
  } else if (fullName) {
    // Fallback: try to split name
    const nameParts = fullName.split(/\s+/);
    const last = nameParts.length > 1 ? nameParts.slice(-1)[0] : '';
    const first = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : fullName;
    lines.push(`N:${last};${first};;;`);
  }
  
  lines.push(`EMAIL:${contact.email}`);
  lines.push(`TEL:${contact.phone}`);

  // Organization (prefer department, fallback to company)
  if (contact.department) {
    lines.push(`ORG:${contact.department}`);
  } else if (contact.company) {
    lines.push(`ORG:${contact.company}`);
  }
  
  // Title (prefer jobRole, fallback to title)
  if (contact.jobRole) {
    lines.push(`TITLE:${contact.jobRole}`);
  } else if (contact.title) {
    lines.push(`TITLE:${contact.title}`);
  }
  
  // Department (if different from org)
  if (contact.department && contact.company && contact.department !== contact.company) {
    lines.push(`X-DEPARTMENT:${contact.department}`);
  }
  
  // LinkedIn URL
  if (contact.linkedIn) {
    lines.push(`URL:${contact.linkedIn}`);
  }
  
  // Notes
  if (contact.notes) {
    lines.push(`NOTE:${contact.notes}`);
  }

  lines.push('END:VCARD');
  return lines.join('\r\n');
};

/**
 * Sync a single contact to CardDAV
 */
export const syncContactToCardDAV = async (contactId, action) => {
  const settings = await IntegrationSettings.findOne({ type: 'carddav' });
  if (!settings || !settings.enabled) {
    console.log('CardDAV integration not enabled, skipping sync');
    return;
  }

  const contact = await Contact.findById(contactId);
  if (!contact) {
    throw new AppError('Contact not found', 404);
  }

  const config = settings.getDecryptedConfig();
  const url = config.url;
  const username = config.username;
  const password = config.password;

  if (!url || !username || !password) {
    throw new AppError('CardDAV credentials not configured', 400);
  }

  try {
    const vcard = generateVCard(contact);
    const contactUrl = `${url}/${contact._id}.vcf`;

    if (action === 'delete') {
      // DELETE request
      const response = await fetch(contactUrl, {
        method: 'DELETE',
        headers: {
          Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
        },
      });

      if (!response.ok && response.status !== 404) {
        throw new Error(`CardDAV DELETE failed: ${response.status}`);
      }
    } else {
      // PUT request for create/update
      const response = await fetch(contactUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'text/vcard',
          Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
        },
        body: vcard,
      });

      if (!response.ok) {
        throw new Error(`CardDAV PUT failed: ${response.status}`);
      }
    }

    contact.syncedAt = new Date();
    contact.syncStatus = 'synced';
    await contact.save();
  } catch (error) {
    console.error('CardDAV sync error:', error);
    contact.syncStatus = 'failed';
    await contact.save();
    throw error;
  }
};

/**
 * Sync all contacts to CardDAV
 */
export const syncAllContactsToCardDAV = async () => {
  const settings = await IntegrationSettings.findOne({ type: 'carddav' });
  if (!settings || !settings.enabled) {
    throw new AppError('CardDAV integration not enabled', 400);
  }

  const config = settings.getDecryptedConfig();
  const url = config.url;
  const username = config.username;
  const password = config.password;

  if (!url || !username || !password) {
    throw new AppError('CardDAV credentials not configured', 400);
  }

  // Create sync log
  const syncLog = await SyncLog.create({
    type: 'carddav',
    status: 'in-progress',
    startedAt: new Date(),
  });

  try {
    // Get all contacts
    const contacts = await Contact.find();
    let processed = 0;
    let succeeded = 0;
    let failed = 0;
    const errors = [];

    for (const contact of contacts) {
      processed++;
      try {
        const vcard = generateVCard(contact);
        const contactUrl = `${url}/${contact._id}.vcf`;

        const response = await fetch(contactUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': 'text/vcard',
            Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
          },
          body: vcard,
        });

        if (!response.ok) {
          throw new Error(`CardDAV PUT failed: ${response.status}`);
        }

        contact.syncedAt = new Date();
        contact.syncStatus = 'synced';
        await contact.save();

        succeeded++;
      } catch (error) {
        failed++;
        errors.push({
          row: processed,
          message: error.message,
          data: { contactId: contact._id.toString(), name: contact.name },
        });

        // Mark contact as failed
        contact.syncStatus = 'failed';
        await contact.save();
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

/**
 * Test CardDAV connection
 */
export const testCardDAVConnection = async () => {
  const settings = await IntegrationSettings.findOne({ type: 'carddav' });
  if (!settings) {
    throw new AppError('CardDAV settings not found', 404);
  }

  const config = settings.getDecryptedConfig();
  const url = config.url;
  const username = config.username;
  const password = config.password;

  if (!url || !username || !password) {
    throw new AppError('CardDAV credentials not configured', 400);
  }

  try {
    // Try to make a PROPFIND request to test connection
    const response = await fetch(url, {
      method: 'PROPFIND',
      headers: {
        'Depth': '0',
        'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
      },
    });

    if (response.status === 401 || response.status === 403) {
      throw new Error('Authentication failed');
    }

    if (!response.ok && response.status !== 207) {
      throw new Error(`Connection failed: ${response.status} ${response.statusText}`);
    }

    return { success: true, message: 'Connection successful' };
  } catch (error) {
    throw new AppError(`CardDAV connection test failed: ${error.message}`, 400);
  }
};

