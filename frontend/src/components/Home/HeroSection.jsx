import React from "react";
import { FaBuilding, FaSuitcase, FaUsers, FaUserPlus } from "react-icons/fa";

const HeroSection = ({ totals }) => {
  const {
    openRoles = 0,
    companies = 0,
    students = 0,
    applications = 0,
  } = totals ?? {};

  const details = [
    { id: 1, title: openRoles, subTitle: "Open Roles", icon: <FaSuitcase /> },
    { id: 2, title: companies, subTitle: "Hiring Companies", icon: <FaBuilding /> },
    { id: 3, title: students, subTitle: "Registered Students", icon: <FaUsers /> },
    { id: 4, title: applications, subTitle: "Applications", icon: <FaUserPlus /> },
  ];

  return (
    <>
      <div id="home" className="heroSection">
        <div className="container">
          <div className="title">
            <h1>Launch Your Career</h1>
            <h1>Through Campus Placements</h1>
            <p>
              Unlock your potential and secure your dream job through our premier campus placement platform.
              Connect with top companies, showcase your talents, and take the first step towards your
              professional success.
            </p>
          </div>
          <div className="image">
            <img src="/heroS.jpg" alt="hero" />
          </div>
        </div>
        <div className="details">
          {details.map((element) => {
            return (
              <div className="card" key={element.id}>
                <div className="icon">{element.icon}</div>
                <div className="content">
                  <p>{element.title}</p>
                  <p>{element.subTitle}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default HeroSection;
