import {
  getDashboardSummary,
  getHiringFunnel,
  getWeeklyHiringStats,
  getHiringAlerts,
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

export const getAlerts = async (req, res, next) => {
  try {
    const data = await getHiringAlerts({
      endInDays: req.query.endInDays,
      transitionDays: req.query.transitionDays,
      transitionLimit: req.query.transitionLimit,
      agingDays: req.query.agingDays,
      interviewDoneDays: req.query.interviewDoneDays,
      interviewLimit: req.query.interviewLimit,
      newApplicantDays: req.query.newApplicantDays,
    });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};
