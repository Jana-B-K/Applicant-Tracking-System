import ExcelJS from "exceljs";
import nodemailer from "nodemailer";
import JobManagement from "../models/job.model.js";
import Candidate from "../models/candidate.model.js";
import WeeklyReportLog from "../models/weeklyReportLog.model.js";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const STAGE_ORDER = [
  "applied",
  "screened",
  "shortlisted",
  "technical interview I",
  "technical interview II",
  "hr round",
  "selected",
  "offered",
  "offer accepted",
  "joined",
  "rejected",
];
const DEFAULT_FILLED_STATUSES = ["joined", "offer accepted"];

const getAgingDays = (targetClosureDate) => {
  if (!targetClosureDate) return 0;
  const target = new Date(targetClosureDate);
  if (Number.isNaN(target.getTime())) return 0;

  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const targetUtc = Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate());

  // Aging means remaining hiring days until target closure date.
  return Math.max(0, Math.ceil((targetUtc - todayUtc) / DAY_IN_MS));
};

const resolveCreatedAt = (job) => {
  if (job?.createdAt) return job.createdAt;
  if (job?._id && typeof job._id.getTimestamp === "function") {
    return job._id.getTimestamp();
  }
  return null;
};

const parseRecipientEmails = () => {
  return String(process.env.WEEKLY_REPORT_EMAILS || "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
};

const parseFilledStatuses = () => {
  const raw = String(process.env.WEEKLY_REPORT_FILLED_STATUSES || "")
    .split(",")
    .map((status) => status.trim().toLowerCase())
    .filter(Boolean);

  return new Set(raw.length > 0 ? raw : DEFAULT_FILLED_STATUSES);
};

const toStageKey = (status) => {
  const normalized = String(status || "").trim().toLowerCase();
  if (!normalized) return "other";

  const stageAliases = {
    screening: "screened",
    "hr interview": "hr round",
    "technical interview 1": "technical interview I",
    "technical interview 2": "technical interview II",
    "technical intv 1": "technical interview I",
    "technical intv 2": "technical interview II",
  };

  const normalizedStageOrder = new Set(STAGE_ORDER.map((stage) => stage.toLowerCase()));
  if (normalizedStageOrder.has(normalized)) {
    const exactStage = STAGE_ORDER.find((stage) => stage.toLowerCase() === normalized);
    return exactStage || "other";
  }

  return stageAliases[normalized] || "other";
};

const formatDate = (date) => {
  if (!date) return "-";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toISOString().slice(0, 10);
};

const buildStageCountString = (stageCounts) => {
  const lines = [];
  for (const stage of STAGE_ORDER) {
    lines.push(`${stage}: ${Number(stageCounts[stage] || 0)}`);
  }
  lines.push(`other: ${Number(stageCounts.other || 0)}`);

  return lines.join("\n");
};

const getWeeklyReportRows = async () => {
  const filledStatusSet = parseFilledStatuses();
  const [jobs, candidateStatusAgg, totalCandidateAgg] = await Promise.all([
    JobManagement.find({
      isDeleted: { $ne: true },
    })
      .select("jobTitle numberOfOpenings createdAt targetClosureDate")
      .sort({ createdAt: -1 })
      .lean(),
    Candidate.aggregate([
      {
        $match: {
          jobID: { $exists: true, $ne: null },
        },
      },
      {
        $project: {
          jobID: 1,
          normalizedStatus: {
            $toLower: {
              $trim: { input: { $ifNull: ["$status", ""] } },
            },
          },
        },
      },
      {
        $group: {
          _id: {
            job: "$jobID",
            status: "$normalizedStatus",
          },
          count: { $sum: 1 },
        },
      },
    ]),
    Candidate.aggregate([
      {
        $match: {
          jobID: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: "$jobID",
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const stageCountByJob = new Map();
  for (const row of candidateStatusAgg) {
    const jobId = String(row._id?.job || "");
    if (!jobId) continue;

    if (!stageCountByJob.has(jobId)) {
      stageCountByJob.set(jobId, {});
    }

    const perJobCounts = stageCountByJob.get(jobId);
    const stageKey = toStageKey(row._id?.status);
    perJobCounts[stageKey] = Number(perJobCounts[stageKey] || 0) + Number(row.count || 0);
  }

  const totalCandidateByJob = new Map(totalCandidateAgg.map((row) => [String(row._id), Number(row.count || 0)]));

  return jobs.map((job) => {
    const stageCounts = stageCountByJob.get(String(job._id)) || {};
    stageCounts.applied = totalCandidateByJob.get(String(job._id)) || 0;

    const openings = Number(job.numberOfOpenings || 0);
    const filled = Object.entries(stageCounts).reduce((total, [status, count]) => {
      return filledStatusSet.has(status) ? total + Number(count || 0) : total;
    }, 0);
    const createdAt = resolveCreatedAt(job);

    return {
      jobTitle: job.jobTitle || "-",
      createdAt: formatDate(createdAt),
      openings,
      filled,
      pending: Math.max(openings - filled, 0),
      stageWiseCount: buildStageCountString(stageCounts),
      aging: getAgingDays(job.targetClosureDate),
    };
  });
};

const buildWorkbook = async (rows) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Weekly Report");

  worksheet.columns = [
    { header: "Job Title", key: "jobTitle", width: 30 },
    { header: "Created At", key: "createdAt", width: 14 },
    { header: "Openings", key: "openings", width: 12 },
    { header: "Filled", key: "filled", width: 10 },
    { header: "Pending", key: "pending", width: 10 },
    { header: "Stage-wise Count", key: "stageWiseCount", width: 40 },
    { header: "Aging (Days)", key: "aging", width: 14 },
  ];

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).alignment = { vertical: "top" };
  worksheet.getColumn("stageWiseCount").alignment = { wrapText: true, vertical: "top" };
  worksheet.getColumn("jobTitle").alignment = { vertical: "top" };
  worksheet.getColumn("createdAt").alignment = { vertical: "top" };
  worksheet.getColumn("openings").alignment = { vertical: "top" };
  worksheet.getColumn("filled").alignment = { vertical: "top" };
  worksheet.getColumn("pending").alignment = { vertical: "top" };
  worksheet.getColumn("aging").alignment = { vertical: "top" };

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
