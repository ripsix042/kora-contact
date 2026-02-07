import * as scanService from '../services/scanService.js';

/** Get all QR scans (auth required) - for QR Code Scans page */
export const getAllScans = async (req, res, next) => {
  try {
    const result = await scanService.getAllScans({
      page: req.query.page ? parseInt(req.query.page, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit, 10) : 50,
      search: req.query.search,
      country: req.query.country,
      deviceType: req.query.deviceType,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/** Get scan stats for dashboard (auth required) */
export const getScanStats = async (req, res, next) => {
  try {
    const stats = await scanService.getScanStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
};
