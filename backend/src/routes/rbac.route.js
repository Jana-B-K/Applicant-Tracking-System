import express from "express";
import { protect, requirePermission } from "../middleware/auth.middleware.js";
import {
  getRbacPolicy,
  resetRbacPolicy,
  updateRbacPolicy,
} from "../controllers/rbac.controller.js";

const router = express.Router();

router.get("/policy", protect, requirePermission("manageUsers"), getRbacPolicy);
router.put("/policy", protect, requirePermission("manageUsers"), updateRbacPolicy);
router.post("/policy/reset", protect, requirePermission("manageUsers"), resetRbacPolicy);

export default router;
