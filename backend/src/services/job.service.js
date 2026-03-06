import JobManagement from "../models/job.model.js";
import { createJobStatusChangedAlert } from "./alert.service.js";
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const createJob = async (jobData) => {
    const job = await JobManagement.create(jobData);
    return job;
}

export const getAllJobs = async (filters) => {
    const {
        jobTitle,
        department,
        location,
        jobStatus,
        emplyementType,
        experienceLevel,
    } = filters;

    const query = { isDeleted: false };

    if (jobTitle) query.jobTitle = { $regex: escapeRegex(jobTitle), $options: "i" };
    if (department) query.department = { $regex: `^${escapeRegex(department)}$`, $options: "i" };
    if (location) query.location = { $regex: `^${escapeRegex(location)}$`, $options: "i" };
    if (jobStatus) query.jobStatus = jobStatus;
    if (emplyementType) query.emplyementType = { $regex: `^${escapeRegex(emplyementType)}$`, $options: "i" };
    if (experienceLevel) query.experienceLevel = { $regex: `^${escapeRegex(experienceLevel)}$`, $options: "i" };

    const jobs = await JobManagement.find(query);
    return jobs;
}

export const getJobById = async (jobId) => {
    const job = await JobManagement.findById(jobId);
    return job;
}

export const updateJob = async (jobId, jobData) => {
    const updatedJob = await JobManagement.findByIdAndUpdate(jobId, jobData, { returnDocument: 'after' });
    return updatedJob;
}

export const updateJobStatus = async (jobId, jobStatus, updatedByUser = null) => {
    const existing = await JobManagement.findById(jobId).select('jobTitle jobStatus');
    const updatedJob = await JobManagement.findByIdAndUpdate(jobId, { jobStatus }, { returnDocument: 'after' });
    // fire notification if status changed (background)
    createJobStatusChangedAlert({
      job: existing || updatedJob,
      fromStatus: existing?.jobStatus,
      toStatus: jobStatus,
      updatedBy: updatedByUser,
    }).catch((err) => {
      console.error('[Alert] createJobStatusChangedAlert failed', err);
    });
    return updatedJob;
}

export const deleteJob = async (jobId) => {
    const deletedJob = await JobManagement.findByIdAndUpdate(jobId, { isDeleted: true }, { returnDocument: 'after' });
    return deletedJob;
}

export const deleteJobsByDate = async (beforeDate) => {
    const cutoffDate = new Date(beforeDate);

    const result = await JobManagement.updateMany(
        {
            isDeleted: false,
            targetClosureDate: { $lte: cutoffDate }
        },
        { isDeleted: true }
    );

    return {
        beforeDate: cutoffDate,
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
    };
}

export const jobAging = async () => {
    const jobs = await JobManagement.find({ isDeleted: false });
    const today = new Date();
    const agingData = jobs.map((job) => {
        // Fallback to ObjectId timestamp for older records without createdAt.
        const createdDate = job.createdAt ? new Date(job.createdAt) : job._id.getTimestamp();
        const aging = Math.floor((today - createdDate) / (1000 * 60 * 60 * 24));
        return {
            jobId: job._id,
            jobTitle: job.jobTitle,
            createdDate,
            aging: aging
        };
    });
    return agingData;
}

export const counts = async () => {
    const totalJobs = await JobManagement.countDocuments();
    const openJobs = await JobManagement.countDocuments({ jobStatus: 'Open' });
    const closedJobs = await JobManagement.countDocuments({ jobStatus: 'Closed' });
    const onHoldJobs = await JobManagement.countDocuments({ jobStatus: 'On Hold' });
    const cancelledJobs = await JobManagement.countDocuments({ jobStatus: 'Cancelled' });
    const filledJobs = await JobManagement.countDocuments({ jobStatus: 'Filled' });

    return {
        totalJobs,
        openJobs,
        closedJobs,
        onHoldJobs,
        cancelledJobs,
        filledJobs
    };
}
