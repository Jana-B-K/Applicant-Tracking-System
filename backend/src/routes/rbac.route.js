import express from "express";
import { protect, requireRole } from "../middleware/auth.middleware.js";
import {
  getRbacPolicy,
  resetRbacPolicy,
  updateRbacPolicy,
} from "../controllers/rbac.controller.js";

const router = express.Router();

router.get("/policy", protect, requireRole("superadmin"), getRbacPolicy);
router.put("/policy", protect, requireRole("superadmin"), updateRbacPolicy);
router.post("/policy/reset", protect, requireRole("superadmin"), resetRbacPolicy);

export default router;
