import mongoose from "mongoose";

const CANDIDATE_STATUSES = [
  "Applied",
  "Screened",
  "Shortlisted",
  "Technical Interview 1",
  "Technical Interview 2",
  "HR Interview",
  "Selected",
  "Rejected",
];

const candidateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    jobID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobManagement",
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    contactDetails: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    skills: {
      type: [String],
      required: true,
    },
    experience: {
      type: Number,
      required: true,
    },
    education: {
      type: String,
      required: true,
    },
    noticePeriod: {
      type: Number,
      required: true,
    },
    referal: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      enum: CANDIDATE_STATUSES,
      default: "Applied",
    },
    statusHistory: [
      {
        status: {
          type: String,
          enum: CANDIDATE_STATUSES,
          required: true,
        },
        updatedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    notes: [
      {
        text: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    resume: {
      fileName: String,
      filePath: String,
      mimeType: String,
      uploadedAt: Date,
    },
    feedback: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

const Candidate = mongoose.model("Candidate", candidateSchema);

export default Candidate;
