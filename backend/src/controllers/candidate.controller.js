import * as candidateService from '../services/candidate.service.js';

export const createCandidate = async (req, res) => {
  try {
    const candidate = await candidateService.createCandidate(req.body);
    res.status(201).json(candidate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCandidates = async (req, res) => {
  try {
    const { jobId, name, email, status, role } = req.query;
    const candidates = await candidateService.getCandidates({ jobId, name, email, status, role });
    res.json(candidates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCandidateByID = async (req, res) => {
  try {
    const candidate = await candidateService.getCandidateByID(req.params.id);
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
    res.json(candidate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateCandidate = async (req, res) => {
  try {
    const candidate = await candidateService.updateCandidate(req.params.id, req.body);
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
    res.json(candidate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Enhanced with actor tracking
export const updateCandidateStatus = async (req, res) => {
  try {
    const { status, comment } = req.body;
    if (!status) {
      return res.status(400).json({ message: 'status is required' });
    }

    // Assuming you have authentication middleware that adds req.user
    const updatedByUserId = req.user?._id || req.body.updatedBy;
    if (!updatedByUserId) {
      return res.status(401).json({ message: 'User authentication required' });
    }

    const candidate = await candidateService.updateCandidateStatus(
      req.params.id,
      status,
      updatedByUserId,
      comment
    );
    
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
    res.json(candidate);
  } catch (error) {
    if (error.message.includes('User not found')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

export const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'resume file is required' });
    }

    const candidate = await candidateService.uploadResume(req.params.id, req.file);
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
    res.json(candidate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Interview scheduling
export const addInterviewToCandidate = async (req, res) => {
  try {
    const { stage, interviewerId, scheduledAt } = req.body;
    if (!stage || !interviewerId || !scheduledAt) {
      return res.status(400).json({ 
        message: 'stage, interviewerId and scheduledAt are required' 
      });
    }

    const candidate = await candidateService.addInterviewToCandidate(
      req.params.id,
      req.body
    );
    
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
    res.json(candidate);
  } catch (error) {
    if (
      error.message.includes('not found') ||
      error.message.includes('Invalid date format') ||
      error.message.includes('coInterviewerIds') ||
      error.message.includes('maximum of 2 co-interviewers')
    ) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

// Interview update
export const updateInterviewForCandidate = async (req, res) => {
  try {
    const candidate = await candidateService.updateInterviewForCandidate(
      req.params.id,
      req.params.interviewId,
      req.body
    );
    
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate or interview not found' });
    }
    res.json(candidate);
  } catch (error) {
    if (
      error.message.includes('No interview fields provided') ||
      error.message.includes('not found') ||
      error.message.includes('Invalid date format') ||
      error.message.includes('coInterviewerIds')
    ) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

export const getCandidateInterviews = async (req, res) => {
  try {
    const candidate = await candidateService.getCandidateInterviews(req.params.id);
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
    res.json(candidate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// New endpoint for timeline
export const getCandidateTimeline = async (req, res) => {
  try {
    const timeline = await candidateService.getCandidateTimeline(req.params.id);
    res.json(timeline);
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

// New endpoint for analytics
export const getInterviewAnalytics = async (req, res) => {
  try {
    const { jobId } = req.query;
    const analytics = await candidateService.getInterviewAnalytics(jobId);
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
