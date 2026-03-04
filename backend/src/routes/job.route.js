import * as jobController from '../controllers/job.controller.js';
import express from 'express';

const jobRouter = express.Router();

jobRouter.post('/', jobController.createJob);
jobRouter.get('/', jobController.getAllJobs);
jobRouter.get('/aging', jobController.jobAging);
jobRouter.get('/counts', jobController.counts);
jobRouter.delete('/by-date', jobController.deleteJobsByDate);
jobRouter.get('/:id', jobController.getJobById);
jobRouter.put('/:id', jobController.updateJob); 
jobRouter.put('/:id/status', jobController.updateJobStatus);
jobRouter.delete('/:id', jobController.deletedJob);

export default jobRouter;
