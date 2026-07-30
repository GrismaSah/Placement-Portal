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
      return next(new ErrorHandler("Resume must be 5MB or smaller.", 400));
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
  });

  res.status(200).json({
    success: true,
    message: "Application Submitted!",
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
    const applications = await Application.find({ jobId: jobId });
    res.status(200).json({
      success: true,
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
