import { io } from "socket.io-client";
import { API_BASE_URL } from "./lib/api";

/**
 * Realtime channel — optional by design.
 *
 * The production deployment runs the API as serverless functions, which
 * cannot hold a WebSocket open. Rather than special-casing every caller, this
 * module returns a no-op emitter when sockets are unavailable: `.on()`,
 * `.off()` and `.connect()` are all safe to call and simply do nothing, so
 * the live-sync features degrade to "updates on next fetch" instead of
 * throwing.
 *
 * Set VITE_ENABLE_SOCKETS=true when the API is hosted on a persistent server.
 */

const socketsEnabled =
  import.meta.env.VITE_ENABLE_SOCKETS === "true" || import.meta.env.DEV;

const noop = () => {};
const nullSocket = {
  on: noop,
  off: noop,
  emit: noop,
  connect: noop,
  disconnect: noop,
  connected: false,
};

let socket = null;

/**
 * Lazily create the shared socket. `withCredentials` matters: the server
 * authenticates the handshake from the `token` cookie, so without it the
 * connection is rejected.
 */
export const getSocket = () => {
  if (!socketsEnabled) return nullSocket;

  if (!socket) {
    socket = io(API_BASE_URL || window.location.origin, {
      withCredentials: true,
      autoConnect: false,
      // Don't hammer a backend that is down or a cookie that is invalid.
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // A failed handshake is expected wherever sockets aren't served; log it
    // once at debug level rather than surfacing an error the user can't act on.
    socket.on("connect_error", (err) => {
      if (import.meta.env.DEV) {
        console.debug("Socket unavailable:", err.message);
      }
    });
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
