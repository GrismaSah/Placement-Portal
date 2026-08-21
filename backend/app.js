import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "dotenv";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";

import { errorMiddleware } from "./middlewares/error.js";
import { dbConnection } from "./database/dbConnection.js";
import { env, isProduction } from "./config/env.js";

import userRouter from "./routes/userRoutes.js";
import jobRouter from "./routes/jobRoutes.js";
import applicationRouter from "./routes/applicationRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import resumeRouter from "./routes/resumeRoutes.js";
import notificationRouter from "./routes/notificationRoutes.js";

const app = express();
config({ path: ".env" });

const production = isProduction();

// Vercel puts the app behind a proxy, so the real client IP only arrives via
// X-Forwarded-For. Without this, express-rate-limit sees that header on every
// request but has no proxy trust configured to justify it, and refuses to
// start up requests with a validation error — the rate limiter below would
// break login in production, not just fail to target the right IP.
app.set("trust proxy", 1);

/**
 * Security headers.
 *
 * vercel.json already sets nosniff / SAMEORIGIN / Referrer-Policy, but only at
 * Vercel's edge — which means locally there were no security headers at all,
 * and anything not served through that edge got none either. Helmet makes the
 * API itself responsible for its own headers.
 *
 * Two defaults are deliberately overridden:
 *
 *  - `contentSecurityPolicy: false` — Express serves no HTML here. The SPA is
 *    static files from Vercel in production and from Vite in development, so a
 *    CSP on JSON responses would be policy nothing enforces. It belongs on the
 *    static host, not here.
 *
 *  - `crossOriginResourcePolicy: "cross-origin"` — helmet defaults to
 *    "same-origin", but in development the frontend is :5173 and this API is
 *    :4000. Resumes are fetched from /api/v1/resume/file/:id as a blob and
 *    rendered in an <object>, so the restrictive default risks breaking resume
 *    preview locally while protecting nothing (production is same-origin).
 */
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

/**
 * CORS.
 *
 * In production the frontend and API are served from the same Vercel origin
 * (static files at /, this app at /api), so genuine cross-origin requests do
 * not arise — a same-origin request sends no `Origin` header and the cors
 * package lets it straight through. Locally they are on different ports, so
 * the dev origins are permitted explicitly.
 *
 * The allow-list applies in production too. It previously read
 * `origin: production ? true : allowedOrigins`, and `true` means *reflect
 * whatever Origin the caller sent* — which, paired with `credentials: true`,
 * is the configuration browsers refuse to grant for a literal `*`: every site
 * on the internet passes the check and can read credentialed responses.
 * `sameSite: "lax"` on the auth cookie kept that from being directly
 * exploitable, since the cookie is withheld from cross-site XHR in the first
 * place — but relying on the cookie flag to cover a header the app sets wrong
 * is one mistake away from a breach, and the same-origin argument above is an
 * argument for a strict list, not a permissive one.
 */
const allowedOrigins = [
  env("FRONTEND_URL"),
  "http://localhost:5173",
  "http://localhost:5174",
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    // `methods`, not `method` — the misspelling meant this was silently
    // ignored and cors fell back to its defaults, which exclude PATCH. The
    // application status endpoint is a PATCH.
    methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  fileUpload({
    useTempFiles: true,
    // The only writable path on a serverless filesystem.
    tempFileDir: "/tmp/",
    // Vercel caps a serverless request body at 4.5MB, so a 5MB limit here
    // would be rejected by the platform before Express ever saw it — the user
    // would get an opaque 413 instead of our own message.
    limits: { fileSize: 4 * 1024 * 1024 },
    abortOnLimit: true,
    responseOnLimit: "Resume must be 4MB or smaller.",
  })
);

/**
 * Ensure the database is connected before any route runs.
 *
 * Previously `dbConnection()` was called once at module scope. That works for
 * a process that boots and stays up, but on serverless a cold start can begin
 * handling a request before the connection resolves — producing intermittent
 * "buffering timed out" errors that only appear under real traffic.
 */
app.use(async (req, res, next) => {
  try {
    await dbConnection();
    next();
  } catch (error) {
    console.error("Database connection failed:", error.message);
    res.status(503).json({
      success: false,
      message: "Service temporarily unavailable. Please try again shortly.",
    });
  }
});

app.get("/api/health", (req, res) =>
  res.status(200).json({ success: true, status: "ok" })
);

app.use("/api/v1/user", userRouter);
app.use("/api/v1/job", jobRouter);
app.use("/api/v1/application", applicationRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/resume", resumeRouter);
app.use("/api/v1/notification", notificationRouter);

app.use(errorMiddleware);
export default app;
