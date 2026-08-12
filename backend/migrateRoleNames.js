/**
 * One-time migration: rename the confusing "TNP"/"TPO" identifiers to
 * "Recruiter"/"Admin" in the live database, to match the renamed code.
 *
 *   node migrateRoleNames.js
 *
 * Must run BEFORE the renamed backend code starts serving requests — old
 * code + migrated data, or new code + unmigrated data, both break auth and
 * applicant listing. Safe to re-run: every step is a no-op the second time.
 */
import mongoose from "mongoose";
import { config } from "dotenv";

config({ path: ".env" });

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI, { dbName: "JAIN_PLACEMENT" });
  const db = mongoose.connection.db;
  console.log(`Connected to ${db.databaseName}\n`);

  const collections = await db.listCollections({ name: "tpos" }).toArray();
  if (collections.length) {
    await db.collection("tpos").rename("admins");
    console.log("renamed collection  tpos -> admins");
  } else {
    console.log("skip  tpos collection already renamed (or absent)");
  }

  const userRes = await db
    .collection("users")
    .updateMany({ role: "TNP" }, { $set: { role: "Recruiter" } });
  console.log(`users  role TNP -> Recruiter: ${userRes.modifiedCount} updated`);

  const renameRes = await db
    .collection("applications")
    .updateMany(
      { TNPID: { $exists: true } },
      { $rename: { TNPID: "recruiterId" } }
    );
  console.log(
    `applications  TNPID -> recruiterId: ${renameRes.modifiedCount} updated`
  );

  const appRoleRes = await db
    .collection("applications")
    .updateMany(
      { "recruiterId.role": "TNP" },
      { $set: { "recruiterId.role": "Recruiter" } }
    );
  console.log(
    `applications  recruiterId.role TNP -> Recruiter: ${appRoleRes.modifiedCount} updated`
  );

  const notifRes = await db
    .collection("notifications")
    .updateMany({ userModel: "TPO" }, { $set: { userModel: "Admin" } });
  console.log(
    `notifications  userModel TPO -> Admin: ${notifRes.modifiedCount} updated`
  );

  console.log("\nPost-migration counts:");
  console.log(
    "  users role TNP remaining:",
    await db.collection("users").countDocuments({ role: "TNP" })
  );
  console.log("  tpos collection docs remaining:", collections.length ? "n/a (renamed)" : await db.collection("tpos").countDocuments().catch(() => 0));
  console.log("  admins collection docs:", await db.collection("admins").countDocuments());
  console.log(
    "  users role Recruiter:",
    await db.collection("users").countDocuments({ role: "Recruiter" })
  );

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
