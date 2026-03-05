import mongoose from "mongoose";

const CANDIDATE_STATUSES = [
  "Applied",
  "Screened",
  "Shortlisted",
  "Technical Interview 1",
  "Technical Interview 2",
  "HR Round",
  "HR Interview",
  "Selected",
  "Offered",
  "Offer Accepted",
  "Offer Declined",
  "Offer Revoked",
  "BGV",
  "Cancelled",
  "No Answer",
  "Candidate Not Interested",
  "Joined",
  "Rejected Technical Interview 1",
  "Rejected Technical Interview 2",
  "Rejected",
  "On Hold",
  "Withdrawn"
];

const INTERVIEW_STAGES = [
  "Screening",
  "Technical Interview 1",
  "Technical Interview 2",
  "Technical Interview 3",
  "HR Interview",
  "Managerial Round",
  "Final Interview",
];

const INTERVIEW_RESULTS = ["Pending", "Passed", "Failed", "On Hold", "Rescheduled"];

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
    role: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      enum: CANDIDATE_STATUSES,
      default: "Applied",
    },
    
    // Enhanced Status History with Actor Tracking
    statusHistory: [
      {
        status: {
          type: String,
          enum: CANDIDATE_STATUSES,
          required: true,
        },
        comment: {
          type: String,
          required: false,
        },
        updatedAt: {
          type: Date,
          default: Date.now,
          required: true,
        },
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: false, // false for initial "Applied" status
        },
        updatedByName: {
          type: String,
          required: false,
        },
        updatedByEmail: {
          type: String,
          required: false,
        },
        updatedByRole: {
          type: String,
          required: false,
        },
      },
    ],
    
    // Enhanced Interviews Array
    interviews: [
      {
        stage: {
          type: String,
          enum: INTERVIEW_STAGES,
          required: true,
        },
        interviewer: {
          id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
          },
          name: {
            type: String,
            required: true,
          },
          email: {
            type: String,
            required: false,
          },
          role: {
            type: String,
            required: false,
          },
        },
        
        // Co-interviewers for panel interviews
        coInterviewers: [
          {
            id: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
            },
            name: String,
            email: String,
            role: String,
          },
        ],
        
        // Scheduling Details
        scheduledAt: {
          type: Date,
          required: true,
        },
        duration: {
          type: Number,
          default: 60, // minutes
        },
        meetingLink: {
          type: String,
          required: false,
        },
        location: {
          type: String,
          required: false,
        },
        
        // Completion Details
        completedAt: {
          type: Date,
          required: false,
        },
        actualDuration: {
          type: Number, // actual minutes taken
          required: false,
        },
        
        // Results
        result: {
          type: String,
          enum: INTERVIEW_RESULTS,
          default: "Pending",
        },
        
        // Feedback
        feedback: {
          type: String,
          required: function () {
            return this.result && !["Pending", "Rescheduled"].includes(this.result);
          },
        },
        
        // Timestamps
        createdAt: {
          type: Date,
          default: Date.now,
        },
        updatedAt: {
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
    
    // Application Metrics
    applicationMetrics: {
      totalInterviewsScheduled: {
        type: Number,
        default: 0,
      },
      totalInterviewsCompleted: {
        type: Number,
        default: 0,
      },
      totalInterviewsPassed: {
        type: Number,
        default: 0,
      },
      currentRound: {
        type: String,
        required: false,
      },
      daysInPipeline: {
        type: Number,
        default: 0,
      },
    },
    
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Indexes for performance
candidateSchema.index({ jobID: 1, status: 1, role: 1 });
candidateSchema.index({ email: 1 });
candidateSchema.index({ "interviews.scheduledAt": 1 });
candidateSchema.index({ "interviews.interviewer.id": 1 });
candidateSchema.index({ "interviews.result": 1 });

// Virtual to get current/next pending interview
candidateSchema.virtual("currentInterview").get(function () {
  if (this.interviews && this.interviews.length > 0) {
    const pendingInterviews = this.interviews
      .filter((i) => i.result === "Pending")
      .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
    
    return pendingInterviews[0] || null;
  }
  return null;
});

// Virtual to get latest completed interview
candidateSchema.virtual("lastCompletedInterview").get(function () {
  if (this.interviews && this.interviews.length > 0) {
    const completedInterviews = this.interviews
      .filter((i) => i.completedAt)
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
    
    return completedInterviews[0] || null;
  }
  return null;
});

// Pre-save hook to update metrics
candidateSchema.pre("save", function (next) {
  // Update days in pipeline
  if (this.createdAt) {
    const daysDiff = Math.floor(
      (new Date() - new Date(this.createdAt)) / (1000 * 60 * 60 * 24)
    );
    this.applicationMetrics.daysInPipeline = daysDiff;
  }
  
  // Update current round
  const pendingInterview = this.interviews
    .filter((i) => i.result === "Pending")
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))[0];
  
  if (pendingInterview) {
    this.applicationMetrics.currentRound = pendingInterview.stage;
  } else {
    this.applicationMetrics.currentRound = null;
  }
  
  // Count totals
  this.applicationMetrics.totalInterviewsScheduled = this.interviews.length;
  this.applicationMetrics.totalInterviewsCompleted = this.interviews.filter(
    (i) => i.completedAt && !["Pending", "Rescheduled"].includes(i.result)
  ).length;
  this.applicationMetrics.totalInterviewsPassed = this.interviews.filter(
    (i) => i.result === "Passed"
  ).length;
  
  // Update last activity
  this.lastActivityAt = new Date();
  
  next();
});

// Ensure virtuals are included in JSON
candidateSchema.set("toJSON", { virtuals: true });
candidateSchema.set("toObject", { virtuals: true });

const Candidate = mongoose.model("Candidate", candidateSchema);

export default Candidate;
