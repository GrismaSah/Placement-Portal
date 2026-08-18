import mongoose from "mongoose";


const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please provide a title."],
    minLength: [3, "Title must contain at least 3 Characters!"],
    maxLength: [30, "Title cannot exceed 30 Characters!"],
  },
  description: {
    type: String,
    required: [true, "Please provide description."],
    minLength: [30, "Description must contain at least 30 Characters!"],
    maxLength: [500, "Description cannot exceed 500 Characters!"],
  },
  category: {
    type: String,
    required: [true, "Please provide a category."],
  },
  country: {
    type: String,
    required: [true, "Please provide a country name."],
  },
  city: {
    type: String,
    required: [true, "Please provide a city name."],
  },
  company: {
    type: String,
    required: [true, "Please provide company name."],
  },
  // min/max, not minLength/maxLength: the latter are String validators and
  // Mongoose silently ignores them on a Number, so every salary bound here
  // was inert — a 1-rupee and a 15-digit salary both validated.
  // 1000..999999999 is the 4-to-9-digit range the messages already promised.
  fixedSalary: {
    type: Number,
    min: [1000, "Salary must contain at least 4 digits"],
    max: [999999999, "Salary cannot exceed 9 digits"],
  },
  salaryFrom: {
    type: Number,
    min: [1000, "Salary must contain at least 4 digits"],
    max: [999999999, "Salary cannot exceed 9 digits"],
  },
  salaryTo: {
    type: Number,
    min: [1000, "Salary must contain at least 4 digits"],
    max: [999999999, "Salary cannot exceed 9 digits"],
  },
  expired: {
    type: Boolean,
    default: false,
  },
  jobPostedOn: {
    type: Date,
    default: Date.now,
  },
  postedBy: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },

  /**
   * Drive details.
   *
   * A job *is* the drive in this data model, but it previously carried no
   * dates and no criteria — so students had no deadline to work to and
   * recruiters received applications from anyone regardless of eligibility.
   */
  applicationDeadline: { type: Date },
  driveDate: { type: Date },

  eligibility: {
    minCgpa: { type: Number, min: 0, max: 10 },
    maxBacklogs: { type: Number, min: 0 },
    allowedBranches: [{ type: String }],
    allowedBatches: [{ type: Number }],
  },

  openings: { type: Number, min: 1 },
});

/** True once the deadline has passed or the posting has been closed. */
jobSchema.methods.isOpen = function () {
  if (this.expired) return false;
  if (this.applicationDeadline && this.applicationDeadline < new Date()) return false;
  return true;
};

/**
 * Whether a given student meets the posted criteria.
 * Absent criteria mean "no restriction" — a job with no eligibility block is
 * open to everyone, which is how every pre-existing job behaves.
 */
jobSchema.methods.studentIsEligible = function (user) {
  const e = this.eligibility;
  if (!e) return { eligible: true, reasons: [] };

  const reasons = [];

  if (e.minCgpa != null && (user?.cgpa ?? 0) < e.minCgpa) {
    reasons.push(`Requires a CGPA of ${e.minCgpa} or above.`);
  }
  if (e.maxBacklogs != null && (user?.backlogs ?? 0) > e.maxBacklogs) {
    reasons.push(`Allows at most ${e.maxBacklogs} active backlog(s).`);
  }
  if (e.allowedBranches?.length && !e.allowedBranches.includes(user?.branch)) {
    reasons.push(`Open to ${e.allowedBranches.join(", ")} only.`);
  }
  if (e.allowedBatches?.length && !e.allowedBatches.includes(user?.batch)) {
    reasons.push(`Open to the ${e.allowedBatches.join(", ")} batch only.`);
  }

  return { eligible: reasons.length === 0, reasons };
};


// Every listing query filters on `expired` first, so it leads each compound index.
jobSchema.index({ expired: 1, jobPostedOn: -1 });
jobSchema.index({ expired: 1, category: 1, jobPostedOn: -1 });
jobSchema.index({ expired: 1, company: 1, jobPostedOn: -1 });

export const Job = mongoose.model("Job", jobSchema);