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
    const { jobId } = req.query;
    const candidates = await candidateService.getCandidates(jobId);
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

export const updateCandidateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: 'status is required' });
    }

    const candidate = await candidateService.updateCandidateStatus(req.params.id, status);
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
    res.json(candidate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addNoteToCandidate = async (req, res) => {
  try {
    const { note } = req.body;
    if (!note) {
      return res.status(400).json({ message: 'note is required' });
    }

    const candidate = await candidateService.addNoteToCandidate(req.params.id, note);
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
    res.json(candidate);
  } catch (error) {
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
