import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";
import { Application } from "../models/applicationSchema.js";
import { Job } from "../models/jobSchema.js";
import cloudinary from "cloudinary";

export const postApplication = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;

  if (role === "TNP") {
    return next(
      new ErrorHandler("TNP not allowed to access this resource.", 400)
    );
  }

  if (!req.files || Object.keys(req.files).length === 0) {
    return next(new ErrorHandler("Resume File Required!", 400));
  }

  const { resume } = req.files;
  const allowedFormats = ["image/png", "image/jpeg", "image/webp"];
  if (!allowedFormats.includes(resume.mimetype)) {
    return next(
      new ErrorHandler("Invalid file type. Please upload a PNG file.", 400)
    );
  }

  const cloudinaryResponse = await cloudinary.uploader.upload(
    resume.tempFilePath
  );

  if (!cloudinaryResponse || cloudinaryResponse.error) {
    console.error(
      "Cloudinary Error:",
      cloudinaryResponse.error || "Unknown Cloudinary error"
    );
    return next(new ErrorHandler("Failed to upload Resume to Cloudinary", 500));
  }

  const { name, email, coverLetter, phone, address, jobId, enrollment } =
    req.body;
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
    resume: {
      public_id: cloudinaryResponse.public_id,
      url: cloudinaryResponse.secure_url,
    },
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
