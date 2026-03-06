import express from "express";
import { protect, protectStream, requirePermission } from "../middleware/auth.middleware.js";
import {
  getSummary,
  getFunnel,
  getWeeklyStats,
  getAlerts,
  markAllAlertsRead,
  markAlertRead,
  streamAlerts,
} from "../controllers/dashboard.controller.js";

const router = express.Router();

router.get("/summary", protect, requirePermission("viewDashboard"), getSummary);
router.get("/funnel", protect, requirePermission("viewDashboard"), getFunnel);
router.get("/weekly-stats", protect, requirePermission("viewDashboard"), getWeeklyStats);
router.get("/alerts", protect, requirePermission("viewDashboard"), getAlerts);
router.get("/alerts/stream", protectStream, requirePermission("viewDashboard"), streamAlerts);
router.patch("/alerts/read-all", protect, requirePermission("viewDashboard"), markAllAlertsRead);
router.patch("/alerts/:alertId/read", protect, requirePermission("viewDashboard"), markAlertRead);

export default router;
