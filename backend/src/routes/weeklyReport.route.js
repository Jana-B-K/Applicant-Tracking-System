import express from "express";
import { protect, requirePermission, requireRole } from "../middleware/auth.middleware.js";
import { getLastWeeklyReportDate, sendNowWeeklyReport } from "../controllers/weeklyReport.controller.js";

const router = express.Router();

router.get("/last-report-date", protect, requirePermission("viewDashboard"), getLastWeeklyReportDate);
router.post("/send-now", protect, requireRole("superadmin"), sendNowWeeklyReport);

export default router;
