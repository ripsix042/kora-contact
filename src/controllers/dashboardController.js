import * as dashboardService from '../services/dashboardService.js';

export const getDashboard = async (req, res, next) => {
  try {
    const metrics = await dashboardService.getDashboardMetrics();
    res.json(metrics);
  } catch (error) {
    next(error);
  }
};

