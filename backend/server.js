import http from "http";
import app from "./app.js";
import { initSocket } from "./socket.js";

/**
 * Local development server.
 *
 * Vercel does not run this file — it invokes api/index.js per request. This
 * is the long-lived process used during development, and it is the only place
 * Socket.IO can exist, since serverless functions cannot hold a connection
 * open.
 *
 * (The Cloudinary config that used to live here was removed: it was never
 * referenced anywhere in the codebase and its env vars were never set.)
 */
const PORT = process.env.PORT || 4000;

// socket.io needs the underlying HTTP server, so create it explicitly rather
// than letting app.listen() build one internally.
const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
  console.log(`Server running at port ${PORT}`);
});
