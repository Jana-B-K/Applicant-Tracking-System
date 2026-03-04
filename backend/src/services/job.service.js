import JobManagement from "../models/job.model.js";

export const createJob = async (jobData) => {
    const job = await JobManagement.create(jobData);
    return job;
}

export const getAllJobs = async () => {
    const jobs = await JobManagement.find({ isDeleted: false });
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

export const updateJobStatus = async (jobId, jobStatus) => {
    const updatedJob = await JobManagement.findByIdAndUpdate(jobId, { jobStatus }, { returnDocument: 'after' });
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
