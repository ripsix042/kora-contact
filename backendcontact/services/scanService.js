import { ContactScan } from '../models/ContactScan.js';
import { Contact } from '../models/Contact.js';

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
