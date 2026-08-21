/**
 * Seeds (or re-seeds) the demo accounts used for manual end-to-end testing.
 *
 *   npm run seed
 *
 * Safe to re-run. Accounts are matched by email and updated in place, so _ids
 * survive and any jobs/applications already posted by the demo recruiter stay
 * linked. The three pre-existing real accounts in JAIN_PLACEMENT are never
 * touched.
 *
 * You no longer need to re-run this to recover a Recruiter or Admin login.
 * A successful login still clears the stored code, but submitting the correct
 * password with no code mints and sends a fresh one — and with no SMTP
 * configured that code is printed to the server console.
 *
 * The fixed VERIFICATION_CODE below is a local-demo convenience. A correct
 * code alone establishes a session, so a known, never-expiring code on a
 * reachable database is a password-free login: never run this against a
 * deployed environment.
 */
import mongoose from "mongoose";
import { config } from "dotenv";

import { User } from "./models/userSchema.js";
import { Admin } from "./models/adminModel.js";

config({ path: ".env" });

const VERIFICATION_CODE = "123456";

const users = [
  {
    name: "Test Student",
    email: "student@jain.test",
    password: "Student@123",
    role: "Student",
    enrollment: "23BTRCN001",
    address: "Bangalore, Karnataka",
    phone: 9000000010,
    isVerified: true,
    verificationCode: null,
  },
  {
    name: "Test Recruiter",
    email: "recruiter@jain.test",
    password: "Recruiter@123",
    role: "Recruiter",
    enrollment: "",
    address: "Bangalore, Karnataka",
    phone: 9000000020,
    isVerified: true,
    verificationCode: VERIFICATION_CODE,
    status: "Approved",
  },
  {
    name: "Pending Recruiter",
    email: "recruiter.pending@jain.test",
    password: "Recruiter@123",
    role: "Recruiter",
    enrollment: "",
    address: "Bangalore, Karnataka",
    phone: 9000000021,
    isVerified: true,
    verificationCode: VERIFICATION_CODE,
    status: "Pending",
  },
];

const admins = [
  {
    firstname: "Test",
    lastname: "Admin",
    email: "admin@jain.test",
    password: "Admin@123",
    phone: "9000000030",
    isVerified: true,
    verificationCode: VERIFICATION_CODE,
  },
];

// Assigning field-by-field (rather than deleting and recreating) keeps the _id
// stable and marks `password` as modified, so the pre-save hook hashes it once.
const upsert = async (Model, { email, ...fields }) => {
  let doc = await Model.findOne({ email });
  const action = doc ? "updated" : "created";

  if (!doc) doc = new Model({ email });
  Object.assign(doc, fields);
  await doc.save();

  return { action, doc };
};

/**
 * Demo accounts seeded before the TNP/TPO -> Recruiter/Admin rename.
 *
 * `upsert` matches on email, so renaming the seeds above would otherwise leave
 * the old documents behind and the demo database would end up with two
 * recruiters and two admins — one set unreachable by any documented login.
 */
const LEGACY_EMAILS = [
  "tnp@jain.test",
  "tnp.pending@jain.test",
  "tpo@jain.test",
];

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI, { dbName: "JAIN_PLACEMENT" });
  console.log(`Connected to ${mongoose.connection.db.databaseName}\n`);

  for (const Model of [User, Admin]) {
    const { deletedCount } = await Model.deleteMany({
      email: { $in: LEGACY_EMAILS },
    });
    if (deletedCount) {
      console.log(`  removed  ${deletedCount} legacy demo account(s) from ${Model.modelName}`);
    }
  }

  for (const u of users) {
    const { action, doc } = await upsert(User, u);
    console.log(
      `  ${action}  ${doc.role.padEnd(7)} ${u.email}` +
        (doc.status ? `  [${doc.status}]` : "")
    );
  }

  for (const a of admins) {
    const { action } = await upsert(Admin, a);
    console.log(`  ${action}  Admin   ${a.email}`);
  }

  console.log(`\nVerification code for Recruiter + Admin logins: ${VERIFICATION_CODE}`);
  console.log("Student login needs no code.");

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
