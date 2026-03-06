import Alert from "../models/alert.model.js";
import JobManagement from "../models/job.model.js";
import { emitAlertToDashboardUsers, emitAlertsRefresh } from "../realtime/alerts.socket.js";

const MS_IN_DAY = 24 * 60 * 60 * 1000;

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

// internal immediate processor; returns doc after DB write and emits/email
export const createAlertImmediate = async (payload) => {
  const { sourceKey, users, ...rest } = payload;
  const normalizedUsers = Array.isArray(users)
    ? [...new Set(users.filter(Boolean).map((userId) => String(userId)))]
    : [];
  const writePayload = {
    ...rest,
    users: normalizedUsers,
  };
  let alertDoc = null;

  if (sourceKey) {
    alertDoc = await Alert.findOneAndUpdate(
      { sourceKey },
      { $set: { ...writePayload, sourceKey } },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
  } else {
    alertDoc = await Alert.create(writePayload);
  }

  if (alertDoc) {
    const emitPayload = {
      id: String(alertDoc._id),
      section: alertDoc.section,
      category: alertDoc.category,
      severity: alertDoc.severity,
      title: alertDoc.title,
      message: alertDoc.message,
      timestamp: alertDoc.timestamp,
      meta: alertDoc.meta || {},
    };

    // real-time delivery
    if (normalizedUsers.length > 0) {
      // eslint-disable-next-line import/no-cycle
      const { emitAlertToUsers, isUserOnline } = await import("../realtime/alerts.socket.js");
      emitAlertToUsers(normalizedUsers, emitPayload);

      // For interview assignments, always email all targeted interviewers.
      // For other alerts, fallback-email only offline recipients on important/high alerts.
      const shouldAlwaysEmailTargets = alertDoc.type === "interview_scheduled";
      const shouldEmailOfflineTargets =
        alertDoc.section === "important" || alertDoc.severity === "high";
      if (shouldAlwaysEmailTargets || shouldEmailOfflineTargets) {
        const targetUserIds = shouldAlwaysEmailTargets
          ? normalizedUsers
          : normalizedUsers.filter((u) => !isUserOnline(u));

        if (targetUserIds.length > 0) {
          const User = (await import("../models/user.model.js")).default;
          const recipients = await User.find({ _id: { $in: targetUserIds }, isActive: true })
            .select("email")
            .lean();
          const emails = recipients.map((r) => r.email).filter(Boolean);
          if (emails.length) {
            const { sendAlertEmail } = await import("./email.service.js");
            sendAlertEmail({
              to: emails.join(","),
              subject: `Alert: ${alertDoc.title}`,
              text: `${alertDoc.message}\n\nView dashboard for details.`,
            });
          }
        }
      }
    } else {
      // public alert to dashboard; still emit
      emitAlertToDashboardUsers(emitPayload);

      // if important / high, email all offline dashboard users
      if (alertDoc.section === "important" || alertDoc.severity === "high") {
        const { isUserOnline } = await import("../realtime/alerts.socket.js");
        const User = (await import("../models/user.model.js")).default;
        const recipients = await User.find({ isActive: true }).select("_id email").lean();
        const emails = recipients
          .filter((u) => !isUserOnline(u._id) && u.email)
          .map((u) => u.email);
        if (emails.length) {
          const { sendAlertEmail } = await import("./email.service.js");
          sendAlertEmail({
            to: emails.join(","),
            subject: `Alert: ${alertDoc.title}`,
            text: `${alertDoc.message}\n\nView dashboard for details.`,
          });
        }
      }
    }

    emitAlertsRefresh();
  }

  return alertDoc;
};

// basic FIFO queue for alerts; each item { payload, resolve, reject }
const alertQueue = [];
let isProcessingQueue = false;

const processQueue = async () => {
  if (isProcessingQueue) return;
  isProcessingQueue = true;
  while (alertQueue.length > 0) {
    const job = alertQueue.shift();
    try {
      const result = await createAlertImmediate(job.payload);
      job.resolve(result);
    } catch (err) {
      job.reject(err);
    }
  }
  isProcessingQueue = false;
};

export const createAlert = (payload) => {
  // enqueue and return a promise; processing happens in background
  return new Promise((resolve, reject) => {
    alertQueue.push({ payload, resolve, reject });
    // schedule processing soon
    setImmediate(processQueue);
  });
};

export const createStatusTransitionAlert = async ({
  candidate,
  fromStatus,
  toStatus,
  movedAt,
  updatedBy,
}) => {
  if (!candidate || !toStatus || fromStatus === toStatus) return null;

  return createAlert({
    type: "status_transition",
    section: "general",
    category: "CANDIDATES",
    severity: "low",
    title: "Candidate Stage Updated",
    message: `${candidate.name}: ${fromStatus || "N/A"} -> ${toStatus}.`,
    timestamp: movedAt || new Date(),
    meta: {
      candidateId: candidate._id,
      candidateName: candidate.name,
      candidateEmail: candidate.email,
      jobId: candidate?.jobID?._id || candidate?.jobID || null,
      jobTitle: candidate?.jobID?.jobTitle || null,
      fromStatus: fromStatus || null,
      toStatus,
      updatedByName: updatedBy?.name || null,
      updatedByEmail: updatedBy?.email || null,
      updatedById: updatedBy?.id || null,
    },
  });
};

export const createInterviewCompletedAlert = async ({
  candidate,
  interview,
}) => {
  if (!candidate || !interview?.completedAt) return null;
  if (["Pending", "Rescheduled"].includes(interview?.result || "Pending")) return null;

  // determine recipients by role
  let userIds = [];
  try {
    const User = (await import("../models/user.model.js")).default;
    const recipients = await User.find({ role: { $in: ["superadmin", "hrrecruiter", "hiringmanager"] }, isActive: true }).select("_id").lean();
    userIds = recipients.map((u) => u._id);
  } catch (e) {
    console.error("[Alert] failed to lookup recipients for completed interview alert", e);
  }

  return createAlert({
    type: "interview_completed",
    section: "general",
    category: "CANDIDATES",
    severity: interview.result === "Failed" ? "medium" : "low",
    title: "Interview Completed",
    message: `${interview.stage || "Interview"} by ${interview?.interviewer?.name || "Interviewer"} for ${candidate.name} - Result: ${interview.result || "N/A"}.`,
    timestamp: interview.completedAt,
    users: userIds,
    meta: {
      candidateId: candidate._id,
      candidateName: candidate.name,
      candidateEmail: candidate.email,
      jobId: candidate?.jobID?._id || candidate?.jobID || null,
      jobTitle: candidate?.jobID?.jobTitle || null,
      stage: interview.stage || null,
      result: interview.result || null,
      feedback: interview.feedback || null,
      interviewerId: interview?.interviewer?.id || null,
      interviewerName: interview?.interviewer?.name || null,
      interviewerEmail: interview?.interviewer?.email || null,
    },
  });
};

// when an interview is scheduled, notify the interviewer(s)
export const createInterviewScheduledAlert = async ({ candidate, interview }) => {
  if (!candidate || !interview?.scheduledAt) return null;

  const userIds = [];
  if (interview.interviewer?.id) userIds.push(interview.interviewer.id);
  if (Array.isArray(interview.coInterviewers)) {
    interview.coInterviewers.forEach((co) => {
      if (co.id) userIds.push(co.id);
    });
  }

  if (userIds.length === 0) return null;

  return createAlert({
    type: "interview_scheduled",
    section: "general",
    category: "CANDIDATES",
    severity: "low",
    title: "Interview Assigned",
    message: `You have been assigned to interview ${candidate.name} on ${new Date(
      interview.scheduledAt
    ).toLocaleString()}.`,
    timestamp: interview.scheduledAt,
    users: userIds,
    meta: {
      candidateId: candidate._id,
      candidateName: candidate.name,
      jobId: candidate?.jobID?._id || candidate?.jobID || null,
      jobTitle: candidate?.jobID?.jobTitle || null,
      stage: interview.stage || null,
      interviewerId: interview.interviewer?.id || null,
    },
  });
};

// candidate assignment to recruiter
export const createCandidateAssignedAlert = async ({ candidate, recruiter }) => {
  if (!candidate || !recruiter || !recruiter._id) return null;

  return createAlert({
    type: "candidate_assigned",
    section: "general",
    category: "CANDIDATES",
    severity: "low",
    title: "Candidate Assigned",
    message: `You have been assigned the candidate ${candidate.name}.`,
    timestamp: new Date(),
    users: [recruiter._id],
    meta: {
      candidateId: candidate._id,
      candidateName: candidate.name,
      recruiterId: recruiter._id,
      recruiterName: `${recruiter.firstName || ""} ${recruiter.lastName || ""}`.trim(),
    },
  });
};

export const createOfferAcceptedAlert = async ({ candidate, updatedBy }) => {
  if (!candidate) return null;

  return createAlert({
    type: "offer_accepted",
    section: "important",
    category: "CANDIDATES",
    severity: "high",
    title: "Offer Accepted",
    message: `${candidate.name} has accepted the offer.`,
    timestamp: new Date(),
    meta: {
      candidateId: candidate._id,
      candidateName: candidate.name,
      updatedById: updatedBy?.id || null,
      updatedByName: updatedBy?.name || null,
    },
  });
};

export const createJobStatusChangedAlert = async ({ job, fromStatus, toStatus, updatedBy }) => {
  if (!job || !toStatus || fromStatus === toStatus) return null;

  // target superadmins and hrrecruiters
  let userIds = [];
  try {
    const User = (await import("../models/user.model.js")).default;
    const recips = await User.find({ role: { $in: ["superadmin", "hrrecruiter"] }, isActive: true }).select("_id").lean();
    userIds = recips.map((u) => u._id);
  } catch (e) {
    console.error("[Alert] failed to lookup recipients for job status change", e);
  }

  return createAlert({
    type: "job_status_changed",
    section: "general",
    category: "JOBS",
    severity: "medium",
    title: "Job Status Updated",
    message: `${job.jobTitle || "Job"}: ${fromStatus || "N/A"} -> ${toStatus}.`,
    timestamp: new Date(),
    users: userIds,
    meta: {
      jobId: job._id,
      jobTitle: job.jobTitle,
      fromStatus: fromStatus || null,
      toStatus,
      updatedById: updatedBy?.id || null,
      updatedByName: updatedBy?.name || null,
    },
  });
};

export const upsertJobExpiringAlerts = async ({ withinDays = 1 } = {}) => {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setUTCDate(cutoff.getUTCDate() + withinDays);

  const jobs = await JobManagement.find({
    isDeleted: { $ne: true },
    jobStatus: { $in: ["Open", "On Hold"] },
    targetClosureDate: { $gte: now, $lte: cutoff },
  })
    .select("jobTitle department targetClosureDate")
    .lean();

  // determine recipients once (superadmin + hiringmanager)
  let recipientIds = [];
  try {
    const User = (await import("../models/user.model.js")).default;
    const recips = await User.find({ role: { $in: ["superadmin", "hiringmanager"] }, isActive: true }).select("_id").lean();
    recipientIds = recips.map((u) => u._id);
  } catch (e) {
    console.error("[Alert] could not fetch recipients for job expiring alerts", e);
  }

  const upserts = jobs.map((job) => {
    const dueDateLabel = new Date(job.targetClosureDate).toISOString().slice(0, 10);
    const payload = {
      sourceKey: `job-expiring-${job._id}-${dueDateLabel}`,
      type: "job_expiring",
      section: "important",
      category: "JOBS",
      severity: "high",
      title: "Job Posting Expiring",
      message: `${job.jobTitle} closes on ${new Date(job.targetClosureDate).toLocaleDateString("en-IN")} (${job.department || "N/A"}).`,
      timestamp: job.targetClosureDate,
      meta: {
        jobId: job._id,
        jobTitle: job.jobTitle,
        department: job.department || null,
        targetClosureDate: job.targetClosureDate,
      },
    };
    if (recipientIds.length) {
      payload.users = recipientIds;
    }
    return createAlert(payload);
  });

  await Promise.all(upserts);
  return { matchedJobs: jobs.length };
};

// create reminders for interviews happening within the next hour
export const upsertInterviewReminderAlerts = async ({ withinMinutes = 60 } = {}) => {
  const now = new Date();
  const cutoff = new Date(now.getTime() + withinMinutes * 60 * 1000);

  const candidates = await (await import("../models/candidate.model.js")).default.find({
    "interviews.scheduledAt": { $gte: now, $lte: cutoff },
    "interviews.result": "Pending",
  })
    .select("name interviews jobID")
    .populate("jobID", "jobTitle")
    .lean();

  const upserts = [];
  candidates.forEach((cand) => {
    cand.interviews.forEach((interview) => {
      if (
        interview.scheduledAt &&
        new Date(interview.scheduledAt) >= now &&
        new Date(interview.scheduledAt) <= cutoff &&
        interview.result === "Pending"
      ) {
        const userIds = [];
        if (interview.interviewer?.id) userIds.push(interview.interviewer.id);
        if (Array.isArray(interview.coInterviewers)) {
          interview.coInterviewers.forEach((co) => {
            if (co.id) userIds.push(co.id);
          });
        }
        if (userIds.length === 0) return;

        const keyTime = `${interview._id}-${new Date(interview.scheduledAt).getTime()}`;
        upserts.push(
          createAlert({
            sourceKey: `interview-reminder-${keyTime}`,
            type: "interview_reminder",
            section: "important",
            category: "CANDIDATES",
            severity: "medium",
            title: "Interview Reminder",
            message: `Reminder: you have an interview with ${cand.name} at ${new Date(
              interview.scheduledAt
            ).toLocaleString()}.`,
            timestamp: interview.scheduledAt,
            users: userIds,
            meta: {
              candidateId: cand._id,
              candidateName: cand.name,
              interviewId: interview._id,
            },
          })
        );
      }
    });
  });

  await Promise.all(upserts);
  return { matchedReminders: upserts.length };
};

// notify hr recruiters about candidates inactive for a period
export const upsertCandidateInactiveAlerts = async ({ inactiveDays = 7 } = {}) => {
  const cutoff = new Date(Date.now() - inactiveDays * MS_IN_DAY);
  const candidates = await (await import("../models/candidate.model.js")).default.find({
    lastActivityAt: { $lte: cutoff },
  })
    .select("name lastActivityAt")
    .lean();

  // recipients are hrrecruiter users
  let recipientIds = [];
  try {
    const User = (await import("../models/user.model.js")).default;
    const recips = await User.find({ role: "hrrecruiter", isActive: true }).select("_id").lean();
    recipientIds = recips.map((u) => u._id);
  } catch (e) {
    console.error("[Alert] could not fetch hr recruiters for inactive candidate alerts", e);
  }

  const upserts = candidates.map((cand) =>
    createAlert({
      sourceKey: `candidate-inactive-${cand._id}-${inactiveDays}`,
      type: "candidate_inactive",
      section: "important",
      category: "CANDIDATES",
      severity: "medium",
      title: "Candidate Inactive",
      message: `${cand.name} has not been active since ${new Date(cand.lastActivityAt).toLocaleDateString()}.`,
      timestamp: cand.lastActivityAt,
      users: recipientIds,
      meta: {
        candidateId: cand._id,
        lastActivityAt: cand.lastActivityAt,
      },
    })
  );

  await Promise.all(upserts);
  return { matchedCandidates: candidates.length };
};

const enrichAlert = (alert, userId, now) => {
  const readBy = Array.isArray(alert.readBy) ? alert.readBy : [];
  const isRead = userId
    ? readBy.some((entry) => String(entry.user) === String(userId))
    : false;

  return {
    id: String(alert._id),
    section: alert.section,
    category: alert.category,
    severity: alert.severity,
    title: alert.title,
    message: alert.message,
    timestamp: alert.timestamp,
    timeAgo: formatTimeAgo(alert.timestamp, now),
    isRead,
    meta: alert.meta || {},
  };
};

const buildAlertVisibilityFilter = (userId) => {
  if (!userId) return {};
  return {
    $or: [
      { users: { $exists: false } },
      { users: { $size: 0 } },
      { users: userId },
    ],
  };
};

export const getAlertsFeedForUser = async ({
  userId,
  limitImportant = 20,
  limitGeneral = 50,
} = {}) => {
  const now = new Date();

  const baseFilterFor = (section) => {
    const visibilityFilter = buildAlertVisibilityFilter(userId);
    return { isActive: true, section, ...visibilityFilter };
  };

  const [importantRaw, generalRaw] = await Promise.all([
    Alert.find(baseFilterFor("important"))
      .sort({ timestamp: -1 })
      .limit(limitImportant)
      .lean(),
    Alert.find(baseFilterFor("general"))
      .sort({ timestamp: -1 })
      .limit(limitGeneral)
      .lean(),
  ]);

  const importantAndPriority = importantRaw.map((item) => enrichAlert(item, userId, now));
  const generalNotifications = generalRaw.map((item) => enrichAlert(item, userId, now));

  const importantUnread = importantAndPriority.filter((item) => !item.isRead).length;
  const generalUnread = generalNotifications.filter((item) => !item.isRead).length;

  return {
    uiAlerts: {
      importantAndPriority,
      generalNotifications,
    },
    uiSummary: {
      importantNewCount: importantUnread,
      generalNewCount: generalUnread,
      totalNewCount: importantUnread + generalUnread,
    },
  };
};

export const markAllAlertsReadForUser = async (userId) => {
  if (!userId) return { modifiedCount: 0 };
  const now = new Date();
  const visibilityFilter = buildAlertVisibilityFilter(userId);

  const result = await Alert.updateMany(
    {
      isActive: true,
      ...visibilityFilter,
      readBy: { $not: { $elemMatch: { user: userId } } },
    },
    {
      $push: { readBy: { user: userId, readAt: now } },
    }
  );

  const payload = { modifiedCount: result.modifiedCount || 0 };
  if (payload.modifiedCount > 0) {
    emitAlertsRefresh();
  }
  return payload;
};

export const markAlertReadForUser = async (alertId, userId) => {
  if (!alertId || !userId) return null;
  const visibilityFilter = buildAlertVisibilityFilter(userId);

  const result = await Alert.findOneAndUpdate(
    {
      _id: alertId,
      isActive: true,
      ...visibilityFilter,
      readBy: { $not: { $elemMatch: { user: userId } } },
    },
    {
      $push: { readBy: { user: userId, readAt: new Date() } },
    },
    { returnDocument: "after" }
  ).lean();

  if (result) {
    emitAlertsRefresh();
  }

  return result;
};

export const cleanupOldResolvedAlerts = async ({ olderThanDays = 60 } = {}) => {
  const cutoff = new Date(Date.now() - olderThanDays * MS_IN_DAY);
  const result = await Alert.deleteMany({
    timestamp: { $lte: cutoff },
    isActive: true,
  });
  return { deletedCount: result.deletedCount || 0 };
};
