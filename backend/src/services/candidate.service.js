import Candidate from '../models/candidate.model.js';
import User from '../models/user.model.js';
import {
  createInterviewCompletedAlert,
  createStatusTransitionAlert,
  createInterviewScheduledAlert,
  createCandidateAssignedAlert,
  createOfferAcceptedAlert,
} from './alert.service.js';

const IST_OFFSET = '+05:30';
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const saveWithMetricsRefresh = async (candidateDoc) => {
  if (!candidateDoc) return null;
  await candidateDoc.save();
  return candidateDoc;
};

const toDateFromISTInput = (value) => {
  if (!value) return undefined;
  if (value instanceof Date) return value;

  const raw = String(value).trim();
  const hasTimezone = /([zZ]|[+\-]\d{2}:\d{2})$/.test(raw);
  const normalized = hasTimezone ? raw : `${raw}${IST_OFFSET}`;
  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Invalid date format. Use ISO date-time (e.g. 2026-03-10T14:30 or 2026-03-10T14:30:00+05:30)');
  }

  return parsed;
};

export const createCandidate = async (candidateData) => {
  try {
    const initialStatus = candidateData.status || 'Applied';
    const recruiterId = candidateData.recruiterId;

    const candidate = new Candidate({
      ...candidateData,
      status: initialStatus,
      statusHistory: [{ 
        status: initialStatus,
        updatedAt: new Date(),
      }],
      applicationMetrics: {
        totalInterviewsScheduled: 0,
        totalInterviewsCompleted: 0,
        totalInterviewsPassed: 0,
        daysInPipeline: 0,
      },
    });
    const saved = await candidate.save();

    if (recruiterId) {
      try {
        const recruiterDoc = await User.findById(recruiterId).select('firstName lastName email role');
        if (recruiterDoc) {
          await createCandidateAssignedAlert({ candidate: saved, recruiter: recruiterDoc });
        }
      } catch (e) {
        console.error('[Alert] createCandidateAssignedAlert failed (createCandidate)', e);
      }
    }

    return saved;
  } catch (error) {
    throw new Error('Error creating candidate: ' + error.message);
  }
};

export const getCandidates = async (filters = {}) => {
  try {
    const { jobId, name, email, status, role } = filters;
    const query = {};

    if (jobId) query.jobID = jobId;
    if (status) query.status = status;
    if (role) query.role = { $regex: `^${escapeRegex(role)}$`, $options: 'i' };
    if (name) query.name = { $regex: escapeRegex(name), $options: 'i' };
    if (email) query.email = { $regex: escapeRegex(email), $options: 'i' };

    return await Candidate.find(query)
      .populate('jobID', 'jobTitle department location')
      .sort({ createdAt: -1 });
  } catch (error) {
    throw new Error('Error fetching candidates: ' + error.message);
  }
};

export const getCandidateByID = async (id) => {
  try {
    return await Candidate.findById(id)
      .populate('jobID', 'jobTitle department location')
      .populate('interviews.interviewer.id', 'firstName lastName email role')
      .populate('interviews.coInterviewers.id', 'firstName lastName email role')
      .populate('statusHistory.updatedBy', 'firstName lastName email role');
  } catch (error) {
    throw new Error('Error fetching candidate: ' + error.message);
  }
};

export const updateCandidate = async (id, updateData) => {
  try {
    const sanitizedData = { ...updateData };
    delete sanitizedData.statusHistory;
    delete sanitizedData.interviews;
    delete sanitizedData.resume;
    delete sanitizedData.applicationMetrics;

    // handle recruiter assignment specially
    let recruiterDoc = null;
    if (updateData.recruiterId) {
      recruiterDoc = await User.findById(updateData.recruiterId).select('firstName lastName email role');
      if (recruiterDoc) {
        sanitizedData.recruiter = {
          id: recruiterDoc._id,
          name: `${recruiterDoc.firstName} ${recruiterDoc.lastName}`.trim(),
          email: recruiterDoc.email,
          role: recruiterDoc.role,
        };
      }
    }

    const existingCandidate = await Candidate.findById(id).select('name');
    const updatedCandidate = await Candidate.findByIdAndUpdate(id, sanitizedData, {
      returnDocument: 'after',
      runValidators: true,
    });

    if (recruiterDoc && existingCandidate) {
      // create assignment alert
      try {
        await createCandidateAssignedAlert({
          candidate: existingCandidate,
          recruiter: recruiterDoc,
        });
      } catch (err) {
        console.error('[Alert] createCandidateAssignedAlert failed', err);
      }
    }

    return await saveWithMetricsRefresh(updatedCandidate);
  } catch (error) {
    throw new Error('Error updating candidate: ' + error.message);
  }
};

// Enhanced status update with actor tracking
export const updateCandidateStatus = async (id, status, updatedByUserId, comment = '') => {
  try {
    const existingCandidate = await Candidate.findById(id)
      .select('name email jobID status')
      .populate('jobID', 'jobTitle');

    if (!existingCandidate) {
      return null;
    }

    const updatedBy = await User.findById(updatedByUserId).select('firstName lastName email role');
    if (!updatedBy) {
      throw new Error('User not found');
    }

    const updatedByName = `${updatedBy.firstName} ${updatedBy.lastName}`.trim();

    const updatedCandidate = await Candidate.findByIdAndUpdate(
      id,
      {
        $set: { status },
        $push: {
          statusHistory: {
            status,
            comment,
            updatedAt: new Date(),
            updatedBy: updatedBy._id,
            updatedByName,
            updatedByEmail: updatedBy.email,
            updatedByRole: updatedBy.role,
          },
        },
      },
      { returnDocument: 'after', runValidators: true }
    );
    const refreshed = await saveWithMetricsRefresh(updatedCandidate);

    try {
      createStatusTransitionAlert({
        candidate: existingCandidate,
        fromStatus: existingCandidate.status,
        toStatus: status,
        movedAt: new Date(),
        updatedBy: {
          id: updatedBy._id,
          name: updatedByName,
          email: updatedBy.email,
        },
      }).catch((alertError) => {
        console.error('[Alert] createStatusTransitionAlert failed', alertError);
      });

      // if the new status is offer accepted, create a dedicated alert
      if (status === 'Offer Accepted') {
        createOfferAcceptedAlert({ candidate: existingCandidate, updatedBy: { id: updatedBy._id, name: updatedByName } })
          .catch((offerError) => {
            console.error('[Alert] createOfferAcceptedAlert failed', offerError);
          });
      }
    } catch (alertError) {
      console.error('[Alert] createStatusTransitionAlert failed', alertError);
    }

    return refreshed;
  } catch (error) {
    throw new Error('Error updating candidate status: ' + error.message);
  }
};

export const uploadResume = async (id, file) => {
  try {
    const updatedCandidate = await Candidate.findByIdAndUpdate(
      id,
      {
        resume: {
          fileName: file.originalname,
          filePath: file.path,
          mimeType: file.mimetype,
          uploadedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    );
    return await saveWithMetricsRefresh(updatedCandidate);
  } catch (error) {
    throw new Error('Error uploading resume: ' + error.message);
  }
};

// Interview scheduling
export const addInterviewToCandidate = async (id, interviewData) => {
  try {
    // Fetch interviewer details
    const interviewer = await User.findById(interviewData.interviewerId)
      .select('firstName lastName email role');
    if (!interviewer) {
      throw new Error('Interviewer not found');
    }

    const interviewerName = `${interviewer.firstName} ${interviewer.lastName}`.trim();
    const scheduledAt = toDateFromISTInput(interviewData.scheduledAt);

    // Handle co-interviewers if provided
    const coInterviewers = [];
    if (interviewData.coInterviewerIds && interviewData.coInterviewerIds.length > 0) {
      if (interviewData.coInterviewerIds.length > 2) {
        throw new Error('A maximum of 2 co-interviewers is allowed');
      }

      const coInterviewerDocs = await User.find({
        _id: { $in: interviewData.coInterviewerIds }
      }).select('firstName lastName email role');

      coInterviewers.push(
        ...coInterviewerDocs.map(co => ({
          id: co._id,
          name: `${co.firstName} ${co.lastName}`.trim(),
          email: co.email,
          role: co.role,
        }))
      );
    }

    const newInterview = {
      stage: interviewData.stage,
      interviewer: {
        id: interviewer._id,
        name: interviewerName,
        email: interviewer.email,
        role: interviewer.role,
      },
      coInterviewers,
      scheduledAt,
      duration: interviewData.duration || 60,
      meetingLink: interviewData.meetingLink || '',
      location: interviewData.location || '',
      result: 'Pending',
      createdAt: new Date(),
    };

    const updatedCandidate = await Candidate.findByIdAndUpdate(
      id,
      {
        $push: { interviews: newInterview },
      },
      { returnDocument: 'after', runValidators: true }
    );
    const refreshed = await saveWithMetricsRefresh(updatedCandidate);

    // fire notification for interviewer(s) - do not block
    createInterviewScheduledAlert({ candidate: refreshed, interview: newInterview }).catch((err) => {
      console.error('[Alert] createInterviewScheduledAlert failed', err);
    });

    return refreshed;
  } catch (error) {
    throw new Error('Error adding interview to candidate: ' + error.message);
  }
};

// Interview update
export const updateInterviewForCandidate = async (id, interviewId, interviewData) => {
  try {
    const existingCandidate = await Candidate.findById(id)
      .select('name email jobID')
      .populate('jobID', 'jobTitle');

    if (!existingCandidate) {
      return null;
    }

    const setData = {};

    if (interviewData.stage !== undefined) {
      setData['interviews.$.stage'] = interviewData.stage;
    }

    if (interviewData.interviewerId !== undefined) {
      const interviewer = await User.findById(interviewData.interviewerId)
        .select('firstName lastName email role');
      if (!interviewer) {
        throw new Error('Interviewer not found');
      }
      setData['interviews.$.interviewer.id'] = interviewer._id;
      setData['interviews.$.interviewer.name'] = `${interviewer.firstName} ${interviewer.lastName}`.trim();
      setData['interviews.$.interviewer.email'] = interviewer.email;
      setData['interviews.$.interviewer.role'] = interviewer.role;
    }

    if (interviewData.scheduledAt !== undefined) {
      setData['interviews.$.scheduledAt'] = toDateFromISTInput(interviewData.scheduledAt);
    }

    if (interviewData.duration !== undefined) {
      setData['interviews.$.duration'] = interviewData.duration;
    }

    if (interviewData.coInterviewerIds !== undefined) {
      if (!Array.isArray(interviewData.coInterviewerIds)) {
        throw new Error('coInterviewerIds must be an array');
      }

      if (interviewData.coInterviewerIds.length > 2) {
        throw new Error('A maximum of 2 co-interviewers is allowed');
      }

      const coInterviewers = [];
      if (interviewData.coInterviewerIds.length > 0) {
        const coInterviewerDocs = await User.find({
          _id: { $in: interviewData.coInterviewerIds }
        }).select('firstName lastName email role');

        coInterviewers.push(
          ...coInterviewerDocs.map(co => ({
            id: co._id,
            name: `${co.firstName} ${co.lastName}`.trim(),
            email: co.email,
            role: co.role,
          }))
        );
      }

      setData['interviews.$.coInterviewers'] = coInterviewers;
    }

    if (interviewData.meetingLink !== undefined) {
      setData['interviews.$.meetingLink'] = interviewData.meetingLink;
    }

    if (interviewData.location !== undefined) {
      setData['interviews.$.location'] = interviewData.location;
    }

    if (interviewData.result !== undefined) {
      setData['interviews.$.result'] = interviewData.result;
    }

    if (interviewData.feedback !== undefined) {
      setData['interviews.$.feedback'] = interviewData.feedback;
    }

    // Auto-set completedAt if result is being updated to non-pending
    if (
      interviewData.result &&
      !['Pending', 'Rescheduled'].includes(interviewData.result) &&
      !interviewData.completedAt
    ) {
      setData['interviews.$.completedAt'] = new Date();
    }

    if (interviewData.completedAt !== undefined) {
      setData['interviews.$.completedAt'] = toDateFromISTInput(interviewData.completedAt);
    }

    if (interviewData.actualDuration !== undefined) {
      setData['interviews.$.actualDuration'] = interviewData.actualDuration;
    }

    if (Object.keys(setData).length === 0) {
      throw new Error('No interview fields provided for update');
    }
    setData['interviews.$.updatedAt'] = new Date();

    const updatedCandidate = await Candidate.findOneAndUpdate(
      { _id: id, 'interviews._id': interviewId },
      { $set: setData },
      { returnDocument: 'after', runValidators: true }
    );
    const refreshed = await saveWithMetricsRefresh(updatedCandidate);

    if (refreshed) {
      const updatedInterview = (refreshed.interviews || []).find(
        (item) => String(item._id) === String(interviewId)
      );

      // if result changed to completed, send completed alert
      createInterviewCompletedAlert({
        candidate: existingCandidate,
        interview: updatedInterview,
      }).catch((alertError) => {
        console.error('[Alert] createInterviewCompletedAlert failed', alertError);
      });

      // if schedule or interviewer was updated and interview still pending
      if (
        updatedInterview &&
        updatedInterview.result === 'Pending' &&
        (interviewData.scheduledAt !== undefined || interviewData.interviewerId !== undefined)
      ) {
        createInterviewScheduledAlert({
          candidate: existingCandidate,
          interview: updatedInterview,
        }).catch((alertError) => {
          console.error('[Alert] createInterviewScheduledAlert failed on update', alertError);
        });
      }
    }

    return refreshed;
  } catch (error) {
    throw new Error('Error updating interview for candidate: ' + error.message);
  }
};

export const getCandidateInterviews = async (id) => {
  try {
    const candidate = await Candidate.findById(id)
      .select('name status interviews applicationMetrics')
      .populate('interviews.interviewer.id', 'firstName lastName email role')
      .populate('interviews.coInterviewers.id', 'firstName lastName email role');
    
    return candidate;
  } catch (error) {
    throw new Error('Error fetching candidate interviews: ' + error.message);
  }
};

// New function to get complete timeline
export const getCandidateTimeline = async (id) => {
  try {
    const candidate = await Candidate.findById(id)
      .populate('statusHistory.updatedBy', 'firstName lastName email role')
      .populate('interviews.interviewer.id', 'firstName lastName email role');

    if (!candidate) {
      throw new Error('Candidate not found');
    }

    // Combine status changes and interviews into a single timeline
    const timeline = [];

    // Add status history
    candidate.statusHistory.forEach(status => {
      timeline.push({
        type: 'status_change',
        date: status.updatedAt,
        data: status,
      });
    });

    // Add interviews
    candidate.interviews.forEach(interview => {
      // Add scheduled event
      timeline.push({
        type: 'interview_scheduled',
        date: interview.scheduledAt,
        data: interview,
      });

      // Add completed event if exists
      if (interview.completedAt) {
        timeline.push({
          type: 'interview_completed',
          date: interview.completedAt,
          data: interview,
        });
      }
    });

    // Sort by date (most recent first)
    timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

    return {
      candidate: {
        id: candidate._id,
        name: candidate.name,
        email: candidate.email,
        currentStatus: candidate.status,
        applicationMetrics: candidate.applicationMetrics,
      },
      timeline,
    };
  } catch (error) {
    throw new Error('Error fetching candidate timeline: ' + error.message);
  }
};

// Analytics function for interview performance
export const getInterviewAnalytics = async (jobID = null) => {
  try {
    const match = jobID ? { jobID } : {};

    const pipeline = [
      { $match: match },
      { $unwind: '$interviews' },
      {
        $match: {
          'interviews.result': { $in: ['Passed', 'Failed'] }
        }
      },
      {
        $group: {
          _id: '$interviews.stage',
          totalInterviews: { $sum: 1 },
          passed: {
            $sum: {
              $cond: [{ $eq: ['$interviews.result', 'Passed'] }, 1, 0]
            }
          },
        }
      },
      {
        $project: {
          stage: '$_id',
          totalInterviews: 1,
          passed: 1,
          failed: { $subtract: ['$totalInterviews', '$passed'] },
          passRate: {
            $multiply: [
              { $divide: ['$passed', '$totalInterviews'] },
              100
            ]
          },
        }
      },
      { $sort: { totalInterviews: -1 } }
    ];

    return await Candidate.aggregate(pipeline);
  } catch (error) {
    throw new Error('Error fetching interview analytics: ' + error.message);
  }
};
