import { getLastWeeklyReportService, sendWeeklyReportService } from "../services/weeklyReport.service.js";

export const sendNowWeeklyReport = async (req, res, next) => {
  try {
    const data = await sendWeeklyReportService({
      triggeredBy: "manual",
      triggeredByUser: req.user?.email || req.user?.id || null,
    });

    return res.status(200).json({
      success: true,
      message: "Weekly report sent successfully",
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
