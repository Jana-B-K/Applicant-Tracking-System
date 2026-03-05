import mongoose from 'mongoose';

const PERMISSION_KEYS = [
  "viewDashboard",
  "viewJobs",
  "createJobs",
  "editJobs",
  "deleteJobs",
  "viewCandidates",
  "addCandidates",
  "editCandidates",
  "manageCandidateStages",
  "manageUsers",
];

const permissionShape = {};
for (const key of PERMISSION_KEYS) {
  permissionShape[key] = {
    type: Boolean,
    default: undefined,
  };
}

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  empId:{
    type: String,
    unique: true,
    sparse: true
  },
  role: {
    type: String,
    enum: ['superadmin', 'hrrecruiter', 'hiringmanager','interviewpanel','management'],
    required: true
  },
  permissions: {
    type: new mongoose.Schema(permissionShape, { _id: false }),
    default: undefined,
  },
  isActive: {
    type: Boolean,
    default: true
  },
  refreshToken: {
    type: String,
  },
  passwordResetTokenHash: {
    type: String,
  },
  passwordResetTokenExpiresAt: {
    type: Date,
  },
  passwordResetOtpAttempts: {
    type: Number,
    default: 0,
  },
  passwordResetLastSentAt: {
    type: Date,
  },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

export default User;
