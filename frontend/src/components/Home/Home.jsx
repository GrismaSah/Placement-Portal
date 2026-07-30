import React, { useEffect, useState } from "react";
import { useContext } from "react";
import { Context } from "../../main";
import { Navigate } from "react-router-dom";
import axios from "axios";
import HeroSection from "./HeroSection";
import HowItWorks from "./HowItWorks";
import PopularCategories from "./PopularCategories";
import PopularCompanies from "./PopularCompanies";

const EMPTY_STATS = {
  categories: [],
  companies: [],
  totals: { openRoles: 0, companies: 0, students: 0, applications: 0 },
};

const Home = () => {
  const { isAuthorized } = useContext(Context);

  // Fetched once here and passed down: the hero, the category tiles and the
  // company cards all read the same aggregate, so three separate fetches would
  // be three round trips for identical data.
  const [stats, setStats] = useState(EMPTY_STATS);

  useEffect(() => {
    let cancelled = false;

    axios
      .get("/api/v1/job/stats")
      .then((res) => {
        if (!cancelled) setStats(res.data);
      })
      .catch(() => {
        if (!cancelled) setStats(EMPTY_STATS);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!isAuthorized) {
    return <Navigate to={"/login"} />;
  }

  return (
    <>
      <section className="homePage page">
        <HeroSection totals={stats.totals} />
        <HowItWorks />
        <PopularCategories categories={stats.categories} />
        <PopularCompanies companies={stats.companies} />
      </section>
    </>
  );
};

export default Home;
