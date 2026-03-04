import JobManagement from "../models/job.model.js";
import Candidate from "../models/candidate.model.js";
import Application from "../models/application.model.js";

const MS_IN_DAY = 24 * 60 * 60 * 1000;
const STAGE_ORDER = ["applied", "screening", "interview", "offered", "hired", "rejected"];

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
  const stageCounts = await Application.aggregate([
    {
      $group: {
        _id: "$stage",
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
