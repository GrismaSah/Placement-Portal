import fs from "fs";
import mongoose from "mongoose";

const BUCKET = "resumes";

/**
 * The bucket must be created lazily. mongoose.connection.db is undefined until
 * the connection is actually open, and these modules are imported at boot.
 */
const bucket = () =>
  new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: BUCKET,
  });

/** Stream a file from disk (express-fileupload's tempFilePath) into GridFS. */
export const uploadFromPath = (tempFilePath, { filename, contentType }) =>
  new Promise((resolve, reject) => {
    const stream = bucket().openUploadStream(filename, { contentType });
    fs.createReadStream(tempFilePath)
      .pipe(stream)
      .on("error", reject)
      .on("finish", () =>
        resolve({ fileId: stream.id, filename, contentType, size: stream.length })
      );
  });

/** Duplicate an existing file into a new GridFS entry (immutable snapshots). */
export const copyFile = (fileId, filename, contentType) =>
  new Promise((resolve, reject) => {
    const stream = bucket().openUploadStream(filename, { contentType });
    bucket()
      .openDownloadStream(new mongoose.Types.ObjectId(fileId))
      .pipe(stream)
      .on("error", reject)
      .on("finish", () =>
        resolve({ fileId: stream.id, filename, contentType, size: stream.length })
      );
  });

export const openDownload = (fileId) =>
  bucket().openDownloadStream(new mongoose.Types.ObjectId(fileId));

export const findFile = async (fileId) => {
  const files = await bucket()
    .find({ _id: new mongoose.Types.ObjectId(fileId) })
    .toArray();
  return files[0] ?? null;
};

/**
 * Delete a file and its chunks. Tolerates an already-missing file: callers use
 * this while replacing an upload, and a failure there must not block the new one.
 */
export const deleteFile = async (fileId) => {
  if (!fileId) return;
  try {
    await bucket().delete(new mongoose.Types.ObjectId(fileId));
  } catch {
    // already gone
  }
};

/** Shared upload policy: what a resume is allowed to be. */
export const ALLOWED_RESUME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
];

export const MAX_RESUME_BYTES = 5 * 1024 * 1024;
