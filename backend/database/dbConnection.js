import mongoose from "mongoose";

/**
 * MongoDB connection, safe for both a long-lived server and serverless.
 *
 * On Vercel every cold start executes this module afresh, but warm invocations
 * reuse the same Node context. Without caching, each cold start would open a
 * new connection pool and never close it — Atlas' connection limit is reached
 * within minutes of real traffic and the API starts refusing requests.
 *
 * The cache is parked on `globalThis` rather than a module-level variable
 * because the module registry itself can be discarded between invocations.
 */
const DB_NAME = "JAIN_PLACEMENT";

const cache = globalThis.__mongooseCache ?? { conn: null, promise: null };
globalThis.__mongooseCache = cache;

export const dbConnection = async () => {
  if (cache.conn) return cache.conn;

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not set.");
  }

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(process.env.MONGO_URI, {
        dbName: DB_NAME,
        // Serverless functions are short-lived; a large pool per instance
        // multiplies across concurrent invocations and exhausts Atlas.
        maxPoolSize: 10,
        // Fail fast instead of letting a request hang until the platform
        // timeout, which produces a far less diagnosable 504.
        serverSelectionTimeoutMS: 10_000,
        // With buffering on, queries issued before the connection is ready
        // queue silently and then time out; better to surface the error.
        bufferCommands: false,
      })
      .then((m) => {
        console.log("Connected to database.");
        return m;
      })
      .catch((err) => {
        // Clear the promise so the next request retries rather than
        // permanently reusing a rejected one.
        cache.promise = null;
        throw err;
      });
  }

  cache.conn = await cache.promise;
  return cache.conn;
};
