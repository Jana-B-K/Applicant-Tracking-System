import * as candidateController from "../controllers/candidate.controller.js";
import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";

const CandidateRouter = express.Router();
const resumeUploadDir = path.join(process.cwd(), "uploads", "resumes");
fs.mkdirSync(resumeUploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, resumeUploadDir),
  filename: (_, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// Candidate CRUD
CandidateRouter.post("/candidates", candidateController.createCandidate);
CandidateRouter.get("/candidates", candidateController.getCandidates);
CandidateRouter.get("/candidate/:id", candidateController.getCandidateByID);
CandidateRouter.put("/candidate/:id", candidateController.updateCandidate);

// Status management
CandidateRouter.patch("/candidate/:id/status", candidateController.updateCandidateStatus);

// Resume upload
CandidateRouter.post(
  "/candidate/:id/upload-resume",
  upload.single("resume"),
  candidateController.uploadResume
);

// Interview management
CandidateRouter.get("/candidate/:id/interviews", candidateController.getCandidateInterviews);
CandidateRouter.post("/candidate/:id/interview", candidateController.addInterviewToCandidate);
CandidateRouter.patch(
  "/candidate/:id/interview/:interviewId",
  candidateController.updateInterviewForCandidate
);

// New routes
CandidateRouter.get("/candidate/:id/timeline", candidateController.getCandidateTimeline);
CandidateRouter.get("/analytics/interviews", candidateController.getInterviewAnalytics);

export default CandidateRouter;