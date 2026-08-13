import app from "../backend/app.js";

/**
 * Vercel serverless entrypoint.
 *
 * backend/server.js (Socket.IO, http.createServer + listen()) only runs
 * locally — Vercel invokes this file per request instead. An Express app
 * instance is directly callable as (req, res), which is exactly what
 * @vercel/node's Node.js runtime expects, so no adapter/wrapper is needed.
 */
export default app;
