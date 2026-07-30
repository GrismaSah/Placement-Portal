/**
 * Seeds (or re-seeds) the demo accounts used for manual end-to-end testing.
 *
 *   npm run seed
 *
 * Safe to re-run. Accounts are matched by email and updated in place, so _ids
 * survive and any jobs/applications already posted by the demo TNP stay linked.
 * The three pre-existing real accounts in JAIN_PLACEMENT are never touched.
 *
 * Re-run this whenever you need to log in as TNP or TPO again: a successful
 * login clears the stored verification code, and with no SMTP configured there
 * is no way to receive a new one.
 */
import mongoose from "mongoose";
import { config } from "dotenv";

import { User } from "./models/userSchema.js";
import { TPO } from "./models/tpoModel.js";

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
    email: "tnp@jain.test",
    password: "Recruiter@123",
    role: "TNP",
    enrollment: "",
    address: "Bangalore, Karnataka",
    phone: 9000000020,
    isVerified: true,
    verificationCode: VERIFICATION_CODE,
    status: "Approved",
  },
  {
    name: "Pending Recruiter",
    email: "tnp.pending@jain.test",
    password: "Recruiter@123",
    role: "TNP",
    enrollment: "",
    address: "Bangalore, Karnataka",
    phone: 9000000021,
    isVerified: true,
    verificationCode: VERIFICATION_CODE,
    status: "Pending",
  },
];

const tpos = [
  {
    firstname: "Test",
    lastname: "TPO",
    email: "tpo@jain.test",
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

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI, { dbName: "JAIN_PLACEMENT" });
  console.log(`Connected to ${mongoose.connection.db.databaseName}\n`);

  for (const u of users) {
    const { action, doc } = await upsert(User, u);
    console.log(
      `  ${action}  ${doc.role.padEnd(7)} ${u.email}` +
        (doc.status ? `  [${doc.status}]` : "")
    );
  }

  for (const t of tpos) {
    const { action } = await upsert(TPO, t);
    console.log(`  ${action}  TPO     ${t.email}`);
  }

  console.log(`\nVerification code for TNP + TPO logins: ${VERIFICATION_CODE}`);
  console.log("Student login needs no code.");

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
