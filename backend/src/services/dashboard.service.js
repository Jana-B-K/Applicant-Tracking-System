import JobManagement from "../models/job.model.js";
import Candidate from "../models/candidate.model.js";
import WeeklyReportLog from "../models/weeklyReportLog.model.js";
import { getAlertsFeedForUser } from "./alert.service.js";

const MS_IN_DAY = 24 * 60 * 60 * 1000;

const STAGE_ORDER = [
  "applied",
  "screened",
  "shortlisted",
  "technical interview 1",
  "technical interview 2",
  "hr round",
  "selected",
  "offered",
  "offer accepted",
  "offer declined",
  "offer revoked",
  "bgv",
  "joined",
  "rejected technical interview 1",
  "rejected technical interview 2",
  "rejected",
  "cancelled",
  "candidate not interested",
  "no answer",
];

const clampWeeks = (value) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return 8;
  return Math.min(Math.max(parsed, 1), 52);
};

const getWeekStartUtc = (date) => {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay();
  const diffToMonday = (day + 6) % 7;
  d.setUTCDate(d.getUTCDate() - diffToMonday);
  return d;
};

const formatWeekLabel = (date) => date.toISOString().slice(0, 10);
const formatTimeAgo = (inputDate, now = new Date()) => {
  if (!inputDate) return null;
  const date = new Date(inputDate);
  const diffMs = now - date;
  if (Number.isNaN(diffMs) || diffMs < 0) return null;
  const mins = Math.floor(diffMs / (60 * 1000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  return `${days}d ago`;
};

export const getDashboardSummary = async () => {
  const [totalOpenPositions, filledPositions, totalCandidates, timeToFillRaw] = await Promise.all([
    JobManagement.countDocuments({ jobStatus: "Open", isDeleted: { $ne: true } }),
    JobManagement.countDocuments({ jobStatus: "Filled", isDeleted: { $ne: true } }),
    Candidate.countDocuments(),
    JobManagement.aggregate([
      {
        $match: {
          jobStatus: "Filled",
          isDeleted: { $ne: true },
          createdAt: { $type: "date" },
          updatedAt: { $type: "date" },
          $expr: { $gte: ["$updatedAt", "$createdAt"] },
        },
      },
      {
        $project: {
          timeToFillDays: {
            $divide: [{ $subtract: ["$updatedAt", "$createdAt"] }, MS_IN_DAY],
          },
        },
      },
      {
        $group: {
          _id: null,
          avgDays: { $avg: "$timeToFillDays" },
        },
      },
    ]),
  ]);

  return {
    totalOpenPositions,
    filledPositions,
    totalCandidates,
    averageTimeToFillDays: timeToFillRaw.length > 0 ? Number(timeToFillRaw[0].avgDays.toFixed(2)) : 0,
  };
};


 
export const getHiringFunnel = async () => {
  const stageCounts = await Candidate.aggregate([
    {
      $project: {
       normalizedStage: {
          $toLower: {
            $trim: { input: { $ifNull: ["$status", ""] } },
          },
        },
      },
    },
    {
      $group: {
        _id: "$normalizedStage",
        count: { $sum: 1 },
      },
    },
  ]);
  const countByStage = new Map(stageCounts.map((item) => [item._id, item.count]));

  return STAGE_ORDER.map((stage) => ({
    stage,
    count: countByStage.get(stage) || 0,
  }));
};
 

export const getWeeklyHiringStats = async (weeksInput) => {
  const weeks = clampWeeks(weeksInput);
  const now = new Date();
  const currentWeekStart = getWeekStartUtc(now);
  const startWeek = new Date(currentWeekStart);
  startWeek.setUTCDate(startWeek.getUTCDate() - (weeks - 1) * 7);

  const [openedAgg, filledAgg, candidatesAgg] = await Promise.all([
    JobManagement.aggregate([
      { $match: { createdAt: { $gte: startWeek }, isDeleted: { $ne: true } } },
      {
        $group: {
          _id: {
            year: { $isoWeekYear: "$createdAt" },
            week: { $isoWeek: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
    ]),
    JobManagement.aggregate([
      {
        $match: {
          updatedAt: { $gte: startWeek },
          jobStatus: "Filled",
          isDeleted: { $ne: true },
        },
      },
      {
        $group: {
          _id: {
            year: { $isoWeekYear: "$updatedAt" },
            week: { $isoWeek: "$updatedAt" },
          },
          count: { $sum: 1 },
        },
      },
    ]),
    Candidate.aggregate([
      { $match: { createdAt: { $gte: startWeek } } },
      {
        $group: {
          _id: {
            year: { $isoWeekYear: "$createdAt" },
            week: { $isoWeek: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const openedMap = new Map(openedAgg.map((row) => [`${row._id.year}-${row._id.week}`, row.count]));
  const filledMap = new Map(filledAgg.map((row) => [`${row._id.year}-${row._id.week}`, row.count]));
  const candidatesMap = new Map(candidatesAgg.map((row) => [`${row._id.year}-${row._id.week}`, row.count]));

  const points = [];
  for (let i = 0; i < weeks; i += 1) {
    const weekStart = new Date(startWeek);
    weekStart.setUTCDate(startWeek.getUTCDate() + i * 7);

    const isoKeyDate = new Date(weekStart);
    isoKeyDate.setUTCDate(weekStart.getUTCDate() + 3);
    const isoYear = isoKeyDate.getUTCFullYear();

    const jan4 = new Date(Date.UTC(isoYear, 0, 4));
    const jan4Monday = getWeekStartUtc(jan4);
    const weekNumber = Math.floor((weekStart - jan4Monday) / (7 * MS_IN_DAY)) + 1;

    const key = `${isoYear}-${weekNumber}`;

    points.push({
      weekStart: formatWeekLabel(weekStart),
      openPositions: openedMap.get(key) || 0,
      filledPositions: filledMap.get(key) || 0,
      newCandidates: candidatesMap.get(key) || 0,
    });
  }

  return points;
};

const clampPositiveInt = (value, fallback, min, max) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
};

export const getHiringAlerts = async ({
  endInDays: endInDaysInput,
  transitionDays: transitionDaysInput,
  transitionLimit: transitionLimitInput,
  agingDays: agingDaysInput,
  interviewDoneDays: interviewDoneDaysInput,
  interviewLimit: interviewLimitInput,
  newApplicantDays: newApplicantDaysInput,
  userId = null,
} = {}) => {
  const endInDays = clampPositiveInt(endInDaysInput, 1, 1, 90);
  const transitionDays = clampPositiveInt(transitionDaysInput, 1, 1, 90);
  const transitionLimit = clampPositiveInt(transitionLimitInput, 50, 1, 500);
  const agingDays = clampPositiveInt(agingDaysInput, 20, 1, 365);
  const interviewDoneDays = clampPositiveInt(interviewDoneDaysInput, 1, 1, 30);
  const interviewLimit = clampPositiveInt(interviewLimitInput, 50, 1, 500);
  const newApplicantDays = clampPositiveInt(newApplicantDaysInput, 1, 1, 30);

  const now = new Date();
  const jobsEndDate = new Date(now);
  jobsEndDate.setUTCDate(jobsEndDate.getUTCDate() + endInDays);

  const transitionSince = new Date(now);
  transitionSince.setUTCDate(transitionSince.getUTCDate() - transitionDays);

  const agingSince = new Date(now);
  agingSince.setUTCDate(agingSince.getUTCDate() - agingDays);

  const interviewDoneSince = new Date(now);
  interviewDoneSince.setUTCDate(interviewDoneSince.getUTCDate() - interviewDoneDays);

  const newApplicantSince = new Date(now);
  newApplicantSince.setUTCDate(newApplicantSince.getUTCDate() - newApplicantDays);

  const [
    jobsClosingSoon,
    agingJobsRaw,
    candidatesWithHistory,
    candidatesWithCompletedInterviews,
    candidatesWithUpcomingInterviews,
    newApplicantsRaw,
    latestWeeklyReport,
  ] = await Promise.all([
    JobManagement.find({
      isDeleted: { $ne: true },
      jobStatus: { $in: ["Open", "On Hold"] },
      targetClosureDate: { $gte: now, $lte: jobsEndDate },
    })
      .select("jobTitle department location jobStatus targetClosureDate numberOfOpenings")
      .sort({ targetClosureDate: 1 })
      .lean(),
    JobManagement.find({
      isDeleted: { $ne: true },
      jobStatus: { $in: ["Open", "On Hold"] },
      createdAt: { $lte: agingSince },
    })
      .select("jobTitle department location jobStatus numberOfOpenings createdAt targetClosureDate")
      .sort({ createdAt: 1 })
      .limit(transitionLimit)
      .lean(),
    Candidate.find({
      "statusHistory.1": { $exists: true },
      "statusHistory.updatedAt": { $gte: transitionSince },
    })
      .select("name email jobID statusHistory")
      .populate("jobID", "jobTitle department location")
      .lean(),
    Candidate.find({
      "interviews.completedAt": { $gte: interviewDoneSince },
    })
      .select("name email jobID interviews")
      .populate("jobID", "jobTitle department location")
      .populate("interviews.interviewer.id", "firstName lastName email role")
      .lean(),
    Candidate.find({
      "interviews.scheduledAt": { $gte: now },
      "interviews.result": "Pending",
    })
      .select("name email interviews")
      .populate("interviews.interviewer.id", "firstName lastName email role")
      .lean(),
    Candidate.find({
      createdAt: { $gte: newApplicantSince },
    })
      .select("name jobID createdAt")
      .populate("jobID", "jobTitle")
      .sort({ createdAt: -1 })
      .limit(interviewLimit)
      .lean(),
    WeeklyReportLog.findOne({ status: "success" })
      .sort({ reportDate: -1 })
      .select("reportDate createdAt")
      .lean(),
  ]);

  const candidateStageTransitions = candidatesWithHistory
    .flatMap((candidate) => {
      const history = Array.isArray(candidate.statusHistory) ? candidate.statusHistory : [];
      return history
        .map((entry, index) => ({ entry, index }))
        .filter(({ index, entry }) => index > 0 && entry?.updatedAt && new Date(entry.updatedAt) >= transitionSince)
        .map(({ entry, index }) => ({
          candidateId: candidate._id,
          candidateName: candidate.name,
          candidateEmail: candidate.email,
          job: candidate.jobID
            ? {
                id: candidate.jobID._id || candidate.jobID,
                jobTitle: candidate.jobID.jobTitle || null,
                department: candidate.jobID.department || null,
                location: candidate.jobID.location || null,
              }
            : null,
          fromStatus: history[index - 1]?.status || null,
          toStatus: entry.status || null,
          movedAt: entry.updatedAt,
          updatedByName: entry.updatedByName || null,
          updatedByEmail: entry.updatedByEmail || null,
        }));
    })
    .sort((a, b) => new Date(b.movedAt) - new Date(a.movedAt))
    .slice(0, transitionLimit);

  const jobAging = agingJobsRaw.map((job) => {
    const createdAt = job.createdAt ? new Date(job.createdAt) : null;
    const targetClosureDate = job.targetClosureDate ? new Date(job.targetClosureDate) : null;
    const agingDaysValue = createdAt
      ? Math.floor((now - createdAt) / MS_IN_DAY)
      : null;
    const daysToClosure = targetClosureDate
      ? Math.ceil((targetClosureDate - now) / MS_IN_DAY)
      : null;

    return {
      ...job,
      agingDays: agingDaysValue,
      daysToClosure,
      severity:
        agingDaysValue !== null && agingDaysValue >= agingDays + 15
          ? "high"
          : "medium",
    };
  });

  const interviewsCompleted = candidatesWithCompletedInterviews
    .flatMap((candidate) => {
      const interviews = Array.isArray(candidate.interviews) ? candidate.interviews : [];
      return interviews
        .filter((interview) => {
          const completedAt = interview?.completedAt ? new Date(interview.completedAt) : null;
          if (!completedAt || completedAt < interviewDoneSince) return false;
          return !["Pending", "Rescheduled"].includes(interview?.result || "Pending");
        })
        .map((interview) => ({
          candidateId: candidate._id,
          candidateName: candidate.name,
          candidateEmail: candidate.email,
          job: candidate.jobID
            ? {
                id: candidate.jobID._id || candidate.jobID,
                jobTitle: candidate.jobID.jobTitle || null,
                department: candidate.jobID.department || null,
                location: candidate.jobID.location || null,
              }
            : null,
          stage: interview.stage || null,
          result: interview.result || null,
          feedback: interview.feedback || null,
          completedAt: interview.completedAt || null,
          interviewer: {
            id:
              interview?.interviewer?.id?._id ||
              interview?.interviewer?.id ||
              null,
            name:
              interview?.interviewer?.id
                ? `${interview.interviewer.id.firstName || ""} ${interview.interviewer.id.lastName || ""}`.trim() ||
                  interview?.interviewer?.name ||
                  null
                : interview?.interviewer?.name || null,
            email:
              interview?.interviewer?.id?.email ||
              interview?.interviewer?.email ||
              null,
            role:
              interview?.interviewer?.id?.role ||
              interview?.interviewer?.role ||
              null,
          },
        }));
    })
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
    .slice(0, interviewLimit);

  const upcomingInterviewEvents = candidatesWithUpcomingInterviews.flatMap((candidate) =>
    (candidate.interviews || [])
      .filter(
        (interview) =>
          interview?.scheduledAt &&
          new Date(interview.scheduledAt) >= now &&
          (interview?.result || "Pending") === "Pending"
      )
      .map((interview) => {
        const interviewerId =
          interview?.interviewer?.id?._id?.toString?.() ||
          interview?.interviewer?.id?.toString?.() ||
          null;
        const scheduledAt = new Date(interview.scheduledAt);
        const keyTime = `${scheduledAt.getUTCFullYear()}-${scheduledAt.getUTCMonth()}-${scheduledAt.getUTCDate()}-${scheduledAt.getUTCHours()}-${scheduledAt.getUTCMinutes()}`;
        return {
          key: `${interviewerId || "unknown"}-${keyTime}`,
          candidateName: candidate.name,
          scheduledAt,
          interviewer: interview?.interviewer || null,
          stage: interview?.stage || null,
        };
      })
  );

  const groupedUpcomingBySlot = new Map();
  for (const event of upcomingInterviewEvents) {
    const bucket = groupedUpcomingBySlot.get(event.key) || [];
    bucket.push(event);
    groupedUpcomingBySlot.set(event.key, bucket);
  }

  const interviewConflicts = Array.from(groupedUpcomingBySlot.values())
    .filter((events) => events.length > 1)
    .map((events, idx) => {
      const first = events[0];
      const interviewerName =
        first?.interviewer?.id
          ? `${first.interviewer.id.firstName || ""} ${first.interviewer.id.lastName || ""}`.trim() ||
            first?.interviewer?.name ||
            "Interviewer"
          : first?.interviewer?.name || "Interviewer";
      const candidateNames = events.map((e) => e.candidateName).join(", ");
      return {
        id: `interview-conflict-${idx}`,
        section: "important",
        severity: "high",
        category: "CANDIDATES",
        title: "Interview Conflict Detected",
        message: `${interviewerName} has overlapping interviews for ${candidateNames}.`,
        timestamp: first.scheduledAt,
        timeAgo: formatTimeAgo(first.scheduledAt, now),
        meta: {
          type: "interview_conflict",
          interviewerId: first?.interviewer?.id?._id || first?.interviewer?.id || null,
          candidates: events.map((e) => e.candidateName),
          stage: first.stage,
        },
      };
    })
    .slice(0, Math.min(interviewLimit, 20));

  const newApplicants = newApplicantsRaw.map((candidate, idx) => ({
    id: `new-applicant-${candidate._id || idx}`,
    section: "general",
    severity: "low",
    category: "CANDIDATES",
    title: "New Applicant",
    message: `${candidate.name} applied for ${candidate?.jobID?.jobTitle || "a role"}.`,
    timestamp: candidate.createdAt,
    timeAgo: formatTimeAgo(candidate.createdAt, now),
    meta: {
      type: "new_applicant",
      candidateId: candidate._id || null,
      jobId: candidate?.jobID?._id || null,
    },
  }));

  const reportGeneratedAlert =
    latestWeeklyReport && latestWeeklyReport.reportDate
      ? {
          id: `report-generated-${latestWeeklyReport._id || "latest"}`,
          section: "general",
          severity: "low",
          category: "SYSTEM",
          title: "Report Generated",
          message: `Weekly hiring report for ${new Date(latestWeeklyReport.reportDate).toLocaleDateString("en-IN")} is ready.`,
          timestamp: latestWeeklyReport.createdAt || latestWeeklyReport.reportDate,
          timeAgo: formatTimeAgo(latestWeeklyReport.createdAt || latestWeeklyReport.reportDate, now),
          meta: { type: "report_generated", reportDate: latestWeeklyReport.reportDate },
        }
      : null;

  const importantAlerts = [
    ...jobsClosingSoon.map((job, idx) => ({
      id: `job-closing-${job._id || idx}`,
      section: "important",
      severity: "high",
      category: "JOBS",
      title: "Job Posting Expiring",
      message: `${job.jobTitle} closes on ${new Date(job.targetClosureDate).toLocaleDateString("en-IN")} (${job.department || "N/A"}).`,
      timestamp: job.targetClosureDate,
      timeAgo: formatTimeAgo(job.targetClosureDate, now),
      meta: { type: "job_closing_soon", jobId: job._id || null },
    })),
    ...jobAging
      .filter((job) => job.severity === "high")
      .map((job, idx) => ({
        id: `job-aging-${job._id || idx}`,
        section: "important",
        severity: "high",
        category: "JOBS",
        title: "Job Aging Alert",
        message: `${job.jobTitle} is open for ${job.agingDays} days.`,
        timestamp: job.createdAt,
        timeAgo: formatTimeAgo(job.createdAt, now),
        meta: { type: "job_aging", jobId: job._id || null, agingDays: job.agingDays },
      })),
    ...interviewConflicts,
  ];

  const generalAlerts = [
    ...newApplicants,
    ...interviewsCompleted.map((item, idx) => ({
      id: `interview-done-${item.candidateId || idx}-${idx}`,
      section: "general",
      severity: item.result === "Failed" ? "medium" : "low",
      category: "CANDIDATES",
      title: "Interview Completed",
      message: `${item.stage} by ${item.interviewer?.name || "Interviewer"} for ${item.candidateName} - Result: ${item.result}.`,
      timestamp: item.completedAt,
      timeAgo: formatTimeAgo(item.completedAt, now),
      meta: {
        type: "interview_completed",
        candidateId: item.candidateId,
        interviewerId: item.interviewer?.id || null,
        result: item.result,
      },
    })),
    ...candidateStageTransitions.map((item, idx) => ({
      id: `stage-transition-${item.candidateId || idx}-${idx}`,
      section: "general",
      severity: "low",
      category: "CANDIDATES",
      title: "Candidate Stage Updated",
      message: `${item.candidateName}: ${item.fromStatus || "N/A"} -> ${item.toStatus || "N/A"}.`,
      timestamp: item.movedAt,
      timeAgo: formatTimeAgo(item.movedAt, now),
      meta: { type: "candidate_stage_transition", candidateId: item.candidateId },
    })),
    ...(reportGeneratedAlert ? [reportGeneratedAlert] : []),
  ];

  const uiAlerts = {
    importantAndPriority: importantAlerts
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 20),
    generalNotifications: generalAlerts
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 50),
  };

  const uiSummary = {
    importantNewCount: uiAlerts.importantAndPriority.length,
    generalNewCount: uiAlerts.generalNotifications.length,
    totalNewCount: uiAlerts.importantAndPriority.length + uiAlerts.generalNotifications.length,
  };

  let persistedAlerts = null;
  try {
    persistedAlerts = await getAlertsFeedForUser({
      userId,
      limitImportant: 20,
      limitGeneral: 50,
    });
  } catch (error) {
    console.error("[Alert] getAlertsFeedForUser failed", error);
  }

  const finalUiAlerts =
    persistedAlerts &&
    (persistedAlerts.uiAlerts.importantAndPriority.length > 0 ||
      persistedAlerts.uiAlerts.generalNotifications.length > 0)
      ? persistedAlerts.uiAlerts
      : uiAlerts;

  const finalUiSummary = persistedAlerts ? persistedAlerts.uiSummary : uiSummary;

  return {
    filters: {
      endInDays,
      transitionDays,
      transitionLimit,
      agingDays,
      interviewDoneDays,
      interviewLimit,
      newApplicantDays,
    },
    summaryCounts: {
      jobsClosingSoon: jobsClosingSoon.length,
      jobAging: jobAging.length,
      candidateStageTransitions: candidateStageTransitions.length,
      interviewsCompleted: interviewsCompleted.length,
    },
    segments: {
      jobsClosingSoon,
      jobAging,
      candidateStageTransitions,
      interviewsCompleted,
    },
    uiAlerts: finalUiAlerts,
    uiSummary: finalUiSummary,
    // Backward-compatible keys
    jobsClosingSoon,
    jobAging,
    candidateStageTransitions,
    interviewsCompleted,
  };
};
