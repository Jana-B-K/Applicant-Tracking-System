import express from "express";
import { protect, requirePermission } from "../middleware/auth.middleware.js";
import { getSummary, getFunnel, getWeeklyStats } from "../controllers/dashboard.controller.js";

const router = express.Router();

router.get("/summary", protect, requirePermission("viewDashboard"), getSummary);
router.get("/funnel", protect, requirePermission("viewDashboard"), getFunnel);
router.get("/weekly-stats", protect, requirePermission("viewDashboard"), getWeeklyStats);

export default router;
