import nodemailer from "nodemailer";
import mongoose from "mongoose";
import JobManagement from "../models/job.model.js";
import Candidate from "../models/candidate.model.js";
import WeeklyReportLog from "../models/weeklyReportLog.model.js";
import { buildWeeklyReportExcelAttachment } from "./weeklyReportExcel.service.js";
import { buildWeeklyReportPdfAttachment } from "./weeklyReportPdf.service.js";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const SUPPORTED_REPORT_FORMATS = new Set(["xlsx", "pdf"]);
const FINAL_INTERVIEW_RESULT_EXCLUSIONS = ["pending", "rescheduled", ""];
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
const OFFER_ACCEPTED_STATUSES = ["offer accepted", "joined"];
const OFFER_DECLINED_STATUSES = ["offer declined", "offer revoked"];
const OFFER_RELEASED_STATUSES = ["offered", ...OFFER_ACCEPTED_STATUSES, ...OFFER_DECLINED_STATUSES];
const DEFAULT_HISTORY_LIMIT = 50;

const getAgingDays = (targetClosureDate) => {
  if (!targetClosureDate) return 0;
  const target = new Date(targetClosureDate);
  if (Number.isNaN(target.getTime())) return 0;

  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const targetUtc = Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate());

  // Aging means remaining days until target closure date.
  return Math.max(0, Math.ceil((targetUtc - todayUtc) / DAY_IN_MS));
};

const normalizeReportFormat = (format) => {
  const normalized = String(format || "xlsx")
    .trim()
    .toLowerCase();

  if (!SUPPORTED_REPORT_FORMATS.has(normalized)) {
    const error = new Error(`Unsupported report format '${format}'. Use 'xlsx' or 'pdf'`);
    error.statusCode = 400;
    throw error;
  }

  return normalized;
};

const parseRecipientEmails = () => {
  return String(process.env.WEEKLY_REPORT_EMAILS || "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
};

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeDateStart = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
};

const normalizeDateEnd = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(23, 59, 59, 999);
  return d;
};

const normalizeFilters = (filters = {}) => {
  return {
    department: String(filters.department || "").trim(),
    jobTitle: String(filters.jobTitle || "").trim(),
    recruiter: String(filters.recruiter || "").trim(),
    location: String(filters.location || "").trim(),
    dateFrom: normalizeDateStart(filters.dateFrom),
    dateTo: normalizeDateEnd(filters.dateTo),
  };
};

const getFilteredJobs = async (filters) => {
  const query = {
    isDeleted: { $ne: true },
    jobStatus: "Open",
  };

  if (filters.department) {
    query.department = { $regex: escapeRegex(filters.department), $options: "i" };
  }
  if (filters.jobTitle) {
    query.jobTitle = { $regex: escapeRegex(filters.jobTitle), $options: "i" };
  }
  if (filters.location) {
    query.location = { $regex: escapeRegex(filters.location), $options: "i" };
  }

  if (filters.dateFrom || filters.dateTo) {
    query.createdAt = {};
    if (filters.dateFrom) query.createdAt.$gte = filters.dateFrom;
    if (filters.dateTo) query.createdAt.$lte = filters.dateTo;
  }

  if (filters.recruiter) {
    const recruiterRegex = new RegExp(escapeRegex(filters.recruiter), "i");
    const recruiterMatch = {
      $or: [
        { "recruiter.name": { $regex: recruiterRegex } },
        { "recruiter.email": { $regex: recruiterRegex } },
      ],
    };
    if (mongoose.Types.ObjectId.isValid(filters.recruiter)) {
      recruiterMatch.$or.push({ "recruiter.id": new mongoose.Types.ObjectId(filters.recruiter) });
    }

    const recruiterJobIds = await Candidate.distinct("jobID", recruiterMatch);
    query._id = { $in: recruiterJobIds };
  }

  return JobManagement.find(query)
    .select("jobTitle department location hiringManager numberOfOpenings createdAt targetClosureDate")
    .sort({ createdAt: -1 })
    .lean();
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

const buildStageCountString = (stageCounts) => {
  const lines = [];
  for (const stage of STAGE_ORDER) {
    lines.push(`${stage}: ${Number(stageCounts[stage] || 0)}`);
  }
  lines.push(`other: ${Number(stageCounts.other || 0)}`);

  return lines.join("\n");
};

const getCurrentWeekRangeUtc = (date = new Date()) => {
  const day = date.getUTCDay(); // 0 Sunday, 1 Monday
  const diffToMonday = (day + 6) % 7;
  const weekStartUtc = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - diffToMonday, 0, 0, 0, 0)
  );

  return {
    weekStartUtc,
    weekEndUtc: date,
  };
};

const getWeeklyReportRows = async (filters = {}) => {
  const normalizedFilters = normalizeFilters(filters);
  const filledStatusSet = parseFilledStatuses();
  const { weekStartUtc, weekEndUtc } = getCurrentWeekRangeUtc();
  const jobs = await getFilteredJobs(normalizedFilters);
  if (jobs.length === 0) return [];

  const jobIds = jobs.map((job) => job._id);
  const candidateJobMatch = {
    jobID: { $in: jobIds },
  };

  const [candidateStatusAgg, interviewsConductedAgg, offerStatsAgg] = await Promise.all([
    Candidate.aggregate([
      {
        $match: candidateJobMatch,
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
        $match: candidateJobMatch,
      },
      { $unwind: "$interviews" },
      {
        $addFields: {
          normalizedInterviewResult: {
            $toLower: {
              $trim: { input: { $ifNull: ["$interviews.result", ""] } },
            },
          },
          // Primary source is completedAt; fallback to updatedAt only for legacy rows missing completedAt.
          conductedAt: {
            $ifNull: [
              "$interviews.completedAt",
              {
                $cond: [
                  {
                    $not: {
                      $in: [
                        {
                          $toLower: {
                            $trim: { input: { $ifNull: ["$interviews.result", ""] } },
                          },
                        },
                        FINAL_INTERVIEW_RESULT_EXCLUSIONS,
                      ],
                    },
                  },
                  "$interviews.updatedAt",
                  null,
                ],
              },
            ],
          },
        },
      },
      {
        $match: {
          conductedAt: { $gte: weekStartUtc, $lte: weekEndUtc },
          normalizedInterviewResult: { $nin: FINAL_INTERVIEW_RESULT_EXCLUSIONS },
        },
      },
      {
        $group: {
          _id: "$jobID",
          count: { $sum: 1 },
        },
      },
    ]),
    Candidate.aggregate([
      {
        $match: candidateJobMatch,
      },
      {
        $project: {
          jobID: 1,
          currentStatusNormalized: {
            $toLower: {
              $trim: { input: { $ifNull: ["$status", ""] } },
            },
          },
          statusHistoryNormalized: {
            $map: {
              input: { $ifNull: ["$statusHistory", []] },
              as: "history",
              in: {
                $toLower: {
                  $trim: { input: { $ifNull: ["$$history.status", ""] } },
                },
              },
            },
          },
        },
      },
      {
        $addFields: {
          hasOfferReleased: {
            $or: [
              { $in: ["$currentStatusNormalized", OFFER_RELEASED_STATUSES] },
              {
                $gt: [
                  {
                    $size: {
                      $setIntersection: ["$statusHistoryNormalized", OFFER_RELEASED_STATUSES],
                    },
                  },
                  0,
                ],
              },
            ],
          },
          hasOfferAccepted: {
            $or: [
              { $in: ["$currentStatusNormalized", OFFER_ACCEPTED_STATUSES] },
              {
                $gt: [
                  {
                    $size: {
                      $setIntersection: ["$statusHistoryNormalized", OFFER_ACCEPTED_STATUSES],
                    },
                  },
                  0,
                ],
              },
            ],
          },
          hasOfferDeclined: {
            $or: [
              { $in: ["$currentStatusNormalized", OFFER_DECLINED_STATUSES] },
              {
                $gt: [
                  {
                    $size: {
                      $setIntersection: ["$statusHistoryNormalized", OFFER_DECLINED_STATUSES],
                    },
                  },
                  0,
                ],
              },
            ],
          },
          offerDecisionStatus: {
            $switch: {
              branches: [
                {
                  case: { $in: ["$currentStatusNormalized", OFFER_ACCEPTED_STATUSES] },
                  then: "accepted",
                },
                {
                  case: { $in: ["$currentStatusNormalized", OFFER_DECLINED_STATUSES] },
                  then: "declined",
                },
                {
                  case: {
                    $or: [
                      { $in: ["$currentStatusNormalized", OFFER_RELEASED_STATUSES] },
                      {
                        $gt: [
                          {
                            $size: {
                              $setIntersection: ["$statusHistoryNormalized", OFFER_RELEASED_STATUSES],
                            },
                          },
                          0,
                        ],
                      },
                    ],
                  },
                  then: "pending",
                },
              ],
              default: "none",
            },
          },
        },
      },
      {
        $group: {
          _id: "$jobID",
          offersReleased: { $sum: { $cond: ["$hasOfferReleased", 1, 0] } },
          offerAccepted: { $sum: { $cond: [{ $eq: ["$offerDecisionStatus", "accepted"] }, 1, 0] } },
          offerDeclined: { $sum: { $cond: [{ $eq: ["$offerDecisionStatus", "declined"] }, 1, 0] } },
          offerPending: { $sum: { $cond: [{ $eq: ["$offerDecisionStatus", "pending"] }, 1, 0] } },
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

  const interviewsConductedByJob = new Map(
    interviewsConductedAgg.map((row) => [String(row._id), Number(row.count || 0)])
  );
  const offerStatsByJob = new Map(
    offerStatsAgg.map((row) => [
      String(row._id),
      {
        offersReleased: Number(row.offersReleased || 0),
        offerAccepted: Number(row.offerAccepted || 0),
        offerDeclined: Number(row.offerDeclined || 0),
        offerPending: Number(row.offerPending || 0),
      },
    ])
  );

  return jobs.map((job) => {
    const jobId = String(job._id);
    const stageCounts = stageCountByJob.get(jobId) || {};

    const openings = Number(job.numberOfOpenings || 0);
    const filled = Object.entries(stageCounts).reduce((total, [status, count]) => {
      return filledStatusSet.has(status) ? total + Number(count || 0) : total;
    }, 0);
    const offerStats = offerStatsByJob.get(jobId) || {
      offersReleased: 0,
      offerAccepted: 0,
      offerDeclined: 0,
      offerPending: 0,
    };
    const offersReleased = offerStats.offersReleased;
    const offerAccepted = offerStats.offerAccepted;
    const offerDeclined = offerStats.offerDeclined;
    const offerPending = offerStats.offerPending;

    return {
      jobTitle: job.jobTitle || "-",
      department: job.department || "-",
      hiringManager: job.hiringManager || "-",
      numberOfOpenings: openings,
      positionsFilled: filled,
      positionsPending: Math.max(openings - filled, 0),
      candidatesInEachStage: buildStageCountString(stageCounts),
      interviewsConductedThisWeek: interviewsConductedByJob.get(jobId) || 0,
      offersReleased,
      offerAcceptanceStatus: `Accepted: ${offerAccepted}\nDeclined: ${offerDeclined}\nPending: ${offerPending}`,
      ageingOfPositionRemainingDays: getAgingDays(job.targetClosureDate),
    };
  });
};

const buildReportAttachment = async ({ rows, format, reportDateLabel }) => {
  if (format === "pdf") {
    return buildWeeklyReportPdfAttachment({ rows, reportDateLabel });
  }

  return buildWeeklyReportExcelAttachment({ rows, reportDateLabel });
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

const sendWeeklyReportEmail = async ({ recipients, attachmentBuffer, reportDateLabel, fileName, mimeType }) => {
  const transporter = buildTransporter();
  const from = process.env.WEEKLY_REPORT_FROM || process.env.SMTP_USER;
  const subject = `Weekly Hiring Report - ${reportDateLabel}`;

  await transporter.sendMail({
    from,
    to: recipients.join(", "),
    subject,
    text: `Please find attached the weekly hiring report for ${reportDateLabel}.`,
    attachments: [
      {
        filename: fileName,
        content: attachmentBuffer,
        contentType: mimeType,
      },
    ],
  });

  return fileName;
};

export const sendWeeklyReportService = async ({
  triggeredBy = "manual",
  triggeredByUser = null,
  format = "xlsx",
  filters = {},
} = {}) => {
  const recipients = parseRecipientEmails();
  if (recipients.length === 0) {
    const error = new Error("No recipient configured. Set WEEKLY_REPORT_EMAILS");
    error.statusCode = 400;
    throw error;
  }

  const reportDate = new Date();
  const reportDateLabel = reportDate.toISOString().slice(0, 10);
  const normalizedFormat = normalizeReportFormat(format);
  const normalizedFilters = normalizeFilters(filters);

  try {
    const rows = await getWeeklyReportRows(normalizedFilters);
    const { attachmentBuffer, fileName: outputFileName, mimeType } = await buildReportAttachment({
      rows,
      format: normalizedFormat,
      reportDateLabel,
    });
    const fileName = await sendWeeklyReportEmail({
      recipients,
      attachmentBuffer,
      reportDateLabel,
      fileName: outputFileName,
      mimeType,
    });

    await WeeklyReportLog.create({
      reportDate,
      triggeredBy,
      triggeredByUser,
      recipientEmails: recipients,
      totalJobs: rows.length,
      fileName,
      format: normalizedFormat,
      filters: normalizedFilters,
      status: "success",
      errorMessage: null,
    });

    return {
      reportDate,
      totalJobs: rows.length,
      recipients,
      fileName,
      format: normalizedFormat,
      filters: normalizedFilters,
    };
  } catch (error) {
    await WeeklyReportLog.create({
      reportDate,
      triggeredBy,
      triggeredByUser,
      recipientEmails: recipients,
      totalJobs: 0,
      fileName: null,
      format: normalizedFormat,
      filters: normalizedFilters,
      status: "failed",
      errorMessage: error.message,
    });
    throw error;
  }
};

export const getLastWeeklyReportService = async () => {
  const latest = await WeeklyReportLog.findOne({ status: "success" })
    .sort({ reportDate: -1 })
    .select("reportDate triggeredBy triggeredByUser recipientEmails totalJobs fileName format status")
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

export const getWeeklyReportHistoryService = async ({
  dateFrom,
  dateTo,
  format,
  status,
  limit = DEFAULT_HISTORY_LIMIT,
} = {}) => {
  const query = {};

  const from = normalizeDateStart(dateFrom);
  const to = normalizeDateEnd(dateTo);
  if (from || to) {
    query.reportDate = {};
    if (from) query.reportDate.$gte = from;
    if (to) query.reportDate.$lte = to;
  }

  if (format && SUPPORTED_REPORT_FORMATS.has(String(format).toLowerCase())) {
    query.format = String(format).toLowerCase();
  }
  if (status && ["success", "failed"].includes(String(status).toLowerCase())) {
    query.status = String(status).toLowerCase();
  }

  const parsedLimit = Math.max(1, Math.min(Number(limit) || DEFAULT_HISTORY_LIMIT, 200));
  const logs = await WeeklyReportLog.find(query)
    .sort({ reportDate: -1 })
    .limit(parsedLimit)
    .select(
      "reportDate triggeredBy triggeredByUser recipientEmails totalJobs fileName format status errorMessage filters createdAt"
    )
    .lean();

  return {
    total: logs.length,
    logs,
  };
};
