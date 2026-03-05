import User from "../models/user.model.js";

const USER_SAFE_SELECT = "-password -refreshToken -passwordResetTokenHash -passwordResetTokenExpiresAt -passwordResetOtpAttempts -passwordResetLastSentAt";

const toUserResponse = (user) => ({
  id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  empId: user.empId,
  role: user.role,
  isActive: user.isActive,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

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
  return users.map(toUserResponse);
};

export const getUserByIdService = async (userId) => {
  const user = await User.findById(userId).select(USER_SAFE_SELECT);

  if (!user) {
    throw new Error("User not found");
  }

  return toUserResponse(user);
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

  const allowedFields = ["firstName", "lastName", "email", "empId", "role", "isActive"];

  for (const key of allowedFields) {
    if (typeof payload[key] !== "undefined") {
      user[key] = payload[key];
    }
  }

  await user.save();
  return toUserResponse(user);
};

export const deleteUserService = async (userId) => {
  const user = await User.findByIdAndDelete(userId).select(USER_SAFE_SELECT);

  if (!user) {
    throw new Error("User not found");
  }

  return toUserResponse(user);
};
