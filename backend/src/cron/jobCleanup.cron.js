import cron from 'node-cron';
import { deleteJobsByDate } from '../services/job.service.js';

const DEFAULT_SCHEDULE = '5 0 * * *';
const DEFAULT_TIMEZONE = 'Asia/Kolkata';

export const startJobCleanupCron = () => {
    const isEnabled = process.env.JOB_CLEANUP_ENABLED !== 'false';
    if (!isEnabled) {
        console.log('[JobCleanupCron] Disabled by JOB_CLEANUP_ENABLED=false');
        return null;
    }

    const schedule = process.env.JOB_CLEANUP_CRON || DEFAULT_SCHEDULE;
    const timezone = process.env.JOB_CLEANUP_TIMEZONE || DEFAULT_TIMEZONE;

    const task = cron.schedule(
        schedule,
        async () => {
            try {
                const cutoffDate = new Date();
                const result = await deleteJobsByDate(cutoffDate);
                console.log(
                    `[JobCleanupCron] Completed | cutoff=${cutoffDate.toISOString()} matched=${result.matchedCount} modified=${result.modifiedCount}`
                );
            } catch (error) {
                console.error('[JobCleanupCron] Failed', error);
            }
        },
        { timezone }
    );

    console.log(`[JobCleanupCron] Scheduled "${schedule}" (${timezone})`);
    return task;
};
