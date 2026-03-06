import {
  getDashboardSummary,
  getHiringFunnel,
  getWeeklyHiringStats,
  getHiringAlerts,
} from "../services/dashboard.service.js";
import { markAlertReadForUser, markAllAlertsReadForUser } from "../services/alert.service.js";

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
      userId: req.user?._id || null,
    });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

export const markAllAlertsRead = async (req, res, next) => {
  try {
    const userId = req.user?._id || null;
    const data = await markAllAlertsReadForUser(userId);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

export const markAlertRead = async (req, res, next) => {
  try {
    const userId = req.user?._id || null;
    const alert = await markAlertReadForUser(req.params.alertId, userId);
    return res.status(200).json({ success: true, data: alert });
  } catch (error) {
    return next(error);
  }
};

export const streamAlerts = async (req, res, next) => {
  try {
    const userId = req.user?._id || null;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    const writeEvent = (event, data) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    const sendAlertsPayload = async (eventName) => {
      const data = await getHiringAlerts({
        endInDays: req.query.endInDays,
        transitionDays: req.query.transitionDays,
        transitionLimit: req.query.transitionLimit,
        agingDays: req.query.agingDays,
        interviewDoneDays: req.query.interviewDoneDays,
        interviewLimit: req.query.interviewLimit,
        newApplicantDays: req.query.newApplicantDays,
        userId,
      });
      writeEvent(eventName, { success: true, data });
    };

    await sendAlertsPayload("snapshot");

    const keepAliveTimer = setInterval(() => {
      res.write(`: keepalive ${Date.now()}\n\n`);
    }, 25000);

    let isUpdateInFlight = false;
    const updateTimer = setInterval(async () => {
      if (isUpdateInFlight) return;
      isUpdateInFlight = true;
      try {
        await sendAlertsPayload("update");
      } catch (error) {
        writeEvent("error", { success: false, message: "Failed to refresh alerts stream" });
      } finally {
        isUpdateInFlight = false;
      }
    }, 30000);

    req.on("close", () => {
      clearInterval(keepAliveTimer);
      clearInterval(updateTimer);
      res.end();
    });
  } catch (error) {
    return next(error);
  }
};
