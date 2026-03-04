import mongoose from "mongoose";

const candidateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 120,
      index: true,
    },
    contactDetails: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    location: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    skills: {
      type: [String],
      required: true,
      default: [],
    },
    experience: {
      type: Number,
      required: true,
      min: 0,
    },
    education: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    noticePeriod: {
      type: Number,
      required: true,
      min: 0,
    },
    referal: {
      type: String,
      trim: true,
      maxlength: 150,
    },
  },
  { timestamps: true }
);

candidateSchema.index({ createdAt: 1 });

const Candidate = mongoose.model("Candidate", candidateSchema);

export default Candidate;
