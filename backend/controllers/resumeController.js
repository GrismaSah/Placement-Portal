import mongoose from "mongoose";
import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";
import { Resume } from "../models/resumeSchema.js";
import { Application } from "../models/applicationSchema.js";
import { emitResumeUpdate } from "../socket.js";
import {
  ALLOWED_RESUME_TYPES,
  MAX_RESUME_BYTES,
  deleteFile,
  findFile,
  openDownload,
  uploadFromPath,
} from "../utils/gridfs.js";

const studentsOnly = (req, next) => {
  if (req.user?.role !== "Student") {
    next(new ErrorHandler("Only students have a resume.", 403));
    return false;
  }
  return true;
};

// Returns null rather than 404 when absent: "no resume yet" is a normal state
// for a student who has just registered, not an error the UI should shout about.
export const getMyResume = catchAsyncErrors(async (req, res, next) => {
  if (!studentsOnly(req, next)) return;
  const resume = await Resume.findOne({ user: req.user._id });
  res.status(200).json({ success: true, resume: resume ?? null });
});

export const upsertMyResume = catchAsyncErrors(async (req, res, next) => {
  if (!studentsOnly(req, next)) return;

  // Whitelisted assignment. `user` and `file` are deliberately excluded: the
  // owner must not be reassignable, and the attached file is managed only by the
  // upload/delete endpoints, never by a JSON body that could point at someone
  // else's GridFS id.
  const { headline, summary, education, experience, projects, skills, links } =
    req.body;

  const update = {
    headline,
    summary,
    education: Array.isArray(education) ? education : [],
    experience: Array.isArray(experience) ? experience : [],
    projects: Array.isArray(projects) ? projects : [],
    skills: Array.isArray(skills)
      ? skills.map((s) => String(s).trim()).filter(Boolean)
      : [],
    links: {
      github: links?.github ?? "",
      linkedin: links?.linkedin ?? "",
      portfolio: links?.portfolio ?? "",
    },
  };

  const resume = await Resume.findOneAndUpdate(
    { user: req.user._id },
    { $set: update, $setOnInsert: { user: req.user._id } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  emitResumeUpdate(req.user._id, resume);
  res.status(200).json({ success: true, message: "Resume saved.", resume });
});

export const deleteMyResume = catchAsyncErrors(async (req, res, next) => {
  if (!studentsOnly(req, next)) return;

  const resume = await Resume.findOne({ user: req.user._id });
  if (!resume) {
    return next(new ErrorHandler("No resume to delete.", 404));
  }

  // Drop the bytes too, or the GridFS bucket accumulates orphaned chunks.
  await deleteFile(resume.file?.fileId);
  await resume.deleteOne();

  emitResumeUpdate(req.user._id, null);
  res.status(200).json({ success: true, message: "Resume deleted.", resume: null });
});

export const uploadMyResumeFile = catchAsyncErrors(async (req, res, next) => {
  if (!studentsOnly(req, next)) return;

  const file = req.files?.resume;
  if (!file) {
    return next(new ErrorHandler("Please choose a file to upload.", 400));
  }

  // Validate the reported mimetype, not the filename — renaming evil.exe to
  // resume.pdf must not get it through.
  if (!ALLOWED_RESUME_TYPES.includes(file.mimetype)) {
    return next(
      new ErrorHandler("Resume must be a PDF, PNG, JPEG or WebP file.", 400)
    );
  }
  if (file.size > MAX_RESUME_BYTES) {
    return next(new ErrorHandler("Resume must be 5MB or smaller.", 400));
  }

  const stored = await uploadFromPath(file.tempFilePath, {
    filename: file.name,
    contentType: file.mimetype,
  });

  let resume = await Resume.findOne({ user: req.user._id });
  if (!resume) resume = new Resume({ user: req.user._id });

  // Replace: remove the superseded file only after the new one is safely stored.
  const previousFileId = resume.file?.fileId;
  resume.file = { ...stored, uploadedAt: new Date() };
  await resume.save();
  await deleteFile(previousFileId);

  emitResumeUpdate(req.user._id, resume);
  res.status(200).json({ success: true, message: "Resume uploaded.", resume });
});

export const deleteMyResumeFile = catchAsyncErrors(async (req, res, next) => {
  if (!studentsOnly(req, next)) return;

  const resume = await Resume.findOne({ user: req.user._id });
  if (!resume?.file?.fileId) {
    return next(new ErrorHandler("No resume file attached.", 404));
  }

  await deleteFile(resume.file.fileId);
  resume.file = undefined;
  await resume.save();

  emitResumeUpdate(req.user._id, resume);
  res.status(200).json({ success: true, message: "Resume file removed.", resume });
});

/**
 * Stream resume bytes.
 *
 * Authorisation is the whole point of this handler. Guarding only on "is logged
 * in" would let any student walk ObjectIds and read every other student's
 * resume, so access is narrowed to two cases: you own it, or you are the
 * recruiter on an application that carries it.
 */
export const getResumeFile = catchAsyncErrors(async (req, res, next) => {
  const { fileId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(fileId)) {
    return next(new ErrorHandler("Invalid file id.", 400));
  }

  const isOwner = await Resume.exists({
    user: req.user._id,
    "file.fileId": fileId,
  });

  const isRecruiterForApplication =
    !isOwner &&
    (await Application.exists({
      "resume.fileId": fileId,
      "recruiterId.user": req.user._id,
    }));

  // Applying copies the file to a new fileId that lives only on the
  // Application, so the submitting student owns no Resume row for it.
  const isApplicantForApplication =
    !isOwner &&
    !isRecruiterForApplication &&
    (await Application.exists({
      "resume.fileId": fileId,
      "applicantID.user": req.user._id,
    }));

  if (!isOwner && !isRecruiterForApplication && !isApplicantForApplication) {
    return next(new ErrorHandler("Not authorised to view this resume.", 403));
  }

  const meta = await findFile(fileId);
  if (!meta) {
    return next(new ErrorHandler("Resume file not found.", 404));
  }

  res.set("Content-Type", meta.contentType || "application/octet-stream");
  res.set("Content-Length", String(meta.length));
  res.set(
    "Content-Disposition",
    `inline; filename="${encodeURIComponent(meta.filename || "resume")}"`
  );

  const stream = openDownload(fileId);
  stream.on("error", () => {
    if (!res.headersSent) res.status(500);
    res.end();
  });
  stream.pipe(res);
});
