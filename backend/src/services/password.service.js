import User from "../models/user.model.js";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";

const hasEmailConfig = () =>
  Boolean(
    process.env.EMAIL_HOST &&
      process.env.EMAIL_PORT &&
      process.env.EMAIL_USER &&
      process.env.EMAIL_PASS
  );

const sendResetEmail = async (toEmail, resetUrl) => {
  if (!hasEmailConfig()) {
    throw new Error("Email service is not configured. Set EMAIL_* variables.");
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Support" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Password Reset Request",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2>Reset Your Password</h2>
        <p>You requested a password reset. Click the button below:</p>
        <a href="${resetUrl}" 
           style="background:#4F46E5;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin:16px 0;">
          Reset Password
        </a>
        <p>This link expires in <strong>15 minutes.</strong></p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
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

  if (process.env.NODE_ENV === "production") {
    try {
      await sendResetEmail(user.email, resetUrl);
    } catch (error) {
      throw new Error(`Unable to send password reset email: ${error.message}`);
    }
  } else {
    console.log(`[DEV] Reset link for ${user.email}: ${resetUrl}`);
  }

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
