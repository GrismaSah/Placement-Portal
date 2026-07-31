import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import { Application } from "../models/applicationSchema.js";
import { Job } from "../models/jobSchema.js";
import { User } from "../models/userSchema.js";

/**
 * Placement analytics for the Training & Placement Office.
 *
 * The portal previously had a single aggregate endpoint (job counts by
 * category and company) and no placement reporting of any kind — no placement
 * rate, no package figures, no branch-wise outcomes. The TPO, the most senior
 * role, had six endpoints and one screen.
 *
 * "Placed" is derived from applications rather than from the denormalised
 * user.placementStatus, so the numbers stay correct even if that field drifts.
 */
export const getPlacementAnalytics = catchAsyncErrors(async (req, res) => {
  const [
    students,
    placedApplications,
    offeredApplications,
    totalApplications,
    companies,
    openRoles,
    byStage,
    byBranchRaw,
    byCompany,
    monthly,
  ] = await Promise.all([
    User.find({ role: "Student" }).select("branch batch cgpa").lean(),

    Application.find({ status: "Placed" })
      .populate("jobId", "company title")
      .select("applicantID offer jobId")
      .lean(),

    Application.countDocuments({ status: { $in: ["Offered", "Placed"] } }),
    Application.countDocuments({}),
    Job.distinct("company"),
    Job.countDocuments({ expired: false }),

    Application.aggregate([
      { $group: { _id: { $ifNull: ["$status", "Applied"] }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),

    // Branch lives on the user, so placements have to be joined back to it.
    Application.aggregate([
      { $match: { status: "Placed" } },
      {
        $lookup: {
          from: "users",
          localField: "applicantID.user",
          foreignField: "_id",
          as: "student",
        },
      },
      { $unwind: "$student" },
      {
        $group: {
          _id: { $ifNull: ["$student.branch", "Unspecified"] },
          placed: { $sum: 1 },
        },
      },
    ]),

    Application.aggregate([
      { $match: { status: "Placed" } },
      { $lookup: { from: "jobs", localField: "jobId", foreignField: "_id", as: "job" } },
      { $unwind: "$job" },
      {
        $group: {
          _id: "$job.company",
          hires: { $sum: 1 },
          avgCtc: { $avg: "$offer.ctc" },
        },
      },
      { $sort: { hires: -1 } },
      { $limit: 10 },
    ]),

    Application.aggregate([
      { $match: { status: "Placed", updatedAt: { $exists: true } } },
      {
        $group: {
          _id: { year: { $year: "$updatedAt" }, month: { $month: "$updatedAt" } },
          placed: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 12 },
    ]),
  ]);

  // ---- Packages ----------------------------------------------------------
  // Only offers that actually carry a CTC contribute; a missing figure would
  // otherwise drag the average toward zero.
  const packages = placedApplications
    .map((a) => a.offer?.ctc)
    .filter((n) => Number.isFinite(n) && n > 0)
    .sort((a, b) => a - b);

  const median = packages.length
    ? packages.length % 2
      ? packages[(packages.length - 1) / 2]
      : (packages[packages.length / 2 - 1] + packages[packages.length / 2]) / 2
    : 0;

  const average = packages.length
    ? Math.round(packages.reduce((sum, n) => sum + n, 0) / packages.length)
    : 0;

  // ---- Branch table ------------------------------------------------------
  const branchTotals = students.reduce((acc, s) => {
    const key = s.branch || "Unspecified";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const placedByBranch = Object.fromEntries(
    byBranchRaw.map((row) => [row._id, row.placed])
  );

  const byBranch = Object.entries(branchTotals)
    .map(([branch, total]) => ({
      branch,
      total,
      placed: placedByBranch[branch] ?? 0,
    }))
    .sort((a, b) => b.placed / b.total - a.placed / a.total);

  // A student can hold several applications; placement rate counts people.
  const distinctPlaced = new Set(
    placedApplications.map((a) => String(a.applicantID?.user))
  ).size;

  res.status(200).json({
    success: true,
    analytics: {
      students: students.length,
      placed: distinctPlaced,
      placementRate: students.length
        ? Math.round((distinctPlaced / students.length) * 1000) / 10
        : 0,
      offers: offeredApplications,
      applications: totalApplications,
      companies: companies.length,
      openRoles,

      highestPackage: packages.at(-1) ?? 0,
      lowestPackage: packages[0] ?? 0,
      averagePackage: average,
      medianPackage: median,

      byStage: byStage.map((s) => ({ status: s._id, count: s.count })),
      byBranch,
      byCompany: byCompany.map((c) => ({
        company: c._id,
        hires: c.hires,
        avgCtc: c.avgCtc ? Math.round(c.avgCtc) : null,
      })),
      monthly: monthly.map((m) => ({
        year: m._id.year,
        month: m._id.month,
        placed: m.placed,
      })),
    },
  });
});

/**
 * Student directory for the placement office, with each student's live
 * application counts. Supports search and branch/status filtering.
 */
export const getStudentDirectory = catchAsyncErrors(async (req, res) => {
  const { search = "", branch, status, page = 1, limit = 20 } = req.query;

  const filter = { role: "Student" };

  if (branch) filter.branch = branch;
  if (status) filter.placementStatus = status;
  if (search.trim()) {
    // Escaped so a user typing "a.b(" cannot produce an invalid regex (or a
    // pathological one) and 500 the endpoint.
    const safe = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const rx = new RegExp(safe, "i");
    filter.$or = [{ name: rx }, { email: rx }, { enrollment: rx }];
  }

  const pageNum = Math.max(1, Number(page) || 1);
  const perPage = Math.min(Math.max(1, Number(limit) || 20), 100);

  const [students, total] = await Promise.all([
    User.find(filter)
      .select("name email enrollment branch batch cgpa placementStatus placedAt createdAt")
      .sort({ name: 1 })
      .skip((pageNum - 1) * perPage)
      .limit(perPage)
      .lean(),
    User.countDocuments(filter),
  ]);

  // One aggregate for the whole page rather than a query per student.
  const ids = students.map((s) => s._id);
  const counts = await Application.aggregate([
    { $match: { "applicantID.user": { $in: ids } } },
    {
      $group: {
        _id: "$applicantID.user",
        applications: { $sum: 1 },
        placed: {
          $sum: { $cond: [{ $eq: ["$status", "Placed"] }, 1, 0] },
        },
      },
    },
  ]);

  const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c]));

  res.status(200).json({
    success: true,
    students: students.map((s) => ({
      ...s,
      applications: countMap[String(s._id)]?.applications ?? 0,
      placedCount: countMap[String(s._id)]?.placed ?? 0,
    })),
    total,
    page: pageNum,
    totalPages: Math.ceil(total / perPage),
  });
});
