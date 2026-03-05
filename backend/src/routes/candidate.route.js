import * as candidateController from "../controllers/candidate.controller.js";
import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { protect, requirePermission } from "../middleware/auth.middleware.js";

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
CandidateRouter.post("/candidates", protect, requirePermission("addCandidates"), candidateController.createCandidate);
CandidateRouter.get("/candidates", protect, requirePermission("viewCandidates"), candidateController.getCandidates);
CandidateRouter.get("/candidate/:id", protect, requirePermission("viewCandidates"), candidateController.getCandidateByID);
CandidateRouter.put("/candidate/:id", protect, requirePermission("editCandidates"), candidateController.updateCandidate);

// Status management
CandidateRouter.patch("/candidate/:id/status", protect, requirePermission("manageCandidateStages"), candidateController.updateCandidateStatus);

// Resume upload
CandidateRouter.post(
  "/candidate/:id/upload-resume",
  protect,
  requirePermission("editCandidates"),
  upload.single("resume"),
  candidateController.uploadResume
);

// Interview management
CandidateRouter.get("/candidate/:id/interviews", protect, requirePermission("viewCandidates"), candidateController.getCandidateInterviews);
CandidateRouter.post("/candidate/:id/interview", protect, requirePermission("manageCandidateStages"), candidateController.addInterviewToCandidate);
CandidateRouter.patch(
  "/candidate/:id/interview/:interviewId",
  protect,
  requirePermission("manageCandidateStages"),
  candidateController.updateInterviewForCandidate
);

// New routes
CandidateRouter.get("/candidate/:id/timeline", protect, requirePermission("viewCandidates"), candidateController.getCandidateTimeline);
CandidateRouter.get("/analytics/interviews", protect, requirePermission("viewCandidates"), candidateController.getInterviewAnalytics);

export default CandidateRouter;
