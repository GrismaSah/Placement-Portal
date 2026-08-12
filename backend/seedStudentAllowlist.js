/**
 * Seeds the allowlist of enrollment numbers JAIN actually issued, from
 * data/student-allowlist.csv. Registration checks against this collection
 * instead of accepting any enrollment number shaped like a real one.
 *
 *   npm run seed:allowlist
 *
 * Safe to re-run: rows are matched by enrollment and updated in place.
 */
import mongoose from "mongoose";
import { config } from "dotenv";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

import { StudentAllowlist } from "./models/studentAllowlistModel.js";

config({ path: ".env" });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const csvPath = path.join(__dirname, "data", "student-allowlist.csv");

const parseCsv = (text) => {
  const [headerLine, ...lines] = text.trim().split("\n");
  const headers = headerLine.split(",").map((h) => h.trim());
  return lines
    .filter((line) => line.trim())
    .map((line) => {
      const values = line.split(",").map((v) => v.trim());
      return Object.fromEntries(headers.map((h, i) => [h, values[i]]));
    });
};

const run = async () => {
  const rows = parseCsv(readFileSync(csvPath, "utf8"));

  await mongoose.connect(process.env.MONGO_URI, { dbName: "JAIN_PLACEMENT" });
  console.log(`Connected to ${mongoose.connection.db.databaseName}\n`);

  let created = 0;
  let updated = 0;

  for (const { enrollment, email } of rows) {
    const result = await StudentAllowlist.findOneAndUpdate(
      { enrollment: enrollment.toUpperCase() },
      { enrollment: enrollment.toUpperCase(), email: email.toLowerCase() },
      { upsert: true, new: true, rawResult: true }
    );
    if (result.lastErrorObject?.updatedExisting) {
      updated++;
    } else {
      created++;
    }
  }

  console.log(`${created} created, ${updated} updated`);
  console.log(`${rows.length} enrollment numbers now allowlisted`);

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error("Allowlist seed failed:", err.message);
  process.exit(1);
});
