import cron from "node-cron";
import {
  cleanupOldResolvedAlerts,
  upsertJobExpiringAlerts,
  upsertInterviewReminderAlerts,
  upsertCandidateInactiveAlerts,
} from "../services/alert.service.js";

const DEFAULT_SCHEDULE = "0 * * * *";
const DEFAULT_TIMEZONE = "Asia/Kolkata";

export const startAlertsCron = () => {
  const isEnabled = process.env.ALERTS_CRON_ENABLED !== "false";
  if (!isEnabled) {
    console.log("[AlertsCron] Disabled by ALERTS_CRON_ENABLED=false");
    return null;
  }

  const schedule = process.env.ALERTS_CRON_SCHEDULE || DEFAULT_SCHEDULE;
  const timezone = process.env.ALERTS_CRON_TIMEZONE || DEFAULT_TIMEZONE;

  const task = cron.schedule(
    schedule,
    async () => {
      try {
        const [upsertResult, reminderResult, inactiveResult, cleanupResult] =
          await Promise.all([
            upsertJobExpiringAlerts({ withinDays: 1 }),
            upsertInterviewReminderAlerts({ withinMinutes: 60 }),
            upsertCandidateInactiveAlerts({ inactiveDays: 7 }),
            cleanupOldResolvedAlerts({ olderThanDays: 90 }),
          ]);

        console.log(
          `[AlertsCron] Completed | expiringJobs=${upsertResult.matchedJobs} reminders=${
            reminderResult.matchedReminders
          } inactiveCandidates=${inactiveResult.matchedCandidates} cleaned=${
            cleanupResult.deletedCount
          }`
        );
      } catch (error) {
        console.error("[AlertsCron] Failed", error);
      }
    },
    { timezone }
  );

  console.log(`[AlertsCron] Scheduled "${schedule}" (${timezone})`);
  return task;
};

