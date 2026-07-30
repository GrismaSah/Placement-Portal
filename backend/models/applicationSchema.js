import mongoose from "mongoose";
import validator from "validator";

const applicationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter your Name!"],
    minLength: [3, "Name must contain at least 3 Characters!"],
    maxLength: [30, "Name cannot exceed 30 Characters!"],
  },
  email: {
    type: String,
    required: [true, "Please enter your Email!"],
    validate: [validator.isEmail, "Please provide a valid Email!"],
  },
  enrollment: {
    type: String,
  },
  coverLetter: {
    type: String,
    required: [true, "Please provide a cover letter!"],
  },
  phone: {
    type: Number,
    required: [true, "Please enter your Phone Number!"],
  },
  address: {
    type: String,
    required: [true, "Please enter your Address!"],
  },
  // Bytes live in the GridFS "resumes" bucket. Each application holds its OWN
  // copy, not a reference to the applicant's profile resume, so that what a
  // recruiter received stays exactly what was submitted.
  resume: {
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    filename: { type: String },
    contentType: { type: String },
    size: { type: Number },
  },
  applicantID: {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["Student"],
      required: true,
    },
  },
  TNPID: {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["TNP"],
      required: true,
    },
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
    required: true,
  },
});

export const Application = mongoose.model("Application", applicationSchema);
