import mongoose from "mongoose";

const candidateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  contactDetails: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  skills: {
    type: [String],
    required: true,
  },
  experience: {
    type: Number,
    required: true,
  },
  education: {
    type: String,
    required: true,
  },
  noticePeriod: {
    type: Number,
    required: true,
  },
  referal: {
    type: String,
    required: false,
  }
});

const Candidate = mongoose.model("Candidate", candidateSchema);

export default Candidate;