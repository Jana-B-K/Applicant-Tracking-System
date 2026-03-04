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

CandidateRouter.post("/candidates", candidateController.createCandidate);
CandidateRouter.get("/candidates", candidateController.getCandidates);
CandidateRouter.get("/candidate/:id", candidateController.getCandidateByID);
CandidateRouter.put("/candidate/:id", candidateController.updateCandidate);
CandidateRouter.patch("/candidate/:id/status", candidateController.updateCandidateStatus);
CandidateRouter.post("/candidate/:id/note", candidateController.addNoteToCandidate);
CandidateRouter.post("/candidate/:id/upload-resume", upload.single("resume"), candidateController.uploadResume);

export default CandidateRouter;
