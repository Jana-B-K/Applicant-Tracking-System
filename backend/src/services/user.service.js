import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { buildRoleDiffOverridesService, resolveUserPermissionsService } from "./rbac.service.js";

const USER_SAFE_SELECT = "-password -refreshToken -passwordResetTokenHash -passwordResetTokenExpiresAt -passwordResetOtpAttempts -passwordResetLastSentAt";

const toUserResponse = (user) => ({
  id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  empId: user.empId,
  role: user.role,
  assignedPermissions: user.permissions || {},
  isActive: user.isActive,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const withEffectivePermissions = async (user) => {
  const permissions = await resolveUserPermissionsService({
    role: user.role,
    permissions: user.permissions,
  });

  return {
    ...toUserResponse(user),
    permissions,
  };
};

export const createUserService = async ({ firstName, lastName, email, password, role, empId, isActive, permissions }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error("User already exists");
  }

  if (empId) {
    const existingEmpId = await User.findOne({ empId });
    if (existingEmpId) {
      throw new Error("Employee ID already in use");
    }
  }

  const permissionOverrides = await buildRoleDiffOverridesService({
    role,
    permissions,
  });

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    firstName,
    lastName,
    email,
    password: hashedPassword,
    role,
    empId,
    isActive: typeof isActive === "boolean" ? isActive : true,
    permissions: permissionOverrides,
  });

  return withEffectivePermissions(user);
};

export const updateProfileService = async (userId, { firstName, lastName, email }) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  if (email && email !== user.email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error("Email already in use");
    }
  }

  user.firstName = firstName || user.firstName;
  user.lastName = lastName || user.lastName;
  user.email = email || user.email;

  await user.save();

  return toUserResponse(user);
};

export const getUsersService = async ({ role, isActive, search }) => {
  const query = {};

  if (role) {
    query.role = role;
  }

  if (typeof isActive !== "undefined") {
    query.isActive = isActive === true || isActive === "true";
  }

  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { empId: { $regex: search, $options: "i" } },
    ];
  }

  const users = await User.find(query).select(USER_SAFE_SELECT).sort({ createdAt: -1 });
  return Promise.all(users.map(withEffectivePermissions));
};

export const getUserByIdService = async (userId) => {
  const user = await User.findById(userId).select(USER_SAFE_SELECT);

  if (!user) {
    throw new Error("User not found");
  }

  return withEffectivePermissions(user);
};

export const updateUserByIdService = async (userId, payload) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  if (payload.email && payload.email !== user.email) {
    const existingUser = await User.findOne({ email: payload.email });
    if (existingUser && String(existingUser._id) !== String(user._id)) {
      throw new Error("Email already in use");
    }
  }

  if (payload.empId && payload.empId !== user.empId) {
    const existingEmpId = await User.findOne({ empId: payload.empId });
    if (existingEmpId && String(existingEmpId._id) !== String(user._id)) {
      throw new Error("Employee ID already in use");
    }
  }

  const targetRole = typeof payload.role !== "undefined" ? payload.role : user.role;
  const isRoleChanged = typeof payload.role !== "undefined" && payload.role !== user.role;

  const allowedFields = ["firstName", "lastName", "email", "empId", "role", "isActive"];

  for (const key of allowedFields) {
    if (typeof payload[key] !== "undefined") {
      user[key] = payload[key];
    }
  }

  if (typeof payload.permissions !== "undefined") {
    user.permissions = await buildRoleDiffOverridesService({
      role: targetRole,
      permissions: payload.permissions,
    });
  } else if (isRoleChanged) {
    // On role change, reset user-specific overrides to inherit new role defaults.
    user.permissions = {};
  }

  await user.save();
  return withEffectivePermissions(user);
};

export const deleteUserService = async (userId) => {
  const user = await User.findByIdAndDelete(userId).select(USER_SAFE_SELECT);

  if (!user) {
    throw new Error("User not found");
  }

  return withEffectivePermissions(user);
};
