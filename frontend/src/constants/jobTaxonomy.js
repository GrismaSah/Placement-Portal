import {
  FaAmazon,
  FaBrain,
  FaBuilding,
  FaChartBar,
  FaGoogle,
  FaMicrosoft,
  FaPaypal,
  FaReact,
  FaServer,
  FaUserGraduate,
} from "react-icons/fa";
import {
  MdAccountBalance,
  MdOutlineWebhook,
  MdTrendingUp,
} from "react-icons/md";
import { SiCisco, SiNvidia, SiOracle, SiTcs } from "react-icons/si";
import { TbAppsFilled } from "react-icons/tb";
import { GiArtificialIntelligence } from "react-icons/gi";

/**
 * The single source of truth for job categories.
 *
 * `value` is the exact string persisted on Job.category in MongoDB — it is what
 * PostJob writes and what the /getall?category= filter matches on. `label` is
 * display only. Keeping the two explicitly separated is what prevents the old
 * split where the home page said "Mobile App Developer" while the database held
 * "Mobile App Development", leaving nothing to filter on.
 *
 * Icons are stored as component references (not JSX) so this stays a .js file.
 */
export const JOB_CATEGORIES = [
  { value: "Frontend Development", label: "Frontend Developer", icon: MdOutlineWebhook },
  { value: "Web Development", label: "Web Developer", icon: FaReact },
  { value: "Mobile App Development", label: "Mobile App Developer", icon: TbAppsFilled },
  { value: "Data Analyst", label: "Data Analyst", icon: FaChartBar },
  { value: "Data Scientist", label: "Data Scientist", icon: GiArtificialIntelligence },
  { value: "Machine Learning", label: "Machine Learning Engineer", icon: FaBrain },
  { value: "System Engineer", label: "System Engineer", icon: FaServer },
  { value: "Graduate Trainee", label: "Graduate Trainee", icon: FaUserGraduate },
  { value: "Account & Finance", label: "Account & Finance", icon: MdAccountBalance },
  { value: "BDA", label: "Business Development Analyst", icon: MdTrendingUp },
];

const CATEGORY_BY_VALUE = new Map(JOB_CATEGORIES.map((c) => [c.value, c]));

/** Display name for a stored category value, falling back to the raw value. */
export const categoryLabel = (value) =>
  CATEGORY_BY_VALUE.get(value)?.label ?? value;

/** Icon component for a stored category value; FaBuilding for anything unknown. */
export const categoryIcon = (value) =>
  CATEGORY_BY_VALUE.get(value)?.icon ?? FaBuilding;

const COMPANY_LOGOS = {
  google: FaGoogle,
  microsoft: FaMicrosoft,
  nvidia: SiNvidia,
  oracle: SiOracle,
  paypal: FaPaypal,
  cisco: SiCisco,
  amazon: FaAmazon,
  tcs: SiTcs,
};

/**
 * Logo for a company name. Unknown companies fall back to a generic building
 * icon so a recruiter posting under a new name still renders correctly.
 */
export const companyLogo = (name) =>
  COMPANY_LOGOS[String(name ?? "").trim().toLowerCase()] ?? FaBuilding;
