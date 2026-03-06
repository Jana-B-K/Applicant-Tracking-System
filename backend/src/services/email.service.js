import nodemailer from "nodemailer";

// transporter config using environment variables
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendAlertEmail = async ({ to, subject, text, html }) => {
  if (!to) return null;
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || 'no-reply@example.com',
      to,
      subject,
      text,
      html,
    });
    return info;
  } catch (error) {
    console.error('[Email] failed to send alert email', error);
    return null;
  }
};
