import mongoose from "mongoose";

const alertSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "job_expiring",
        "status_transition",
        "interview_completed",
        "interview_scheduled",
        "candidate_assigned",
        "offer_accepted",
        "job_status_changed",
        "interview_reminder",
        "candidate_inactive",
      ],
      required: true,
    },
    section: {
      type: String,
      enum: ["important", "general"],
      required: true,
    },
    category: {
      type: String,
      enum: ["JOBS", "CANDIDATES", "SYSTEM"],
      required: true,
    },
    severity: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "low",
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    sourceKey: {
      type: String,
      index: true,
      unique: true,
      sparse: true,
    },
    // target users for this notification; if empty or missing, visible to everyone with dashboard access
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    readBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

alertSchema.index({ section: 1, timestamp: -1 });
alertSchema.index({ category: 1, timestamp: -1 });
alertSchema.index({ users: 1, timestamp: -1 });

const Alert = mongoose.model("Alert", alertSchema);

export default Alert;
