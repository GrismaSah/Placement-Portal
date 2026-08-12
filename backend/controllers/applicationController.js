import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";
import { Application } from "../models/applicationSchema.js";
import { Job } from "../models/jobSchema.js";
import { Resume } from "../models/resumeSchema.js";
import {
  ALLOWED_RESUME_TYPES,
  MAX_RESUME_BYTES,
  copyFile,
  deleteFile,
  uploadFromPath,
} from "../utils/gridfs.js";
import { notify, statusMessage } from "../utils/notify.js";

/**
 * Legal transitions for an application.
 *
 * Enforced server-side so a crafted request cannot jump a candidate straight
 * from Applied to Placed, and so the history is always a coherent path. The
 * two terminal states are reachable from anywhere live.
 */
const TRANSITIONS = {
  Applied: ["Shortlisted", "Rejected", "Withdrawn"],
  Shortlisted: ["Interview", "Rejected", "Withdrawn"],
  Interview: ["Offered", "Rejected", "Withdrawn"],
  Offered: ["Placed", "Rejected", "Withdrawn"],
  Placed: [],
  Rejected: [],
  Withdrawn: [],
};

export const postApplication = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;

  if (role === "TNP") {
    return next(
      new ErrorHandler("TNP not allowed to access this resource.", 400)
    );
  }

  const { name, email, coverLetter, phone, address, jobId, enrollment } =
    req.body;

  const uploaded = req.files?.resume;
  const wantsSaved =
    req.body.useSavedResume === "true" || req.body.useSavedResume === true;

  let resume;

  if (uploaded) {
    if (!ALLOWED_RESUME_TYPES.includes(uploaded.mimetype)) {
      return next(
        new ErrorHandler("Resume must be a PDF, PNG, JPEG or WebP file.", 400)
      );
    }
    if (uploaded.size > MAX_RESUME_BYTES) {
      return next(new ErrorHandler("Resume must be 4MB or smaller.", 400));
    }
    resume = await uploadFromPath(uploaded.tempFilePath, {
      filename: uploaded.name,
      contentType: uploaded.mimetype,
    });
  } else if (wantsSaved) {
    const saved = await Resume.findOne({ user: req.user._id });
    if (!saved?.file?.fileId) {
      return next(
        new ErrorHandler("No saved resume found. Please upload one.", 400)
      );
    }
    // Copy rather than reference: an application must be an immutable record of
    // what was actually submitted, so later editing or deleting the profile
    // resume cannot alter or break what the recruiter already received.
    resume = await copyFile(
      saved.file.fileId,
      saved.file.filename,
      saved.file.contentType
    );
  } else {
    return next(new ErrorHandler("Resume File Required!", 400));
  }
  const applicantID = {
    user: req.user._id,
    role: "Student",
  };

  if (!jobId) {
    return next(new ErrorHandler("Job not found!", 404));
  }

  const jobDetails = await Job.findById(jobId);
  if (!jobDetails) {
    return next(new ErrorHandler("Job not found!", 404));
  }

  const TNPID = {
    user: jobDetails.postedBy,
    role: "TNP",
  };

  if (
    !name ||
    !email ||
    !coverLetter ||
    !phone ||
    !address ||
    !applicantID ||
    !TNPID ||
    !resume ||
    !enrollment
  ) {
    return next(new ErrorHandler("Please fill all fields.", 400));
  }

  const existingApplication = await Application.findOne({
    "applicantID.user": req.user._id,
    jobId,
  });

  if (existingApplication) {
    return next(
      new ErrorHandler(
        "You have already submitted an application for this job.",
        400
      )
    );
  }

  const application = await Application.create({
    name,
    email,
    coverLetter,
    phone,
    enrollment,
    address,
    applicantID,
    TNPID,
    jobId,
    resume,
    status: "Applied",
    statusHistory: [{ status: "Applied", changedBy: req.user._id }],
  });

  // Tell the recruiter someone applied. Fire-and-forget: a notification
  // failure must not fail the application the student just submitted.
  notify({
    user: jobDetails.postedBy,
    type: "application:received",
    title: "New application received",
    body: `${name} applied for ${jobDetails.title}.`,
    link: `/app/postings/${jobId}/applicants`,
  });

  res.status(200).json({
    success: true,
    message: "Application Submitted!",
    application,
  });
});

/**
 * Move an application along the pipeline.
 *
 * The single most important addition to the backend: before this, an
 * application had no status at all, so shortlisting, interviewing, offers and
 * placements were untracked and a student had no way to know if anyone had
 * even read their submission.
 */
export const updateApplicationStatus = catchAsyncErrors(async (req, res, next) => {
  const { role, _id } = req.user;

  if (role === "Student") {
    return next(
      new ErrorHandler("Only recruiters and the placement office can do this.", 403)
    );
  }

  const { status, note, ctc } = req.body;

  const application = await Application.findById(req.params.id).populate(
    "jobId",
    "title company postedBy"
  );

  if (!application) {
    return next(new ErrorHandler("Application not found.", 404));
  }

  // Ownership: a recruiter may only act on applications to their own postings.
  // The placement office may act on any.
  if (role === "TNP" && String(application.jobId?.postedBy) !== String(_id)) {
    return next(
      new ErrorHandler("You can only update applications to your own postings.", 403)
    );
  }

  const current = application.status || "Applied";
  const allowed = TRANSITIONS[current] ?? [];

  if (!allowed.includes(status)) {
    return next(
      new ErrorHandler(
        allowed.length
          ? `Cannot move an application from ${current} to ${status}. Allowed: ${allowed.join(", ")}.`
          : `This application is ${current} and can no longer be changed.`,
        400
      )
    );
  }

  application.status = status;
  application.statusHistory.push({
    status,
    changedBy: _id,
    changedAt: new Date(),
    note,
  });

  if (status === "Offered") {
    application.offer = {
      ...(application.offer ?? {}),
      ctc: ctc ? Number(ctc) : application.offer?.ctc,
      role: application.jobId?.title,
      offeredAt: new Date(),
    };
  }
  if (status === "Placed") {
    application.offer = { ...(application.offer ?? {}), acceptedAt: new Date() };
  }

  await application.save();

  const message = statusMessage(
    status,
    application.jobId?.title ?? "a role",
    application.jobId?.company
  );

  notify({
    user: application.applicantID?.user,
    type: "application:status",
    title: message.title,
    body: note ? `${message.body} — ${note}` : message.body,
    link: "/app/applications",
  });

  res.status(200).json({
    success: true,
    message: `Application marked ${status}.`,
    application,
  });
});

export const TNPGetAllApplications = catchAsyncErrors(
  async (req, res, next) => {
    const { role } = req.user;
    if (role === "Student") {
      return next(
        new ErrorHandler("Students not allowed to access this resource.", 400)
      );
    }
    const { jobId } = req.query;
    const { _id } = req.user;

    if (!jobId) {
      // A TNP with no jobId gets every applicant across their own postings —
      // still scoped to jobs they own. Any other role (TPO) still needs an
      // explicit jobId; without a jobId this used to return every
      // application in the database.
      if (role !== "TNP") {
        return next(new ErrorHandler("A jobId is required.", 400));
      }

      const ownJobIds = await Job.find({ postedBy: _id }).distinct("_id");
      const applications = await Application.find({ jobId: { $in: ownJobIds } })
        .populate("jobId", "title company")
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        applications,
      });
    }

    const job = await Job.findById(jobId).select("postedBy title company");
    if (!job) {
      return next(new ErrorHandler("Job not found!", 404));
    }

    // Ownership: previously any authenticated recruiter could read the
    // applicants — names, phone numbers, addresses and resumes — for any job
    // in the system just by passing its id.
    if (role === "TNP" && String(job.postedBy) !== String(_id)) {
      return next(
        new ErrorHandler("You can only view applicants for your own postings.", 403)
      );
    }

    const applications = await Application.find({ jobId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      job,
      applications,
    });
  }
);

export const jobseekerGetAllApplications = catchAsyncErrors(
  async (req, res, next) => {
    const { role } = req.user;
    if (role === "TNP") {
      return next(
        new ErrorHandler("TNP not allowed to access this resource.", 400)
      );
    }
    const { _id } = req.user;
    const applications = await Application.find({
      "applicantID.user": _id,
    }).populate(
      "jobId",
      "company jobPostedOn title category country city location"
    );
    res.status(200).json({
      success: true,
      applications,
    });
  }
);

export const jobseekerDeleteApplication = catchAsyncErrors(
  async (req, res, next) => {
    const { role } = req.user;
    if (role === "TNP") {
      return next(
        new ErrorHandler("TNP not allowed to access this resource.", 400)
      );
    }
    const { id } = req.params;
    const application = await Application.findById(id);
    if (!application) {
      return next(new ErrorHandler("Application not found!", 404));
    }

    // Ownership check: without it any student could delete any other student's
    // application just by knowing its id.
    if (String(application.applicantID?.user) !== String(req.user._id)) {
      return next(
        new ErrorHandler("Not authorised to delete this application.", 403)
      );
    }

    // Release this application's own copy of the resume bytes.
    await deleteFile(application.resume?.fileId);
    await application.deleteOne();

    res.status(200).json({
      success: true,
      message: "Application Deleted!",
    });
  }
);

// export const getApplicationsCount = async (req, res) => {
//     try {
//         const { jobId } = req.params;
//         const count = await Job.countDocuments({ jobId });
//         return res.status(200).json({ jobId, count });
//     } catch (error) {
//         return res.status(500).json({ message: 'Error fetching application count', error });
//     }
// };
