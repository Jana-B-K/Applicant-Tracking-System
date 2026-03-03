import mongoose from 'mongoose';

const jobManagementSchema = new mongoose.Schema(
  {
    jobTitle: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    skillsRequired: {
      type: [String],
      required: true,
    },
    department: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    salaryRange: {
      type: String,
      required: true,
    },
    emplyementType: {
      type: String,
      required: true,
    },
    experienceLevel: {
      type: String,
      required: true,
    },
    hiringManager: {
      type: String,
      required: true,
    },
    numberOfOpenings: {
      type: Number,
      required: true,
    },
    targetClosureDate: {
      type: Date,
      required: true,
    },
    jobStatus: {
      type: String,
      enum: ['Open', 'Closed', 'On Hold', 'Cancelled', 'Filled'],
      default: 'Open',
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const JobManagement = mongoose.model('JobManagement', jobManagementSchema);

export default JobManagement;
