import { Link } from "react-router-dom";
import { FaFacebookF, FaYoutube, FaLinkedinIn, FaXTwitter } from "react-icons/fa6";
import { RiInstagramFill } from "react-icons/ri";
import { FiMapPin, FiPhone, FiMail } from "react-icons/fi";
import { BRAND, formattedAddress } from "../../constants/brand";
import JainLogo from "../brand/JainLogo";

const SOCIALS = [
  { key: "instagram", label: "Instagram", Icon: RiInstagramFill },
  { key: "youtube", label: "YouTube", Icon: FaYoutube },
  { key: "linkedin", label: "LinkedIn", Icon: FaLinkedinIn },
  { key: "facebook", label: "Facebook", Icon: FaFacebookF },
  { key: "twitter", label: "X", Icon: FaXTwitter },
];

const PORTAL_LINKS = [
  { to: "/app/jobs", label: "Browse openings" },
  { to: "/app/dashboard", label: "Dashboard" },
  { to: "/app/applications", label: "My applications" },
  { to: "/app/resume", label: "Resume builder" },
];

const UNIVERSITY_LINKS = [
  { href: BRAND.links.website, label: "University website" },
  { href: BRAND.links.placements, label: "Placement cell" },
  { href: BRAND.links.about, label: "About JAIN" },
  { href: BRAND.links.admissions, label: "Admissions" },
];

const Footer = () => (
  <footer className="bg-brand-gradient text-white">
    <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
      {/* Brand + contact */}
      <div className="lg:pr-6">
        <JainLogo variant="full" tone="white" height={40} />

        <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/70 text-balance-pretty">
          {BRAND.description}
        </p>

        <address className="mt-6 space-y-2.5 text-sm not-italic text-white/70">
          <span className="flex gap-2.5">
            <FiMapPin aria-hidden="true" className="mt-0.5 shrink-0 text-gold-500" />
            <span>{formattedAddress}</span>
          </span>
          <a
            href={`tel:${BRAND.phone.replace(/[^+\d]/g, "")}`}
            className="flex items-center gap-2.5 transition-colors hover:text-white"
          >
            <FiPhone aria-hidden="true" className="shrink-0 text-gold-500" />
            {BRAND.phone}
          </a>
          <a
            href={`mailto:${BRAND.email}`}
            className="flex items-center gap-2.5 transition-colors hover:text-white"
          >
            <FiMail aria-hidden="true" className="shrink-0 text-gold-500" />
            {BRAND.email}
          </a>
        </address>
      </div>

      {/* Portal */}
      <nav aria-labelledby="footer-portal">
        <h2 id="footer-portal" className="text-sm font-semibold tracking-wide text-white">
          Portal
        </h2>
        <ul className="mt-4 space-y-3 text-sm">
          {PORTAL_LINKS.map(({ to, label }) => (
            <li key={to}>
              <Link
                to={to}
                className="text-white/70 transition-colors hover:text-gold-400"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* University */}
      <nav aria-labelledby="footer-university">
        <h2 id="footer-university" className="text-sm font-semibold tracking-wide text-white">
          University
        </h2>
        <ul className="mt-4 space-y-3 text-sm">
          {UNIVERSITY_LINKS.map(({ href, label }) => (
            <li key={href}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 transition-colors hover:text-gold-400"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Connect */}
      <div>
        <h2 className="text-sm font-semibold tracking-wide text-white">Connect with JAIN</h2>
        <p className="mt-4 text-sm text-white/70">
          Follow the university for campus news, recruiter announcements and placement
          highlights.
        </p>

        <ul className="mt-5 flex flex-wrap gap-2.5">
          {SOCIALS.map(({ key, label, Icon }) => (
            <li key={key}>
              <a
                href={BRAND.social[key]}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${BRAND.shortName} on ${label}`}
                className="flex size-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/80 transition-all duration-200 hover:-translate-y-0.5 hover:border-gold-500 hover:bg-gold-500 hover:text-navy-950 focus-visible:outline-gold-400"
              >
                <Icon aria-hidden="true" className="size-[18px]" />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>

    <div className="border-t border-white/10">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-6 text-sm text-white/60 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>
          © {new Date().getFullYear()} {BRAND.legalName}. All rights reserved.
        </p>
        <p>
          {BRAND.product} · Training &amp; Placement Office
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
