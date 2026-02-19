import { ContactScan } from '../models/ContactScan.js';
import { Contact } from '../models/Contact.js';

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : forwarded[0];
  }
  return req.ip || req.connection?.remoteAddress || null;
};

const isPrivateIp = (ip) => {
  if (!ip) return true;
  const s = String(ip).trim();
  if (s === '127.0.0.1' || s === '::1' || s === '::ffff:127.0.0.1') return true;
  if (s.startsWith('192.168.') || s.startsWith('10.') || s.startsWith('172.16.') || s.startsWith('172.17.') || s.startsWith('172.18.') || s.startsWith('172.19.') || s.startsWith('172.2') || s.startsWith('172.30.') || s.startsWith('172.31.')) return true;
  return false;
};

const fetchLocationFromIp = async (ip) => {
  if (!ip) return { country: 'Unknown', region: null, city: null };
  if (isPrivateIp(ip)) return { country: 'Local Network', region: null, city: null };
  try {
    const res = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,regionName,city`,
      { signal: AbortSignal.timeout(3000) }
    );
    const data = await res.json();
    if (data?.status === 'success') {
      return {
        country: data.country || null,
        region: data.regionName || null,
        city: data.city || null,
      };
    }
  } catch (err) {
    console.warn('IP geolocation failed:', err.message);
  }
  return { country: 'Unknown', region: null, city: null };
};

const parseUserAgent = async (userAgent) => {
  if (!userAgent) return {};
  try {
    const { default: UAParser } = await import('ua-parser-js');
    const parser = new UAParser(userAgent);
    const device = parser.getDevice();
    const browser = parser.getBrowser();
    const os = parser.getOS();
    return {
      type: device.type || 'desktop',
      browser: [browser.name, browser.version].filter(Boolean).join(' ') || null,
      os: [os.name, os.version].filter(Boolean).join(' ') || null,
    };
  } catch {
    return {};
  }
};

/**
 * Log a QR scan event when someone opens a share link (fire-and-forget).
 * Uses IP geolocation so country is set; without this, country stays "Unknown".
 */
export const logContactScan = async (contactId, req) => {
  const ip = getClientIp(req);
  const userAgent = req.headers['user-agent'] || null;
  (async () => {
    try {
      const location = await fetchLocationFromIp(ip);
      const device = await parseUserAgent(userAgent);
      await ContactScan.create({
        contactId,
        ip,
        location: location || {},
        device,
        userAgent,
      });
    } catch (err) {
      console.warn('Failed to log contact scan:', err.message);
    }
  })();
};

/**
 * Get scan history for a contact
 */
export const getContactScans = async (contactId, options = {}) => {
  const { limit = 50, page = 1 } = options;
  const skip = (page - 1) * limit;

  const [scans, total] = await Promise.all([
    ContactScan.find({ contactId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-userAgent')
      .lean(),
    ContactScan.countDocuments({ contactId }),
  ]);

  return {
    scans,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get all scans across contacts (for QR Code Scans page)
 */
export const getAllScans = async (options = {}) => {
  const { limit = 50, page = 1, search, country, deviceType } = options;
  const skip = (page - 1) * limit;

  let filter = {};
  if (country) {
    filter['location.country'] = new RegExp(country, 'i');
  }
  if (deviceType) {
    filter['device.type'] = new RegExp(deviceType, 'i');
  }
  if (search && search.trim()) {
    const nameRegex = new RegExp(search.trim(), 'i');
    const matchingContacts = await Contact.find({
      $or: [
        { firstName: nameRegex },
        { lastName: nameRegex },
        { name: nameRegex },
      ],
    })
      .select('_id')
      .lean();
    const ids = matchingContacts.map((c) => c._id);
    filter.contactId = { $in: ids };
  }

  const [scans, total] = await Promise.all([
    ContactScan.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-userAgent')
      .lean(),
    ContactScan.countDocuments(filter),
  ]);

  const contactIds = [...new Set(scans.map((s) => s.contactId?.toString()).filter(Boolean))];
  const contacts = await Contact.find({ _id: { $in: contactIds } })
    .select('_id firstName lastName name')
    .lean();
  const contactMap = Object.fromEntries(
    contacts.map((c) => [
      c._id.toString(),
      c.firstName && c.lastName
        ? `${c.firstName} ${c.lastName}`.trim()
        : (c.name || 'Unknown'),
    ])
  );

  const enriched = scans.map((s) => ({
    ...s,
    contactName: contactMap[s.contactId?.toString()] || 'Unknown',
  }));

  return {
    scans: enriched,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get scan stats: total count and by country
 */
export const getScanStats = async () => {
  const total = await ContactScan.countDocuments();
  const byCountry = await ContactScan.aggregate([
    { $match: { 'location.country': { $exists: true, $ne: null, $ne: '' } } },
    { $group: { _id: '$location.country', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);
  return {
    total,
    byCountry: byCountry.map((b) => ({ country: b._id, count: b.count })),
  };
};
