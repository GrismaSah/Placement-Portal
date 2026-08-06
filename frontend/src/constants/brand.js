/**
 * Single source of truth for institutional identity.
 *
 * Nothing about the university may be hardcoded in JSX. The portal was
 * originally built for a different institution and that branding leaked into
 * six JSX files, index.html and eight backend email templates — this module
 * exists so that never happens again. The backend has a mirror of the subset
 * it needs at backend/config/branding.js.
 */

export const BRAND = {
  name: "JAIN (Deemed-to-be University)",
  shortName: "JAIN",
  legalName: "JAIN (Deemed-to-be University), Bengaluru",
  product: "Placement Portal",
  productShort: "Placements",

  tagline: "Where JAIN talent meets industry.",
  description:
    "The official placement portal of JAIN (Deemed-to-be University) — connecting students, recruiters and the Training & Placement Office in one place.",

  address: {
    line1: "#44/4, District Fund Road",
    line2: "Jayanagar 9th Block",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560069",
    country: "India",
  },

  phone: "080-69279444",
  email: "admissions@jainuniversity.ac.in",
  supportEmail: "placements@jainuniversity.ac.in",
  // Mirrors backend/config/branding.js — students must register with
  // <enrollment>@<this domain>, enforced server-side in userController.js.
  studentEmailDomain: "jainuniversity.ac.in",

  // JGI Blue + JGI Yellow, per the university's logo & graphic standards.
  colors: {
    navy: "#111E42",
    gold: "#F6C100",
    ink: "#1E1916",
  },

  links: {
    website: "https://www.jainuniversity.ac.in",
    about: "https://www.jainuniversity.ac.in/about/brand-jain",
    placements: "https://www.jainuniversity.ac.in/placements",
    admissions: "https://www.jainuniversity.ac.in/admissions",
    contact: "https://www.jainuniversity.ac.in",
  },

  social: {
    instagram: "https://www.instagram.com/jainuniversityofficial/",
    youtube: "https://www.youtube.com/@JainDeemedtobeUniversity",
    linkedin: "https://in.linkedin.com/school/jaindeemedtobeuniversity/",
    facebook: "https://www.facebook.com/JAINDeemedtobeUniversityofficial/",
    twitter: "https://x.com/JainDeemedtbUnv",
  },
};

/** "#44/4, District Fund Road, Jayanagar 9th Block, Bengaluru, Karnataka 560069" */
export const formattedAddress = [
  BRAND.address.line1,
  BRAND.address.line2,
  BRAND.address.city,
  `${BRAND.address.state} ${BRAND.address.pincode}`,
].join(", ");

/** The seven brand values JAIN publishes. Used by the landing page strip. */
export const BRAND_VALUES = [
  { title: "Credibility", body: "Recognised programmes, and the accreditations that back them." },
  { title: "Commitment", body: "Steadfast in offering our students the best of education and support." },
  { title: "Consistency", body: "The same standard of service, every semester, every cohort." },
  { title: "Creativity", body: "A campus that encourages new approaches to learning and teaching." },
  { title: "Conviction", body: "Education and entrepreneurship are the stepping stones to success." },
  { title: "Innovation", body: "Known for innovation in both programmes and pedagogy." },
  { title: "Reliability", body: "Freshness in academic pursuits, methods and programmes." },
];

export default BRAND;
