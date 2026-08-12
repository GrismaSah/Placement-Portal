import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import { Notification } from "../models/notificationSchema.js";

/**
 * List this user's notifications, newest first.
 *
 * Returns 200 with an empty array when there is nothing — an empty inbox is a
 * normal state, not an error. (The Admin pending-recruiters endpoint got this
 * wrong and 404s on empty, which forced the happy path through an error
 * handler in the client.)
 */
export const getNotifications = catchAsyncErrors(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 50);

  const [notifications, unread] = await Promise.all([
    Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(limit).lean(),
    Notification.countDocuments({ user: req.user._id, read: false }),
  ]);

  res.status(200).json({ success: true, notifications, unread });
});

export const markRead = catchAsyncErrors(async (req, res) => {
  await Notification.updateOne(
    // Scoped by user as well as id, so one user cannot mark another's as read.
    { _id: req.params.id, user: req.user._id },
    { $set: { read: true } }
  );

  res.status(200).json({ success: true });
});

export const markAllRead = catchAsyncErrors(async (req, res) => {
  await Notification.updateMany(
    { user: req.user._id, read: false },
    { $set: { read: true } }
  );

  res.status(200).json({ success: true });
});
