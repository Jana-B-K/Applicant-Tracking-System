import JobManagement from "../models/job.model.js";
import Candidate from "../models/candidate.model.js";

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
} = {}) => {
  const endInDays = clampPositiveInt(endInDaysInput, 1, 1, 90);
  const transitionDays = clampPositiveInt(transitionDaysInput, 1, 1, 90);
  const transitionLimit = clampPositiveInt(transitionLimitInput, 50, 1, 500);

  const now = new Date();
  const jobsEndDate = new Date(now);
  jobsEndDate.setUTCDate(jobsEndDate.getUTCDate() + endInDays);

  const transitionSince = new Date(now);
  transitionSince.setUTCDate(transitionSince.getUTCDate() - transitionDays);

  const [jobsClosingSoon, candidatesWithHistory] = await Promise.all([
    JobManagement.find({
      isDeleted: { $ne: true },
      jobStatus: { $in: ["Open", "On Hold"] },
      targetClosureDate: { $gte: now, $lte: jobsEndDate },
    })
      .select("jobTitle department location jobStatus targetClosureDate numberOfOpenings")
      .sort({ targetClosureDate: 1 })
      .lean(),
    Candidate.find({
      "statusHistory.1": { $exists: true },
      "statusHistory.updatedAt": { $gte: transitionSince },
    })
      .select("name email jobID statusHistory")
      .populate("jobID", "jobTitle department location")
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

  return {
    filters: {
      endInDays,
      transitionDays,
      transitionLimit,
    },
    jobsClosingSoon,
    candidateStageTransitions,
  };
};
