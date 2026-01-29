import * as dropdownService from '../services/dropdownService.js';

export const getDropdowns = async (req, res, next) => {
  try {
    const items = await dropdownService.getDropdowns(req.query);
    res.json(items);
  } catch (error) {
    next(error);
  }
};

export const createDropdown = async (req, res, next) => {
  try {
    const created = await dropdownService.createDropdown(req.body);
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
};

export const updateDropdown = async (req, res, next) => {
  try {
    const updated = await dropdownService.updateDropdown(req.params.id, req.body);
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const deleteDropdown = async (req, res, next) => {
  try {
    const result = await dropdownService.deleteDropdown(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
