import express from "express";
import { protect, requirePermission, requireRole } from "../middleware/auth.middleware.js";
import { registerValidator } from "../validators/auth.validator.js";
import { validate } from "../middleware/validate.js";
import {
  createUser,
  deleteUserById,
  getUserById,
  getUsers,
  updateUserById,
} from "../controllers/user.controller.js";

const router = express.Router();

router.post("/", protect, requireRole("superadmin"), registerValidator, validate, createUser);
router.get("/", protect, requirePermission("manageUsers"), getUsers);
router.get("/:id", protect, requirePermission("manageUsers"), getUserById);
router.put("/:id", protect, requireRole("superadmin"), updateUserById);
router.delete("/:id", protect, requireRole("superadmin"), deleteUserById);

export default router;
