import * as jobService from '../services/job.service.js';

export const createJob = async (req, res, next) => {
    try {
        const jobData = req.body;
        const job = await jobService.createJob(jobData);
        res.status(201).json(job);
    } catch (error) {
        next(error);
    }
}

export const getAllJobs = async (req, res, next) => {
    try {
        const jobs = await jobService.getAllJobs();
        res.status(200).json(jobs);
    } catch (error) {
        next(error);
    }
}

export const getJobById = async (req, res, next) => {
    try {
        const jobId = req.params.id;
        const job = await jobService.getJobById(jobId);
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }
        res.status(200).json(job);
    } catch (error) {
        next(error);
    }
}

export const updateJob = async (req, res, next) => {
    try {
        const jobId = req.params.id;
        const jobData = req.body;
        const updatedJob = await jobService.updateJob(jobId, jobData);
        if (!updatedJob) {
            return res.status(404).json({ message: 'Job not found' });
        }
        res.status(200).json(updatedJob);
    } catch (error) {
        next(error);
    }
}

export const updateJobStatus = async (req, res, next) => {
    try {
        const jobId = req.params.id;
        const { jobStatus } = req.body;
        const updatedJob = await jobService.updateJobStatus(jobId, jobStatus);
        if (!updatedJob) {
            return res.status(404).json({ message: 'Job not found' });
        }
        res.status(200).json(updatedJob);
    } catch (error) {
        next(error);
    }
}

export const deletedJob = async (req, res, next) => {
    try {
        const jobId = req.params.id;
        const deletedJob = await jobService.deleteJob(jobId);
        if (!deletedJob) {
            return res.status(404).json({ message: 'Job not found' });
        }
        res.status(200).json(deletedJob);
    } catch (error) {
        next(error);
    }
}

export const jobAging = async (req, res, next) => {
    try {
        const agingData = await jobService.jobAging();
        res.status(200).json(agingData);
    } catch (error) {
        next(error);
    }
}

export const counts = async (req, res, next) => {
    try {
        const countsData = await jobService.counts();
        res.status(200).json(countsData);
    } catch (error) {
        next(error);
    }
}