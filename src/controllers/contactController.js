import * as contactService from '../services/contactService.js';
import * as scanService from '../services/scanService.js';
import * as shareLinkService from '../services/shareLinkService.js';
import { AppError } from '../middlewares/errorHandler.js';

export const getAllContacts = async (req, res, next) => {
  try {
    console.log(' GET /api/contacts - Query params:', req.query);
    const result = await contactService.getAllContacts(req.query);
    console.log(' Contacts fetched from MongoDB:', result.contacts?.length || 0, 'contacts');
    console.log('Total contacts in DB:', result.pagination?.total || 0);
    res.json(result);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    next(error);
  }
};

export const getContactById = async (req, res, next) => {
  try {
    const contact = await contactService.getContactById(req.params.id);
    res.json(contact);
  } catch (error) {
    next(error);
  }
};

/** Create a single-use share link token (auth required) */
export const createShareLink = async (req, res, next) => {
  try {
    const contactId = req.params.id;
    await contactService.getContactById(contactId);
    const createdBy = req.user?.email || req.user?.oktaSub || 'unknown';
    const ttlSeconds = req.body?.ttlSeconds;
    const maxUses = req.body?.maxUses;
    const result = await shareLinkService.createShareLink({
      contactId,
      createdBy,
      ttlSeconds,
      maxUses,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/** Public (no auth): get contact by ID for QR/share links */
export const getPublicContactById = async (req, res, next) => {
  try {
    const token = req.query?.token;
    await shareLinkService.consumeShareLink({ contactId: req.params.id, token });
    const contact = await contactService.getContactById(req.params.id);
    scanService.logContactScan(req.params.id, req);
    res.json(contact);
  } catch (error) {
    next(error);
  }
};

export const createContact = async (req, res, next) => {
  try {
    const contact = await contactService.createContact(req.body, req.user);
    res.status(201).json(contact);
  } catch (error) {
    next(error);
  }
};

export const updateContact = async (req, res, next) => {
  try {
    const contact = await contactService.updateContact(req.params.id, req.body, req.user);
    res.json(contact);
  } catch (error) {
    next(error);
  }
};

export const deleteContact = async (req, res, next) => {
  try {
    const result = await contactService.deleteContact(req.params.id, req.user);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getDepartments = async (req, res, next) => {
  try {
    const departments = await contactService.getDepartments();
    res.json(departments);
  } catch (error) {
    next(error);
  }
};

/** Get QR scan history for a contact (auth required) */
export const getContactScans = async (req, res, next) => {
  try {
    const result = await scanService.getContactScans(req.params.id, {
      page: req.query.page ? parseInt(req.query.page, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit, 10) : 50,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};
