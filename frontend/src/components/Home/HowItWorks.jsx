import React from "react";
import { FaUserPlus } from "react-icons/fa";
import { MdFindInPage } from "react-icons/md";
import { IoMdSend } from "react-icons/io";

const HowItWorks = () => {
  return (
    <>
      <div className="howitworks">
        <div className="container">
          <h3>Path to Success: Getting Your Dream Job</h3>
          <div className="banner">
            <div className="card">
              <FaUserPlus />
              <p>Skill Development</p>
              <p>
                Continuously learn and upgrade your skills through education, certifications, and practical experience.
              </p>
            </div>
            <div className="card">
              <MdFindInPage />
              <p>Dedication & Hard Work</p>
              <p>
                Put in consistent effort, maintain a strong work ethic, and stay focused on your career goals.
              </p>
            </div>
            <div className="card">
              <IoMdSend />
              <p>Professional Growth</p>
              <p>
                Network actively, seek mentorship, gain relevant experience, and maintain a positive attitude.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HowItWorks;