import mongoose from "mongoose";

// The roster of enrollment numbers JAIN actually issued, keyed to the
// college mailbox each one owns. Registration checks a submitted enrollment
// number against this collection instead of accepting any string that
// merely matches the @jainuniversity.ac.in pattern (see userController.js).
const studentAllowlistSchema = new mongoose.Schema({
  enrollment: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
});

export const StudentAllowlist = mongoose.model(
  "StudentAllowlist",
  studentAllowlistSchema
);
