import Candidate from '../models/candidate.model.js';

export const createCandidate = async (candidateData) => {
  try {
    const initialStatus = candidateData.status || 'Applied';
    const candidate = new Candidate({
      ...candidateData,
      status: initialStatus,
      statusHistory: [{ status: initialStatus }],
    });
    return await candidate.save();
  } catch (error) {
    throw new Error('Error creating candidate: ' + error.message);
  }
};

export const getCandidates = async (jobID) => {
  try {
    const query = jobID ? { jobID } : {};
    return await Candidate.find(query);
  } catch (error) {
    throw new Error('Error fetching candidates: ' + error.message);
  }
};

export const getCandidateByID = async (id) => {
  try {
    return await Candidate.findById(id);
  } catch (error) {
    throw new Error('Error fetching candidate: ' + error.message);
  }
};

export const updateCandidate = async (id, updateData) => {
  try {
    const sanitizedData = { ...updateData };
    delete sanitizedData.statusHistory;
    delete sanitizedData.notes;
    delete sanitizedData.resume;

    return await Candidate.findByIdAndUpdate(id, sanitizedData, {
      returnDocument: 'after',
      runValidators: true,
    });
  } catch (error) {
    throw new Error('Error updating candidate: ' + error.message);
  }
};

export const updateCandidateStatus = async (id, status) => {
  try {
    return await Candidate.findByIdAndUpdate(
      id,
      {
        $set: { status },
        $push: {
          statusHistory: {
            status,
            updatedAt: new Date(),
          },
        },
      },
      { returnDocument: 'after', runValidators: true }
    );
  } catch (error) {
    throw new Error('Error updating candidate status: ' + error.message);
  }
};

export const addNoteToCandidate = async (id, note) => {
  try {
    return await Candidate.findByIdAndUpdate(
      id,
      {
        $push: {
          notes: {
            text: note,
            createdAt: new Date(),
          },
        },
      },
      { returnDocument: 'after' }
    );
  } catch (error) {
    throw new Error('Error adding note to candidate: ' + error.message);
  }
};

export const uploadResume = async (id, file) => {
  try {
    return await Candidate.findByIdAndUpdate(
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
  } catch (error) {
    throw new Error('Error uploading resume: ' + error.message);
  }
};
