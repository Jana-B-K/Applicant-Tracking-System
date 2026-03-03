import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { generateAccessToken, generateRefreshToken} from "../utils/token.js";

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

  return {
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    },
  };
};

const parseName = (name = "") => {
  const cleaned = String(name).trim();

  if (!cleaned) {
    return { firstName: "User", lastName: "Account" };
  }

  const [firstName = "User", ...rest] = cleaned.split(/\s+/);
  const lastName = rest.join(" ") || "Account";

  return { firstName, lastName };
};

const createRandomPasswordHash = async () => {
  const randomPassword = crypto.randomBytes(32).toString("hex");
  return bcrypt.hash(randomPassword, 10);
};

const fetchJson = async (url, accessToken) => {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Invalid or expired social access token");
  }

  return response.json();
};

const getGoogleProfile = async (accessToken) => {
  const profile = await fetchJson(
    "https://openidconnect.googleapis.com/v1/userinfo",
    accessToken
  );

  if (!profile.email || !profile.email_verified) {
    throw new Error("Google account email is missing or not verified");
  }

  const firstName = profile.given_name || parseName(profile.name).firstName;
  const lastName = profile.family_name || parseName(profile.name).lastName;

  return {
    email: String(profile.email).toLowerCase(),
    firstName,
    lastName,
  };
};

const getMicrosoftProfile = async (accessToken) => {
  const profile = await fetchJson(
    "https://graph.microsoft.com/v1.0/me?$select=givenName,surname,displayName,mail,userPrincipalName",
    accessToken
  );

  const email = profile.mail || profile.userPrincipalName;

  if (!email) {
    throw new Error("Microsoft account email is missing");
  }

  const parsedName = parseName(profile.displayName);

  return {
    email: String(email).toLowerCase(),
    firstName: profile.givenName || parsedName.firstName,
    lastName: profile.surname || parsedName.lastName,
  };
};

const getSocialProfile = async ({ provider, accessToken }) => {
  if (provider === "google") {
    return getGoogleProfile(accessToken);
  }

  if (provider === "microsoft") {
    return getMicrosoftProfile(accessToken);
  }

  throw new Error("Unsupported social provider");
};

export const socialLoginService = async ({ provider, accessToken }) => {
  const profile = await getSocialProfile({ provider, accessToken });
  let user = await User.findOne({ email: profile.email });

  if (!user) {
    const hashedPassword = await createRandomPasswordHash();

    user = await User.create({
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      password: hashedPassword,
    });
  }

  const accessJwtToken = generateAccessToken(user._id);
  const refreshJwtToken = generateRefreshToken(user._id);

  user.refreshToken = refreshJwtToken;
  await user.save();

  return {
    accessToken: accessJwtToken,
    refreshToken: refreshJwtToken,
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
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

const hashResetToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const forgotPasswordService = async (email) => {
  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    return {
      message:
        "If an account with this email exists, a password reset link has been sent.",
    };
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashResetToken(resetToken);

  user.passwordResetTokenHash = tokenHash;
  user.passwordResetTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(
    user.email
  )}`;

  console.log(`Password reset link for ${user.email}: ${resetUrl}`);

  const response = {
    message:
      "If an account with this email exists, a password reset link has been sent.",
  };

  if (process.env.NODE_ENV !== "production") {
    response.resetUrl = resetUrl;
  }

  return response;
};

export const resetPasswordService = async ({ email, token, newPassword }) => {
  const normalizedEmail = String(email).trim().toLowerCase();
  const tokenHash = hashResetToken(token);

  const user = await User.findOne({
    email: normalizedEmail,
    passwordResetTokenHash: tokenHash,
    passwordResetTokenExpiresAt: { $gt: new Date() },
  });

  if (!user) {
    throw new Error("Invalid or expired reset token");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  user.passwordResetTokenHash = undefined;
  user.passwordResetTokenExpiresAt = undefined;
  user.refreshToken = undefined;
  await user.save();

  return {
    message: "Password reset successfully",
  };
};
