import mongoose from "mongoose";

/**
 * In-app notification.
 *
 * The portal previously had no notification store at all. The only way it told
 * anyone anything was `postJob`, which looped over every student in the
 * database and awaited a Gmail send inside the request handler — so posting a
 * job blocked for N × SMTP latency, could not be opted out of, and left no
 * record anywhere.
 *
 * These rows are the record. Delivery to a live session happens over the
 * socket rooms that already exist.
 */
const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    // Which collection `user` points at. Students and recruiters live in
    // `users`, placement officers in `tpos`, so the id alone is ambiguous.
    userModel: {
      type: String,
      enum: ["User", "TPO"],
      default: "User",
    },

    type: {
      type: String,
      enum: [
        "job:new",
        "application:received",
        "application:status",
        "recruiter:approved",
        "recruiter:declined",
        "recruiter:pending",
        "system",
      ],
      default: "system",
    },

    title: { type: String, required: true, maxLength: 140 },
    body: { type: String, maxLength: 500 },

    // Where clicking it should go, e.g. /app/applications.
    link: { type: String },

    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// The bell query is always "this user's notifications, newest first".
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, read: 1 });

export const Notification = mongoose.model("Notification", notificationSchema);
