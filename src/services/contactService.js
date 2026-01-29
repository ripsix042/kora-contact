import { Contact } from '../models/Contact.js';
import { DropdownOption } from '../models/DropdownOption.js';
import { logAuditEvent } from '../utils/auditLogger.js';
import { getQueue } from '../config/redis.js';
import { AppError } from '../middlewares/errorHandler.js';

export const getAllContacts = async (query = {}) => {
  const { search, page = 1, limit = 50 } = query;
  const skip = (page - 1) * limit;

  let filter = {};
  // Only use search if it's a valid non-empty string (not "undefined" or empty)
  if (search && search !== 'undefined' && search.trim() !== '') {
    // Use text search which now includes firstName, lastName, name, email, company, department
    filter = { $text: { $search: search } };
  }

  console.log('🔍 MongoDB Query - Filter:', filter, 'Skip:', skip, 'Limit:', limit);

  const contacts = await Contact.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean(); // Use lean() for better performance

  const total = await Contact.countDocuments(filter);

  console.log('📦 MongoDB returned:', contacts.length, 'contacts');
  if (contacts.length > 0) {
    console.log('📝 First contact sample:', {
      _id: contacts[0]._id,
      firstName: contacts[0].firstName,
      lastName: contacts[0].lastName,
      name: contacts[0].name,
      email: contacts[0].email,
    });
  }

  return {
    contacts,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

const DEPARTMENTS = [
  "CEO's Office",
  'Compliance',
  'Engineering',
  'Finance',
  'Information Security',
  'Innovation',
  'Legal',
  'Marketing',
  'Merchant Success',
  'Operations',
  'People & Culture',
  'Product Design',
  'Product Management',
  'Sales',
  'Treasury',
  'Treasury Engineering',
  'Treasury Finance',
  'Treasury Growth',
  'Treasury Operations',
  'Treasury Product Design',
  'Treasury Product Management',
];

let defaultsSeeded = false;

const ensureDefaultDropdowns = async () => {
  if (defaultsSeeded) return;
  const operations = [
    ...DEPARTMENTS.map((value) => ({
      updateOne: {
        filter: { type: 'department', value },
        update: { $setOnInsert: { type: 'department', value, isActive: true } },
        upsert: true,
      },
    })),
  ];

  await DropdownOption.bulkWrite(operations, { ordered: false });
  defaultsSeeded = true;
};

export const getContactById = async (id) => {
  const contact = await Contact.findById(id);
  if (!contact) {
    throw new AppError('Contact not found', 404);
  }
  return contact;
};

export const createContact = async (contactData, user) => {
  // Validate @korapay.com email
  if (!contactData.email.endsWith('@korapay.com')) {
    throw new AppError('Email must be a @korapay.com address', 400);
  }

  // Normalize data: handle firstName/lastName vs name
  const normalizedData = { ...contactData };
  
  // If firstName/lastName provided, ensure name is set for backward compatibility
  if (normalizedData.firstName && normalizedData.lastName) {
    if (!normalizedData.name) {
      normalizedData.name = `${normalizedData.firstName} ${normalizedData.lastName}`.trim();
    }
  }
  // If only name provided, try to split into firstName/lastName
  else if (normalizedData.name && (!normalizedData.firstName || !normalizedData.lastName)) {
    const nameParts = normalizedData.name.trim().split(/\s+/);
    if (nameParts.length > 0 && !normalizedData.firstName) {
      normalizedData.firstName = nameParts[0];
    }
    if (nameParts.length > 1 && !normalizedData.lastName) {
      normalizedData.lastName = nameParts.slice(1).join(' ');
    }
  }
  
  // Map department to company if company not provided (backward compatibility)
  if (normalizedData.department && !normalizedData.company) {
    normalizedData.company = normalizedData.department;
  }

  // Check for duplicate email or phone
  const existing = await Contact.findOne({
    $or: [{ email: normalizedData.email }, { phone: normalizedData.phone }],
  });

  if (existing) {
    throw new AppError('Contact with this email or phone already exists', 409);
  }

  const contact = await Contact.create({
    ...normalizedData,
    syncStatus: 'pending',
  });

  // Log audit event
  await logAuditEvent('create', 'contact', contact._id.toString(), normalizedData, user);

  // Trigger CardDAV sync (only if Redis is available)
  const syncQueue = getQueue('contact-sync');
  if (syncQueue) {
    await syncQueue.add('sync-contact', {
      contactId: contact._id.toString(),
      action: 'create',
    });
  }

  return contact;
};

export const updateContact = async (id, updateData, user) => {
  const contact = await Contact.findById(id);
  if (!contact) {
    throw new AppError('Contact not found', 404);
  }

  // Validate @korapay.com email if being updated
  if (updateData.email && !updateData.email.endsWith('@korapay.com')) {
    throw new AppError('Email must be a @korapay.com address', 400);
  }

  // Normalize data: handle firstName/lastName vs name
  const normalizedData = { ...updateData };
  
  // If firstName/lastName provided, ensure name is set for backward compatibility
  if (normalizedData.firstName || normalizedData.lastName) {
    const firstName = normalizedData.firstName || contact.firstName || '';
    const lastName = normalizedData.lastName || contact.lastName || '';
    if (firstName || lastName) {
      normalizedData.name = `${firstName} ${lastName}`.trim();
    }
  }
  // If only name provided, try to split into firstName/lastName
  else if (normalizedData.name && (!normalizedData.firstName && !normalizedData.lastName)) {
    const nameParts = normalizedData.name.trim().split(/\s+/);
    if (nameParts.length > 0) {
      normalizedData.firstName = nameParts[0];
    }
    if (nameParts.length > 1) {
      normalizedData.lastName = nameParts.slice(1).join(' ');
    }
  }
  
  // Map department to company if company not provided (backward compatibility)
  if (normalizedData.department && !normalizedData.company) {
    normalizedData.company = normalizedData.department;
  }

  // Check for duplicate email or phone if being updated
  if (normalizedData.email || normalizedData.phone) {
    const existing = await Contact.findOne({
      _id: { $ne: id },
      $or: [
        normalizedData.email ? { email: normalizedData.email } : {},
        normalizedData.phone ? { phone: normalizedData.phone } : {},
      ],
    });

    if (existing) {
      throw new AppError('Contact with this email or phone already exists', 409);
    }
  }

  Object.assign(contact, normalizedData);
  contact.syncStatus = 'pending';
  await contact.save();

  // Log audit event
  await logAuditEvent('update', 'contact', id, normalizedData, user);

  // Trigger CardDAV sync (only if Redis is available)
  const syncQueue = getQueue('contact-sync');
  if (syncQueue) {
    await syncQueue.add('sync-contact', {
      contactId: id,
      action: 'update',
    });
  }

  return contact;
};

export const deleteContact = async (id, user) => {
  const contact = await Contact.findById(id);
  if (!contact) {
    throw new AppError('Contact not found', 404);
  }

  // Use transaction for safe delete
  const session = await Contact.startSession();
  session.startTransaction();

  try {
    await Contact.findByIdAndDelete(id).session(session);

    // Log audit event
    await logAuditEvent('delete', 'contact', id, { deletedContact: contact }, user);

    // Trigger CardDAV sync (only if Redis is available)
    const syncQueue = getQueue('contact-sync');
    if (syncQueue) {
      await syncQueue.add('sync-contact', {
        contactId: id,
        action: 'delete',
      });
    }

    await session.commitTransaction();
    return { message: 'Contact deleted successfully' };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Get unique list of departments
 */
export const getDepartments = async () => {
  await ensureDefaultDropdowns();
  const departments = await DropdownOption.find(
    { type: 'department', isActive: true },
    { value: 1, _id: 0 }
  ).sort({ value: 1 });
  return departments.map((d) => d.value);
};

