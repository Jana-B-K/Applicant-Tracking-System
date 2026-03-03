import mongoose from "mongoose";
const applicationSchema = new mongoose.Schema({
  candidate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Candidate",
    required: true,
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "JobManagement",
    required: true,
  },
  applicationDate: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ["Applied", "In Review", "Interview Scheduled", "Offered", "Rejected"],
    default: "Applied",
  },
});

const Application = mongoose.model("Application", applicationSchema);

export default Application;