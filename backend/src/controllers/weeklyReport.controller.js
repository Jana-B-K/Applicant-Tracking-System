import {
  getLastWeeklyReportService,
  getWeeklyReportHistoryService,
  sendWeeklyReportService,
} from "../services/weeklyReport.service.js";

const resolveTriggeringUser = (req) => req.user?.email || req.user?.id || null;
const resolveReportFilters = (req) => {
  const source = {
    ...(req.query || {}),
    ...((req.body && typeof req.body === "object") ? req.body : {}),
  };

  return {
    department: source.department,
    jobTitle: source.jobTitle,
    recruiter: source.recruiter,
    location: source.location,
    dateFrom: source.dateFrom,
    dateTo: source.dateTo,
  };
};

export const sendNowWeeklyReportExcel = async (req, res, next) => {
  try {
    const data = await sendWeeklyReportService({
      triggeredBy: "manual",
      triggeredByUser: resolveTriggeringUser(req),
      format: "xlsx",
      filters: resolveReportFilters(req),
    });

    return res.status(200).json({
      success: true,
      message: "Weekly Excel report sent successfully",
      data,
    });
  } catch (error) {
    return next(error);
  }
};

export const sendNowWeeklyReportPdf = async (req, res, next) => {
  try {
    const data = await sendWeeklyReportService({
      triggeredBy: "manual",
      triggeredByUser: resolveTriggeringUser(req),
      format: "pdf",
      filters: resolveReportFilters(req),
    });

    return res.status(200).json({
      success: true,
      message: "Weekly PDF report sent successfully",
      data,
    });
  } catch (error) {
    return next(error);
  }
};

export const getLastWeeklyReportDate = async (req, res, next) => {
  try {
    const data = await getLastWeeklyReportService();

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return next(error);
  }
};

export const getWeeklyReportHistory = async (req, res, next) => {
  try {
    const data = await getWeeklyReportHistoryService({
      dateFrom: req.query?.dateFrom,
      dateTo: req.query?.dateTo,
      format: req.query?.format,
      status: req.query?.status,
      limit: req.query?.limit,
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return next(error);
  }
};
