import mongoose from "mongoose";

// _id: false on the sub-schemas — these are plain value rows the client rewrites
// wholesale on every save, so per-row ids would churn without being used.
const educationSchema = new mongoose.Schema(
  {
    degree: { type: String, trim: true, maxLength: 120 },
    institution: { type: String, trim: true, maxLength: 120 },
    startYear: { type: String, trim: true, maxLength: 10 },
    endYear: { type: String, trim: true, maxLength: 10 },
    score: { type: String, trim: true, maxLength: 30 },
  },
  { _id: false }
);

const experienceSchema = new mongoose.Schema(
  {
    role: { type: String, trim: true, maxLength: 120 },
    company: { type: String, trim: true, maxLength: 120 },
    startDate: { type: String, trim: true, maxLength: 20 },
    endDate: { type: String, trim: true, maxLength: 20 },
    current: { type: Boolean, default: false },
    description: { type: String, trim: true, maxLength: 1000 },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, maxLength: 120 },
    link: { type: String, trim: true, maxLength: 300 },
    description: { type: String, trim: true, maxLength: 1000 },
  },
  { _id: false }
);

const resumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one resume per student
    },
    headline: { type: String, trim: true, maxLength: 150 },
    summary: { type: String, trim: true, maxLength: 2000 },
    education: [educationSchema],
    experience: [experienceSchema],
    projects: [projectSchema],
    skills: [{ type: String, trim: true, maxLength: 50 }],
    links: {
      github: { type: String, trim: true, maxLength: 300 },
      linkedin: { type: String, trim: true, maxLength: 300 },
      portfolio: { type: String, trim: true, maxLength: 300 },
    },
    // The attached PDF/image. Bytes live in the GridFS "resumes" bucket; this is
    // just the pointer plus enough metadata to render a file card without a fetch.
    file: {
      fileId: { type: mongoose.Schema.Types.ObjectId },
      filename: { type: String },
      contentType: { type: String },
      size: { type: Number },
      uploadedAt: { type: Date },
    },
  },
  { timestamps: true }
);

export const Resume = mongoose.model("Resume", resumeSchema);
