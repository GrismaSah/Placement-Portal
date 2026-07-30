import { Server } from "socket.io";
import jwt from "jsonwebtoken";

let io = null;

/**
 * Minimal cookie-header parser.
 *
 * Deliberately not importing the `cookie` package: it is only present here as a
 * transitive dependency of cookie-parser, and importing it directly would mean
 * depending on someone else's dependency tree staying the way it is today.
 */
const parseCookies = (header = "") =>
  header.split(";").reduce((acc, part) => {
    const index = part.indexOf("=");
    if (index < 0) return acc;
    const key = part.slice(0, index).trim();
    if (key) acc[key] = decodeURIComponent(part.slice(index + 1).trim());
    return acc;
  }, {});

const room = (userId) => `user:${userId}`;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [process.env.FRONTEND_URL],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Authenticate during the handshake. A socket that cannot prove who it is must
  // never reach the connection handler, because that is where it would join a
  // room and start receiving another user's data.
  io.use((socket, next) => {
    try {
      const { token } = parseCookies(socket.handshake.headers.cookie);
      if (!token) return next(new Error("Not authorised"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      if (!decoded?.id) return next(new Error("Not authorised"));

      socket.userId = String(decoded.id);
      next();
    } catch {
      next(new Error("Not authorised"));
    }
  });

  io.on("connection", (socket) => {
    // The id comes from the verified JWT, never from anything client-supplied,
    // so a client cannot subscribe itself to someone else's room.
    socket.join(room(socket.userId));
  });

  return io;
};

/** Push an event to every live session belonging to that one user. */
export const emitToUser = (userId, event, payload) => {
  if (!io) return;
  io.to(room(userId)).emit(event, payload);
};

export const emitProfileUpdate = (userId, user) =>
  emitToUser(userId, "profile:updated", user);

export const emitResumeUpdate = (userId, resume) =>
  emitToUser(userId, "resume:updated", resume);
