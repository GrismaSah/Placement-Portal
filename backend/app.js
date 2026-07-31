import express from "express";
import cors from "cors";
import { config } from "dotenv";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";

import { errorMiddleware } from "./middlewares/error.js";
import { dbConnection } from "./database/dbConnection.js";

import userRouter from "./routes/userRoutes.js";
import jobRouter from "./routes/jobRoutes.js";
import applicationRouter from "./routes/applicationRoutes.js";
import tpoRouter from "./routes/tpoRoutes.js";
import resumeRouter from "./routes/resumeRoutes.js";
import notificationRouter from "./routes/notificationRoutes.js";


const app = express();
config({ path: ".env" });

app.use(
  cors({
    origin: [process.env.FRONTEND_URL],
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
    tempFileDir: "/tmp/",
    // Previously uncapped: any client could stream an arbitrarily large file
    // straight onto the server's disk.
    limits: { fileSize: 5 * 1024 * 1024 },
    abortOnLimit: true,
    responseOnLimit: "Resume must be 5MB or smaller.",
  })
);

app.use("/api/v1/user", userRouter);
app.use("/api/v1/job", jobRouter);
app.use("/api/v1/application", applicationRouter);
app.use("/api/v1/tpo", tpoRouter);
app.use("/api/v1/resume", resumeRouter);
app.use("/api/v1/notification", notificationRouter);
dbConnection();

app.use(errorMiddleware);
export default app;