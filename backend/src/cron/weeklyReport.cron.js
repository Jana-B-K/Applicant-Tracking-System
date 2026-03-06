import cron from "node-cron";
import { sendWeeklyReportService } from "../services/weeklyReport.service.js";

const DEFAULT_SCHEDULE = "0 10 * * 5";
const DEFAULT_TIMEZONE = "Asia/Kolkata";

export const startWeeklyReportCron = () => {
  const isEnabled = process.env.WEEKLY_REPORT_ENABLED !== "false";
  if (!isEnabled) {
    console.log("[WeeklyReportCron] Disabled by WEEKLY_REPORT_ENABLED=false");
    return null;
  }

  const schedule = process.env.WEEKLY_REPORT_CRON || DEFAULT_SCHEDULE;
  const timezone = process.env.WEEKLY_REPORT_TIMEZONE || DEFAULT_TIMEZONE;

  const task = cron.schedule(
    schedule,
    async () => {
      try {
        const result = await sendWeeklyReportService({ triggeredBy: "cron" });
        console.log(
          `[WeeklyReportCron] Completed | date=${new Date(result.reportDate).toISOString()} totalJobs=${result.totalJobs}`
        );
      } catch (error) {
        console.error("[WeeklyReportCron] Failed", error);
      }
    },
    { timezone }
  );

  console.log(`[WeeklyReportCron] Scheduled "${schedule}" (${timezone})`);
  return task;
};
