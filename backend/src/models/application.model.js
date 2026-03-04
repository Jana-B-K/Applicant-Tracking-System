import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: true,
      index: true,
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobManagement",
      required: true,
      index: true,
    },
    stage: {
      type: String,
      enum: ["applied", "screening", "interview", "offered", "hired", "rejected"],
      default: "applied",
      index: true,
    },
    movedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 3000,
    },
  },
  { timestamps: true }
);

applicationSchema.index({ candidate: 1, job: 1 }, { unique: true });
applicationSchema.index({ createdAt: 1, stage: 1 });

const Application = mongoose.model("Application", applicationSchema);

export default Application;
