import {
  getDashboardSummary,
  getHiringFunnel,
  getWeeklyHiringStats,
} from "../services/dashboard.service.js";

export const getSummary = async (req, res, next) => {
  try {
    const data = await getDashboardSummary();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

export const getFunnel = async (req, res, next) => {
  try {
    const data = await getHiringFunnel();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

export const getWeeklyStats = async (req, res, next) => {
  try {
    const data = await getWeeklyHiringStats(req.query.weeks);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};
