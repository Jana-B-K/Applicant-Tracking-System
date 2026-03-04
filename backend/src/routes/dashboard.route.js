import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { getSummary, getFunnel, getWeeklyStats } from "../controllers/dashboard.controller.js";

const router = express.Router();

router.get("/summary", protect, getSummary);
router.get("/funnel", protect, getFunnel);
router.get("/weekly-stats", protect, getWeeklyStats);

export default router;
