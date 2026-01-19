import { Contact } from '../models/Contact.js';
import { logAuditEvent } from '../utils/auditLogger.js';
import { getQueue } from '../config/redis.js';
import { AppError } from '../middlewares/errorHandler.js';

export const getAllContacts = async (query = {}) => {
  const { search, page = 1, limit = 50 } = query;
  const skip = (page - 1) * limit;

  let filter = {};
  // Only use search if it's a valid non-empty string (not "undefined" or empty)
  if (search && search !== 'undefined' && search.trim() !== '') {
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

  // Check for duplicate email or phone
  const existing = await Contact.findOne({
    $or: [{ email: contactData.email }, { phone: contactData.phone }],
  });

  if (existing) {
    throw new AppError('Contact with this email or phone already exists', 409);
  }

  const contact = await Contact.create({
    ...contactData,
    syncStatus: 'pending',
  });

  // Log audit event
  await logAuditEvent('create', 'contact', contact._id.toString(), contactData, user);

  // Trigger CardDAV sync
  const syncQueue = getQueue('contact-sync');
  await syncQueue.add('sync-contact', {
    contactId: contact._id.toString(),
    action: 'create',
  });

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

  // Check for duplicate email or phone if being updated
  if (updateData.email || updateData.phone) {
    const existing = await Contact.findOne({
      _id: { $ne: id },
      $or: [
        updateData.email ? { email: updateData.email } : {},
        updateData.phone ? { phone: updateData.phone } : {},
      ],
    });

    if (existing) {
      throw new AppError('Contact with this email or phone already exists', 409);
    }
  }

  Object.assign(contact, updateData);
  contact.syncStatus = 'pending';
  await contact.save();

  // Log audit event
  await logAuditEvent('update', 'contact', id, updateData, user);

  // Trigger CardDAV sync
  const syncQueue = getQueue('contact-sync');
  await syncQueue.add('sync-contact', {
    contactId: id,
    action: 'update',
  });

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

    // Trigger CardDAV sync
    const syncQueue = getQueue('contact-sync');
    await syncQueue.add('sync-contact', {
      contactId: id,
      action: 'delete',
    });

    await session.commitTransaction();
    return { message: 'Contact deleted successfully' };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

