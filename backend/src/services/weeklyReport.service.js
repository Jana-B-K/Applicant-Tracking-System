import ExcelJS from "exceljs";
import nodemailer from "nodemailer";
import JobManagement from "../models/job.model.js";
import Candidate from "../models/candidate.model.js";
import WeeklyReportLog from "../models/weeklyReportLog.model.js";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const STAGE_ORDER = [
  "Applied",
  "Screened",
  "Shortlisted",
  "Technical Interview 1",
  "Technical Interview 2",
  "HR Round",
  "Selected",
  "Offered",
  "Offer Accepted",
  "Joined",
  "Rejected",
];

const getAgingDays = (date) => {
  if (!date) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / DAY_IN_MS));
};

const parseRecipientEmails = () => {
  return String(process.env.WEEKLY_REPORT_EMAILS || "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
};

const buildStageCountString = (stageCounts) => {
  const parts = [];
  for (const stage of STAGE_ORDER) {
    parts.push(`${stage}: ${stageCounts[stage] || 0}`);
  }
  return parts.join(", ");
};

const getWeeklyReportRows = async () => {
  const [jobs, stageCountsAgg] = await Promise.all([
    JobManagement.find({ isDeleted: { $ne: true } })
      .select("jobTitle numberOfOpenings createdAt")
      .sort({ createdAt: -1 })
      .lean(),
    Candidate.aggregate([
      {
        $group: {
          _id: {
            job: "$jobID",
            stage: "$status",
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.job",
          stages: {
            $push: {
              k: "$_id.stage",
              v: "$count",
            },
          },
        },
      },
    ]),
  ]);

  const stageCountByJob = new Map(
    stageCountsAgg.map((item) => [
      String(item._id),
      Object.fromEntries((item.stages || []).map((row) => [row.k, row.v])),
    ])
  );

  return jobs.map((job) => {
    const stageCounts = stageCountByJob.get(String(job._id)) || {};
    const openings = Number(job.numberOfOpenings || 0);
    const filled = Number(stageCounts.Joined || 0);

    return {
      jobTitle: job.jobTitle || "-",
      openings,
      filled,
      pending: Math.max(openings - filled, 0),
      stageWiseCount: buildStageCountString(stageCounts),
      aging: getAgingDays(job.createdAt),
    };
  });
};

const buildWorkbook = async (rows) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Weekly Report");

  worksheet.columns = [
    { header: "Job Title", key: "jobTitle", width: 30 },
    { header: "Openings", key: "openings", width: 12 },
    { header: "Filled", key: "filled", width: 10 },
    { header: "Pending", key: "pending", width: 10 },
    { header: "Stage-wise Count", key: "stageWiseCount", width: 60 },
    { header: "Aging (Days)", key: "aging", width: 14 },
  ];

  worksheet.getRow(1).font = { bold: true };

  for (const row of rows) {
    worksheet.addRow(row);
  }

  return workbook.xlsx.writeBuffer();
};

const buildTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    const error = new Error("Missing SMTP config. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS");
    error.statusCode = 400;
    throw error;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
};

const sendWeeklyReportEmail = async ({ recipients, attachmentBuffer, reportDateLabel }) => {
  const transporter = buildTransporter();
  const from = process.env.WEEKLY_REPORT_FROM || process.env.SMTP_USER;
  const subject = `Weekly Hiring Report - ${reportDateLabel}`;
  const fileName = `weekly-report-${reportDateLabel}.xlsx`;

  await transporter.sendMail({
    from,
    to: recipients.join(", "),
    subject,
    text: `Please find attached the weekly hiring report for ${reportDateLabel}.`,
    attachments: [
      {
        filename: fileName,
        content: attachmentBuffer,
      },
    ],
  });

  return fileName;
};

export const sendWeeklyReportService = async ({ triggeredBy = "manual", triggeredByUser = null } = {}) => {
  const recipients = parseRecipientEmails();
  if (recipients.length === 0) {
    const error = new Error("No recipient configured. Set WEEKLY_REPORT_EMAILS");
    error.statusCode = 400;
    throw error;
  }

  const reportDate = new Date();
  const reportDateLabel = reportDate.toISOString().slice(0, 10);

  try {
    const rows = await getWeeklyReportRows();
    const attachmentBuffer = await buildWorkbook(rows);
    const fileName = await sendWeeklyReportEmail({
      recipients,
      attachmentBuffer,
      reportDateLabel,
    });

    await WeeklyReportLog.create({
      reportDate,
      triggeredBy,
      triggeredByUser,
      recipientEmails: recipients,
      totalJobs: rows.length,
      fileName,
      status: "success",
      errorMessage: null,
    });

    return {
      reportDate,
      totalJobs: rows.length,
      recipients,
      fileName,
    };
  } catch (error) {
    await WeeklyReportLog.create({
      reportDate,
      triggeredBy,
      triggeredByUser,
      recipientEmails: recipients,
      totalJobs: 0,
      fileName: null,
      status: "failed",
      errorMessage: error.message,
    });
    throw error;
  }
};

export const getLastWeeklyReportService = async () => {
  const latest = await WeeklyReportLog.findOne({ status: "success" })
    .sort({ reportDate: -1 })
    .select("reportDate triggeredBy triggeredByUser recipientEmails totalJobs fileName status")
    .lean();

  if (!latest) {
    return {
      lastReportDate: null,
      lastReport: null,
    };
  }

  return {
    lastReportDate: latest.reportDate,
    lastReport: latest,
  };
};
