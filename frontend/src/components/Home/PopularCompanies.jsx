import React from "react";
import { Link } from "react-router-dom";
import { companyLogo } from "../../constants/jobTaxonomy";

const MAX_CARDS = 6;

const CompanyCard = ({ company }) => {
  const Logo = companyLogo(company.name);
  return (
    <Link
      className="card"
      to={`/job/getall?company=${encodeURIComponent(company.name)}`}
    >
      <div className="content">
        <div className="icon">
          <Logo />
        </div>
        <div className="text">
          <p>{company.name}</p>
          <p>
            {[company.city, company.country].filter(Boolean).join(", ")}
          </p>
        </div>
      </div>
      <button type="button">
        {company.count} Open {company.count === 1 ? "Role" : "Roles"}
      </button>
    </Link>
  );
};

const PopularCompanies = ({ companies = [] }) => {
  const cards = companies.slice(0, MAX_CARDS);

  if (cards.length === 0) return null;

  // Preserve the original two-row layout, splitting whatever we actually have.
  const half = Math.ceil(cards.length / 2);
  const rows = [cards.slice(0, half), cards.slice(half)].filter(
    (row) => row.length > 0
  );

  return (
    <div className="companies">
      <div className="container">
        <h3>TOP COMPANIES</h3>
        {rows.map((row, index) => (
          <div className="banner" key={index}>
            {row.map((company) => (
              <CompanyCard company={company} key={company.name} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PopularCompanies;
