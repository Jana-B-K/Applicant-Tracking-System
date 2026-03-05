import mongoose from 'mongoose';

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
