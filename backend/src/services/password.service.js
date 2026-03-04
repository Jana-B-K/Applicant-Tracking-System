import User from "../models/user.model.js";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";

const OTP_EXPIRY_MINUTES = 15;
const OTP_RESEND_COOLDOWN_SECONDS = 60;
const OTP_MAX_VERIFY_ATTEMPTS = 5;

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const normalizeEmail = (email) => String(email).trim().toLowerCase();

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const generateOtp = () => String(crypto.randomInt(100000, 1000000));

const hasEmailConfig = () =>
  Boolean(
    process.env.EMAIL_USER &&
      process.env.EMAIL_PASS &&
      (process.env.EMAIL_SERVICE || (process.env.EMAIL_HOST && process.env.EMAIL_PORT))
  );

const createTransporter = () => {
  if (!hasEmailConfig()) {
    throw createError("Email service is not configured. Set EMAIL_* variables.", 500);
  }

  const usingService = Boolean(process.env.EMAIL_SERVICE);
  if (usingService) {
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: Number(process.env.EMAIL_PORT) === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const buildResetEmailHtml = (otp, resetUrl) => `
  <div style="font-family: Arial, sans-serif; max-width: 560px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
    <h2 style="margin: 0 0 12px; color: #111827;">Password Reset Verification</h2>
    <p style="margin: 0 0 16px; color: #374151;">Use this verification code to reset your password:</p>
    <div style="font-size: 28px; letter-spacing: 4px; font-weight: 700; color: #111827; margin: 0 0 16px;">${otp}</div>
    <p style="margin: 0 0 12px; color: #374151;">This code expires in <strong>${OTP_EXPIRY_MINUTES} minutes</strong>.</p>
    <p style="margin: 0 0 16px; color: #374151;">Or continue with this reset link:</p>
    <a href="${resetUrl}" style="display:inline-block; padding: 10px 16px; border-radius: 6px; background: #2563eb; color: #ffffff; text-decoration: none;">Open Reset Page</a>
    <p style="margin: 16px 0 0; font-size: 12px; color: #6b7280; word-break: break-all;">${resetUrl}</p>
  </div>
`;

const sendResetEmail = async ({ toEmail, otp, resetUrl }) => {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"Support" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Password Reset OTP",
    html: buildResetEmailHtml(otp, resetUrl),
  });
};

const clearResetState = (user) => {
  user.passwordResetTokenHash = undefined;
  user.passwordResetTokenExpiresAt = undefined;
  user.passwordResetOtpAttempts = 0;
};

const assertTokenNotExpired = (user) => {
  if (!user.passwordResetTokenHash || !user.passwordResetTokenExpiresAt) {
    throw createError("Invalid or expired OTP", 400);
  }

  if (user.passwordResetTokenExpiresAt.getTime() <= Date.now()) {
    clearResetState(user);
    throw createError("Invalid or expired OTP", 400);
  }
};

const verifyOtpForUser = async ({ user, otp }) => {
  assertTokenNotExpired(user);

  if ((user.passwordResetOtpAttempts || 0) >= OTP_MAX_VERIFY_ATTEMPTS) {
    clearResetState(user);
    await user.save();
    throw createError("Too many invalid attempts. Please request a new OTP.", 429);
  }

  const otpHash = hashToken(String(otp).trim());
  if (otpHash !== user.passwordResetTokenHash) {
    user.passwordResetOtpAttempts = (user.passwordResetOtpAttempts || 0) + 1;

    if (user.passwordResetOtpAttempts >= OTP_MAX_VERIFY_ATTEMPTS) {
      clearResetState(user);
      await user.save();
      throw createError("Too many invalid attempts. Please request a new OTP.", 429);
    }

    await user.save();
    throw createError("Invalid or expired OTP", 400);
  }

  user.passwordResetOtpAttempts = 0;
  await user.save();
};

export const forgotPasswordService = async (email) => {
  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    return {
      message: "If an account with this email exists, an OTP has been sent.",
    };
  }

  const now = Date.now();
  if (user.passwordResetLastSentAt) {
    const elapsedMs = now - user.passwordResetLastSentAt.getTime();
    const cooldownMs = OTP_RESEND_COOLDOWN_SECONDS * 1000;
    if (elapsedMs < cooldownMs) {
      return {
        message: "If an account with this email exists, an OTP has been sent.",
      };
    }
  }

  const otp = generateOtp();
  user.passwordResetTokenHash = hashToken(otp);
  user.passwordResetTokenExpiresAt = new Date(now + OTP_EXPIRY_MINUTES * 60 * 1000);
  user.passwordResetLastSentAt = new Date(now);
  user.passwordResetOtpAttempts = 0;
  await user.save();

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const resetUrl = `${frontendUrl}/reset-password?email=${encodeURIComponent(user.email)}&otp=${otp}`;

  const isProduction = process.env.NODE_ENV === "production";

  const shouldSendEmail = isProduction || process.env.EMAIL_SEND_IN_DEV === "true";

  try {
    if (shouldSendEmail) {
      await sendResetEmail({ toEmail: user.email, otp, resetUrl });
    } else {
      console.log(`[DEV] OTP for ${user.email}: ${otp}`);
      console.log(`[DEV] Reset URL for ${user.email}: ${resetUrl}`);
    }
  } catch (error) {
    clearResetState(user);
    await user.save();
    throw createError(`Unable to send password reset email: ${error.message}`, 500);
  }

  const response = {
    message: "If an account with this email exists, an OTP has been sent.",
  };

  if (!isProduction) {
    response.devOtp = otp;
    response.resetUrl = resetUrl;
  }

  return response;
};

export const verifyResetTokenService = async ({ email, token, otp }) => {
  const normalizedEmail = normalizeEmail(email);
  const providedOtp = String(otp || token || "").trim();

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    throw createError("Invalid or expired OTP", 400);
  }

  await verifyOtpForUser({ user, otp: providedOtp });

  return {
    message: "OTP verified successfully",
  };
};

export const resetPasswordService = async ({ email, token, otp, newPassword }) => {
  const normalizedEmail = normalizeEmail(email);
  const providedOtp = String(otp || token || "").trim();

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    throw createError("Invalid or expired OTP", 400);
  }

  await verifyOtpForUser({ user, otp: providedOtp });

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  user.refreshToken = undefined;
  clearResetState(user);
  await user.save();

  return {
    message: "Password reset successfully",
  };
};
