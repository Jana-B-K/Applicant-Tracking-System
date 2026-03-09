import express from "express";
import { protect, requirePermission, requireRole } from "../middleware/auth.middleware.js";
import {
  getWeeklyReportHistory,
  getLastWeeklyReportDate,
  sendNowWeeklyReportExcel,
  sendNowWeeklyReportPdf,
} from "../controllers/weeklyReport.controller.js";

const router = express.Router();

router.get("/last-report-date", protect, requirePermission("viewDashboard"), getLastWeeklyReportDate);
router.get("/history", protect, requirePermission("viewDashboard"), getWeeklyReportHistory);
router.post("/send-now/excel", protect, requireRole("superadmin"), sendNowWeeklyReportExcel);
router.post("/send-now/pdf", protect, requireRole("superadmin"), sendNowWeeklyReportPdf);

export default router;
