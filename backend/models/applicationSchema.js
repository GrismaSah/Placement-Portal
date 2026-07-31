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

  /**
   * The application lifecycle.
   *
   * Until this existed an application had exactly two states — it was in the
   * collection, or it had been deleted. A student who applied had no way to
   * learn whether anyone had even opened it, and a recruiter had nowhere to
   * record a decision.
   *
   * Applied → Shortlisted → Interview → Offered → Placed is the happy path;
   * Rejected and Withdrawn are terminal and reachable from anywhere.
   */
  status: {
    type: String,
    enum: [
      "Applied",
      "Shortlisted",
      "Interview",
      "Offered",
      "Placed",
      "Rejected",
      "Withdrawn",
    ],
    default: "Applied",
    index: true,
  },

  // Append-only audit trail. Every transition is recorded with who made it, so
  // "when was I shortlisted?" is answerable and decisions are attributable.
  statusHistory: [
    {
      status: { type: String, required: true },
      changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      changedAt: { type: Date, default: Date.now },
      note: { type: String, maxLength: 500 },
      _id: false,
    },
  ],

  offer: {
    ctc: { type: Number },
    role: { type: String },
    offeredAt: { type: Date },
    acceptedAt: { type: Date },
  },
}, { timestamps: true });

// Duplicate prevention was a controller-level findOne, which two concurrent
// submits could both pass. The database is the only place this can be enforced.
applicationSchema.index({ "applicantID.user": 1, jobId: 1 }, { unique: true });

// Recruiters list applicants for one job filtered by stage; students list
// their own applications newest-first.
applicationSchema.index({ jobId: 1, status: 1 });
applicationSchema.index({ "applicantID.user": 1, createdAt: -1 });

export const Application = mongoose.model("Application", applicationSchema);
