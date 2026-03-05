import express from "express";
import { protect, requirePermission } from "../middleware/auth.middleware.js";
import {
  deleteUserById,
  getUserById,
  getUsers,
  updateUserById,
} from "../controllers/user.controller.js";

const router = express.Router();

router.get("/", protect, requirePermission("manageUsers"), getUsers);
router.get("/:id", protect, requirePermission("manageUsers"), getUserById);
router.put("/:id", protect, requirePermission("manageUsers"), updateUserById);
router.delete("/:id", protect, requirePermission("manageUsers"), deleteUserById);

export default router;
