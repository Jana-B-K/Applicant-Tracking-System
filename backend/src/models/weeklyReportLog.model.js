import mongoose from "mongoose";

const weeklyReportLogSchema = new mongoose.Schema(
  {
    reportDate: {
      type: Date,
      required: true,
      index: true,
    },
    triggeredBy: {
      type: String,
      enum: ["cron", "manual"],
      required: true,
    },
    triggeredByUser: {
      type: String,
      default: null,
      trim: true,
    },
    recipientEmails: {
      type: [String],
      default: [],
    },
    totalJobs: {
      type: Number,
      default: 0,
    },
    fileName: {
      type: String,
      default: null,
      trim: true,
    },
    format: {
      type: String,
      enum: ["xlsx", "pdf"],
      default: "xlsx",
    },
    filters: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ["success", "failed"],
      required: true,
    },
    errorMessage: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const WeeklyReportLog = mongoose.model("WeeklyReportLog", weeklyReportLogSchema);

export default WeeklyReportLog;
