/**
 * One-off: create or update a single real Admin account.
 *
 * Unlike seed.js, this never writes a published, publicly-known password.
 * Email, password, name and phone all come from environment variables at
 * invocation time, so nothing here is ever committed to the repo. That's
 * exactly why this is safe to run against the one shared database this
 * project uses for both local dev and production — and exactly why it must
 * never be wired into `npm run seed` or shipped in the deploy bundle (see
 * .vercelignore).
 *
 * Usage (values passed inline, never written to a file):
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a-strong-password' \
 *   ADMIN_FIRSTNAME=First ADMIN_LASTNAME=Last ADMIN_PHONE=9999999999 \
 *   node createAdmin.js
 *
 * Safe to re-run: matches on email and updates in place, exactly like the
 * upsert in seed.js.
 */
import mongoose from "mongoose";
import { config } from "dotenv";
import { Admin } from "./models/adminModel.js";

config({ path: ".env" });

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const firstname = process.env.ADMIN_FIRSTNAME || "Admin";
const lastname = process.env.ADMIN_LASTNAME || "User";
const phone = process.env.ADMIN_PHONE || "9999999999";

if (!email || !password) {
  console.error(
    "Set ADMIN_EMAIL and ADMIN_PASSWORD env vars before running this script."
  );
  process.exit(1);
}
if (password.length < 8) {
  console.error("Refusing to create an account with a password under 8 characters.");
  process.exit(1);
}

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI, { dbName: "JAIN_PLACEMENT" });
  console.log(`Connected to ${mongoose.connection.db.databaseName}`);

  let admin = await Admin.findOne({ email });
  const action = admin ? "updated" : "created";
  if (!admin) admin = new Admin({ email });

  admin.firstname = firstname;
  admin.lastname = lastname;
  admin.phone = phone;
  admin.password = password; // hashed by the pre-save hook
  admin.isVerified = true;
  admin.verificationCode = null;
  admin.verificationCodeExpires = null;
  admin.verificationAttempts = 0;

  try {
    await admin.save();
  } catch (error) {
    if (error.code === 11000) {
      console.error(
        `Save failed: ${Object.keys(error.keyValue)} already in use by another admin. ` +
          "Set ADMIN_PHONE to a different value and retry."
      );
      process.exit(1);
    }
    throw error;
  }

  console.log(`Admin account ${action}: ${email}`);
};

run()
  .then(() => mongoose.disconnect())
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
