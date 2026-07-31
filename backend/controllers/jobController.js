import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import { Job } from "../models/jobSchema.js";
import ErrorHandler from "../middlewares/error.js";
import { Application } from "../models/applicationSchema.js";
import { User } from "../models/userSchema.js";
import { notifyMany } from "../utils/notify.js";

const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 48;

// A user-supplied string goes straight into a RegExp below; unescaped it is both a
// correctness bug ("C++" throwing) and a ReDoS vector.
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const getAllJobs = catchAsyncErrors(async (req, res, next) => {
  const { category, company, search } = req.query;

  const query = { expired: false };
  if (category) query.category = category;
  if (company) query.company = company;

  if (search && search.trim()) {
    const term = new RegExp(escapeRegex(search.trim()), "i");
    query.$or = [{ title: term }, { company: term }, { city: term }];
  }

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseInt(req.query.limit, 10) || DEFAULT_PAGE_SIZE)
  );

  const [jobs, total] = await Promise.all([
    Job.find(query)
      .sort({ jobPostedOn: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Job.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    jobs,
    total,
    page,
    pages: Math.ceil(total / limit) || 1,
  });
});

// Backs the home page tiles, the hero counters and the job filter dropdowns from a
// single round trip, so the filters can only ever offer values that exist in the data.
export const getJobStats = catchAsyncErrors(async (req, res, next) => {
  const [categories, companies, students, applications] = await Promise.all([
    Job.aggregate([
      { $match: { expired: false } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
    ]),
    Job.aggregate([
      { $match: { expired: false } },
      {
        $group: {
          _id: "$company",
          count: { $sum: 1 },
          city: { $first: "$city" },
          country: { $first: "$country" },
        },
      },
      { $sort: { count: -1, _id: 1 } },
    ]),
    User.countDocuments({ role: "Student" }),
    Application.countDocuments(),
  ]);

  const openRoles = categories.reduce((sum, c) => sum + c.count, 0);

  res.status(200).json({
    success: true,
    categories: categories.map((c) => ({ name: c._id, count: c.count })),
    companies: companies.map((c) => ({
      name: c._id,
      count: c.count,
      city: c.city,
      country: c.country,
    })),
    totals: {
      openRoles,
      companies: companies.length,
      students,
      applications,
    },
  });
});

export const postJob = catchAsyncErrors(async (req, res, next) => {
  const { role, status } = req.user;
  if (role === "Student") {
    return next(
      new ErrorHandler("Student not allowed to access this resource.", 400)
    );
  }

  // The Pending/Approved/Declined gate was decorative: only the Student check
  // above existed, so a recruiter who had never been approved — or had been
  // explicitly declined — could post jobs to the whole student body.
  if (role === "TNP" && status !== "Approved") {
    return next(
      new ErrorHandler(
        status === "Declined"
          ? "Your recruiter account was declined, so you cannot post roles."
          : "Your recruiter account is awaiting approval from the Placement Office.",
        403
      )
    );
  }

  const {
    title,
    description,
    category,
    country,
    city,
    company,
    fixedSalary,
    salaryFrom,
    salaryTo,
    applicationDeadline,
    driveDate,
    openings,
    eligibility,
  } = req.body;

  if (!title || !description || !category || !country || !city || !company) {
    return next(new ErrorHandler("Please provide full job details.", 400));
  }

  if ((!salaryFrom || !salaryTo) && !fixedSalary) {
    return next(
      new ErrorHandler(
        "Please either provide fixed salary or ranged salary.",
        400
      )
    );
  }

  if (salaryFrom && salaryTo && fixedSalary) {
    return next(
      new ErrorHandler("Cannot Enter Fixed and Ranged Salary together.", 400)
    );
  }
  const postedBy = req.user._id;
  const job = await Job.create({
    title,
    description,
    category,
    country,
    city,
    company,
    fixedSalary,
    salaryFrom,
    salaryTo,
    postedBy,
    applicationDeadline: applicationDeadline || undefined,
    driveDate: driveDate || undefined,
    openings: openings || undefined,
    eligibility: eligibility || undefined,
  });

  /**
   * Notify students.
   *
   * This used to load every student and `await` a Gmail send for each one,
   * sequentially, inside the request handler — so posting a job blocked for
   * N x SMTP latency, one slow send stalled the response, and a mail failure
   * surfaced to the recruiter as a failed job post. There was also no opt-out
   * and no record of what had been sent.
   *
   * Now it writes notification rows in a single insertMany and pushes them
   * over the sockets that are already open. Not awaited: the recruiter's
   * response does not depend on the fan-out succeeding.
   */
  User.find({ role: "Student" }, "_id")
    .lean()
    .then((students) =>
      notifyMany(
        students.map((s) => s._id),
        {
          type: "job:new",
          title: `New opening: ${job.title}`,
          body: `${job.company} is hiring in ${job.city}. Applications are open now.`,
          link: `/app/jobs/${job._id}`,
        }
      )
    )
    .catch((error) => console.error("Job notification fan-out failed:", error.message));

  res.status(200).json({
    success: true,
    message: "Job Posted Successfully!",
    job,
  });
});

export const getMyJobs = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;

  if (role === "Student") {
    return next(
      new ErrorHandler("Students not allowed to access this resource.", 400)
    );
  }

  const myJobs = await Job.find({ postedBy: req.user._id });

  // Fetch application counts for each job
  const jobIds = myJobs.map((job) => job._id);
  const applicationCounts = await Application.aggregate([
    { $match: { jobId: { $in: jobIds } } },
    { $group: { _id: "$jobId", count: { $sum: 1 } } },
  ]);

  // Map counts to the jobs
  const jobsWithCounts = myJobs.map((job) => {
    const applicationCount =
      applicationCounts.find((app) => String(app._id) === String(job._id))
        ?.count || 0;
    return { ...job.toObject(), applicationCount };
  });

  res.status(200).json({
    success: true,
    myJobs: jobsWithCounts,
  });
});

export const updateJob = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;
  if (role === "Student") {
    return next(
      new ErrorHandler("Student not allowed to access this resource.", 400)
    );
  }
  const { id } = req.params;
  let job = await Job.findById(id);
  if (!job) {
    return next(new ErrorHandler("OOPS! Job not found.", 404));
  }

  // Ownership: any authenticated recruiter could previously edit any job in
  // the system — including changing another company's salary or description —
  // simply by knowing its id.
  if (role === "TNP" && String(job.postedBy) !== String(req.user._id)) {
    return next(new ErrorHandler("You can only edit your own postings.", 403));
  }

  // `postedBy` is never client-settable: accepting it here would let a
  // recruiter reassign someone else's posting to themselves.
  const { postedBy, _id, ...updates } = req.body;

  job = await Job.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    message: "Job Updated!",
    job,
  });
});

export const deleteJob = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;
  if (role === "Student") {
    return next(
      new ErrorHandler("Student not allowed to access this resource.", 400)
    );
  }
  const { id } = req.params;
  const job = await Job.findById(id);
  if (!job) {
    return next(new ErrorHandler("OOPS! Job not found.", 404));
  }

  // Ownership: without this any recruiter could delete any posting.
  if (role === "TNP" && String(job.postedBy) !== String(req.user._id)) {
    return next(new ErrorHandler("You can only delete your own postings.", 403));
  }

  // Deleting a job used to orphan its applications and leave their resume
  // bytes in GridFS forever. Refuse instead — a posting with applicants is a
  // record students are relying on. Closing it is the correct action.
  const applicationCount = await Application.countDocuments({ jobId: id });
  if (applicationCount > 0) {
    return next(
      new ErrorHandler(
        `This posting has ${applicationCount} application(s) and cannot be deleted. Close it instead.`,
        400
      )
    );
  }

  await job.deleteOne();
  res.status(200).json({
    success: true,
    message: "Job Deleted!",
  });
});

export const getSingleJob = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  try {
    const job = await Job.findById(id).populate("postedBy", "name email phone");
    if (!job) {
      return next(new ErrorHandler("Job not found.", 404));
    }
    res.status(200).json({
      success: true,
      job,
    });
  } catch (error) {
    return next(new ErrorHandler(`Invalid ID / CastError`, 404));
  }
});
