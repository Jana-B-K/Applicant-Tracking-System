import * as jobController from '../controllers/job.controller.js';
import express from 'express';
import { protect, requirePermission } from "../middleware/auth.middleware.js";

const jobRouter = express.Router();

jobRouter.post('/', protect, requirePermission("createJobs"), jobController.createJob);
jobRouter.get('/', protect, requirePermission("viewJobs"), jobController.getAllJobs);
jobRouter.get('/aging', protect, requirePermission("viewJobs"), jobController.jobAging);
jobRouter.get('/counts', protect, requirePermission("viewJobs"), jobController.counts);
jobRouter.delete('/by-date', protect, requirePermission("deleteJobs"), jobController.deleteJobsByDate);
jobRouter.get('/:id', protect, requirePermission("viewJobs"), jobController.getJobById);
jobRouter.put('/:id', protect, requirePermission("editJobs"), jobController.updateJob); 
jobRouter.put('/:id/status', protect, requirePermission("editJobs"), jobController.updateJobStatus);
jobRouter.delete('/:id', protect, requirePermission("deleteJobs"), jobController.deletedJob);

export default jobRouter;
