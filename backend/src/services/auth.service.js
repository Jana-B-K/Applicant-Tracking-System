import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { generateAccessToken, generateRefreshToken} from "../utils/token.js";
import { getRolePermissionsService } from "./rbac.service.js";

export const registerService = async ({ firstName, lastName, email, password }) => {
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new Error("User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    firstName,
    lastName,
    email,
    password: hashedPassword,
  });

  return {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  };
};

export const loginService = async ({ email, password }) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  await user.save();
  const permissions = await getRolePermissionsService(user.role);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      permissions,
    },
  };
};

export const refreshAccessTokenService = async (refreshToken) => {
  if (!refreshToken) {
    throw new Error("Refresh token required");
  }

  let decoded;

  try {
    decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_TOKEN_SECRET
    );
  } catch (error) {
    throw new Error("Invalid or expired refresh token");
  }

  const user = await User.findById(decoded.id);

  if (!user || user.refreshToken !== refreshToken) {
    throw new Error("Invalid refresh token");
  }

  const newAccessToken = generateAccessToken(user._id);

  return {
    accessToken: newAccessToken,
  };
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

  return {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  };
};


















// const createRandomPasswordHash = async () => {
//   const randomPassword = crypto.randomBytes(32).toString("hex");
//   return bcrypt.hash(randomPassword, 10);
// };

// export const socialLoginService = async ({ provider, accessToken }) => {
//   const profile = await getSocialProfile({ provider, accessToken });

//   let user = await User.findOne({ email: profile.email });

//   if (!user) {
//     const hashedPassword = await createRandomPasswordHash();
//     user = await User.create({
//       firstName: profile.firstName,
//       lastName: profile.lastName,
//       email: profile.email,
//       password: hashedPassword,
//     });
//   }

//   const accessJwtToken = generateAccessToken(user._id);
//   const refreshJwtToken = generateRefreshToken(user._id);

//   user.refreshToken = refreshJwtToken;
//   await user.save();

//   return {
//     accessToken: accessJwtToken,
//     refreshToken: refreshJwtToken,
//     user: {
//       id: user._id,
//       firstName: user.firstName,
//       lastName: user.lastName,
//       email: user.email,
//     },
//   };
// };
