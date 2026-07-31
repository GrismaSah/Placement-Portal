import { Notification } from "../models/notificationSchema.js";
import { emitToUser } from "../socket.js";

/**
 * Create a notification and push it to any live session for that user.
 *
 * Never throws. A notification is a side effect of the action the user
 * actually asked for — if the insert fails, the application status change (or
 * job post, or approval) must still succeed. The old code got this backwards:
 * `postJob` awaited an SMTP send per student inside the request handler, so a
 * mail failure surfaced as a failed job post.
 */
export async function notify({ user, userModel = "User", type, title, body, link }) {
  if (!user) return null;

  try {
    const notification = await Notification.create({
      user,
      userModel,
      type,
      title,
      body,
      link,
    });

    emitToUser(String(user), "notification:new", notification);
    return notification;
  } catch (error) {
    console.error("notify failed:", error.message);
    return null;
  }
}

/**
 * Fan out one notification to many users in a single insertMany.
 *
 * Used when a job is posted. Deliberately does NOT send email per recipient —
 * that loop is what made posting a job take N × SMTP latency.
 */
export async function notifyMany(userIds, payload) {
  const ids = [...new Set((userIds ?? []).map(String))].filter(Boolean);
  if (!ids.length) return [];

  try {
    const docs = await Notification.insertMany(
      ids.map((user) => ({ user, userModel: "User", ...payload })),
      { ordered: false }
    );

    for (const doc of docs) {
      emitToUser(String(doc.user), "notification:new", doc);
    }

    return docs;
  } catch (error) {
    console.error("notifyMany failed:", error.message);
    return [];
  }
}

/** Human sentence for each pipeline transition, reused by email and in-app. */
export function statusMessage(status, jobTitle, company) {
  const role = `${jobTitle}${company ? ` at ${company}` : ""}`;

  switch (status) {
    case "Shortlisted":
      return {
        title: "You've been shortlisted",
        body: `Your application for ${role} has been shortlisted. Watch for interview details.`,
      };
    case "Interview":
      return {
        title: "Interview stage",
        body: `You've progressed to the interview stage for ${role}.`,
      };
    case "Offered":
      return {
        title: "You've received an offer",
        body: `Congratulations — you have been made an offer for ${role}.`,
      };
    case "Placed":
      return {
        title: "Placement confirmed",
        body: `Your placement for ${role} is confirmed. Congratulations!`,
      };
    case "Rejected":
      return {
        title: "Application update",
        body: `Your application for ${role} was not taken forward on this occasion.`,
      };
    case "Withdrawn":
      return {
        title: "Application withdrawn",
        body: `You withdrew your application for ${role}.`,
      };
    default:
      return {
        title: "Application update",
        body: `Your application for ${role} is now ${status}.`,
      };
  }
}
