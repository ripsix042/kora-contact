import { DropdownOption } from '../models/DropdownOption.js';
import { AppError } from '../middlewares/errorHandler.js';

const normalizeType = (type) => {
  if (!type) return null;
  const normalized = String(type).trim().toLowerCase();
  if (normalized !== 'department' && normalized !== 'role') return null;
  return normalized;
};

export const getDropdowns = async (query = {}) => {
  const type = normalizeType(query.type);
  const filter = {};
  if (type) {
    filter.type = type;
  }
  const items = await DropdownOption.find(filter).sort({ type: 1, value: 1 });
  return items;
};

export const createDropdown = async (data) => {
  const type = normalizeType(data?.type);
  const value = String(data?.value || '').trim();
  if (!type) {
    throw new AppError('type must be department or role', 400);
  }
  if (!value) {
    throw new AppError('value is required', 400);
  }
  const created = await DropdownOption.create({
    type,
    value,
    isActive: data?.isActive !== undefined ? !!data.isActive : true,
  });
  return created;
};

export const updateDropdown = async (id, data) => {
  const updates = {};
  if (data?.type !== undefined) {
    const type = normalizeType(data.type);
    if (!type) {
      throw new AppError('type must be department or role', 400);
    }
    updates.type = type;
  }
  if (data?.value !== undefined) {
    const value = String(data.value || '').trim();
    if (!value) {
      throw new AppError('value is required', 400);
    }
    updates.value = value;
  }
  if (data?.isActive !== undefined) {
    updates.isActive = !!data.isActive;
  }
  const updated = await DropdownOption.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });
  if (!updated) {
    throw new AppError('Dropdown option not found', 404);
  }
  return updated;
};

export const deleteDropdown = async (id) => {
  const deleted = await DropdownOption.findByIdAndDelete(id);
  if (!deleted) {
    throw new AppError('Dropdown option not found', 404);
  }
  return { message: 'Dropdown option deleted successfully' };
};
