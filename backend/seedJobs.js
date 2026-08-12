/**
 * Seeds the job board with a realistic spread of openings.
 *
 *   npm run seed        (runs seed.js first — this needs the approved Recruiter to exist)
 *   npm run seed:jobs   (jobs only)
 *
 * Safe to re-run: jobs are matched on {company, title} and updated in place, so
 * re-seeding never duplicates and never orphans an existing application.
 *
 * Schema limits enforced by models/jobSchema.js and respected below:
 *   title       3-30 characters
 *   description 30-500 characters
 */
import mongoose from "mongoose";
import { config } from "dotenv";

import { Job } from "./models/jobSchema.js";
import { User } from "./models/userSchema.js";

config({ path: ".env" });

const OWNER_EMAIL = "tnp@jain.test";

const COMPANIES = {
  Google: { city: "Bengaluru", country: "India" },
  Microsoft: { city: "Hyderabad", country: "India" },
  NVIDIA: { city: "Hyderabad", country: "India" },
  Oracle: { city: "Bengaluru", country: "India" },
  PayPal: { city: "Bengaluru", country: "India" },
  Cisco: { city: "Bengaluru", country: "India" },
  Amazon: { city: "Hyderabad", country: "India" },
  TCS: { city: "Bengaluru", country: "India" },
};

// [title, company, category, salaryFrom, salaryTo]  — titles kept under 30 chars.
const JOBS = [
  // Frontend Development (5)
  ["Frontend Engineer I", "Google", "Frontend Development", 1800000, 2600000],
  ["UI Engineer", "Microsoft", "Frontend Development", 1600000, 2400000],
  ["React Developer", "PayPal", "Frontend Development", 1200000, 1800000],
  ["Frontend Developer", "TCS", "Frontend Development", 600000, 900000],
  ["Design Systems Engineer", "Oracle", "Frontend Development", 1400000, 2000000],

  // Data Analyst (4)
  ["Data Analyst", "Amazon", "Data Analyst", 1200000, 1800000],
  ["Business Data Analyst", "PayPal", "Data Analyst", 1100000, 1600000],
  ["Product Analyst", "Google", "Data Analyst", 1500000, 2200000],
  ["Analytics Associate", "TCS", "Data Analyst", 550000, 850000],

  // Machine Learning (4)
  ["ML Engineer", "NVIDIA", "Machine Learning", 2200000, 3200000],
  ["Deep Learning Engineer", "NVIDIA", "Machine Learning", 2400000, 3500000],
  ["Applied ML Engineer", "Google", "Machine Learning", 2000000, 3000000],
  ["ML Platform Engineer", "Microsoft", "Machine Learning", 1900000, 2800000],

  // Web Development (4)
  ["Full Stack Developer", "Amazon", "Web Development", 1600000, 2400000],
  ["Backend Web Developer", "Cisco", "Web Development", 1300000, 1900000],
  ["Web Developer", "TCS", "Web Development", 500000, 800000],
  ["Node.js Developer", "PayPal", "Web Development", 1200000, 1800000],

  // Mobile App Development (4)
  ["Android Developer", "Google", "Mobile App Development", 1700000, 2500000],
  ["iOS Developer", "Microsoft", "Mobile App Development", 1700000, 2500000],
  ["Mobile App Engineer", "Amazon", "Mobile App Development", 1500000, 2200000],
  ["Flutter Developer", "TCS", "Mobile App Development", 600000, 950000],

  // System Engineer (4)
  ["Systems Engineer", "Cisco", "System Engineer", 1400000, 2000000],
  ["Network Systems Engineer", "Cisco", "System Engineer", 1300000, 1900000],
  ["Infrastructure Engineer", "Oracle", "System Engineer", 1500000, 2200000],
  ["Site Reliability Engineer", "Amazon", "System Engineer", 1800000, 2700000],

  // Graduate Trainee (4)
  ["Graduate Engineer Trainee", "TCS", "Graduate Trainee", 400000, 650000],
  ["Graduate Trainee Program", "Oracle", "Graduate Trainee", 700000, 1000000],
  ["Campus Trainee Engineer", "Cisco", "Graduate Trainee", 800000, 1100000],
  ["Associate Trainee", "PayPal", "Graduate Trainee", 750000, 1050000],

  // Data Scientist (3)
  ["Data Scientist", "Microsoft", "Data Scientist", 1900000, 2800000],
  ["Research Data Scientist", "NVIDIA", "Data Scientist", 2100000, 3100000],
  ["Junior Data Scientist", "Oracle", "Data Scientist", 1300000, 1900000],
];

const describe = (title, company, category, city) =>
  `${company} is hiring a ${title} for our ${city} team. You will work with ` +
  `experienced engineers on ${category.toLowerCase()} projects used by millions, ` +
  `own features end to end, and take part in design and code reviews. We look for ` +
  `strong fundamentals in data structures and algorithms and clear communication. ` +
  `Final-year students from all branches may apply. Mentorship provided.`;

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI, { dbName: "JAIN_PLACEMENT" });
  console.log(`Connected to ${mongoose.connection.db.databaseName}\n`);

  const owner = await User.findOne({ email: OWNER_EMAIL, role: "Recruiter" });
  if (!owner) {
    throw new Error(
      `Seed owner ${OWNER_EMAIL} not found. Run "npm run seed" first — jobs need an approved Recruiter for postedBy.`
    );
  }

  let created = 0;
  let updated = 0;

  // Stagger postedOn across the past 30 days so the newest-first sort is visible.
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;

  for (const [index, [title, company, category, salaryFrom, salaryTo]] of JOBS.entries()) {
    const { city, country } = COMPANIES[company];
    const jobPostedOn = new Date(now - Math.floor((index * 30) / JOBS.length) * DAY);

    const existing = await Job.findOne({ company, title });
    const doc = existing || new Job({ company, title });

    Object.assign(doc, {
      description: describe(title, company, category, city),
      category,
      country,
      city,
      salaryFrom,
      salaryTo,
      fixedSalary: undefined,
      expired: false,
      jobPostedOn,
      postedBy: owner._id,
    });

    await doc.save();
    existing ? updated++ : created++;
  }

  const total = await Job.countDocuments({ expired: false });
  console.log(`  ${created} created, ${updated} updated`);
  console.log(`  ${total} open jobs now on the board`);
  console.log(`  owner: ${owner.name} <${owner.email}>`);

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error("Job seed failed:", err.message);
  process.exit(1);
});
