import { io } from "socket.io-client";

const SERVER_URL = "http://localhost:4000";

let socket = null;

/**
 * Lazily create the shared socket. `withCredentials` matters: the server
 * authenticates the handshake from the `token` cookie, so without it the
 * connection is rejected.
 */
export const getSocket = () => {
  if (!socket) {
    socket = io(SERVER_URL, {
      withCredentials: true,
      autoConnect: false,
      // Don't hammer a backend that is down or a cookie that is invalid.
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
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
