import React, { useContext } from "react";
import { Context } from "../../main";
import { Link } from "react-router-dom";
import { FaFacebookF, FaYoutube, FaLinkedin } from "react-icons/fa";
import { RiInstagramFill } from "react-icons/ri";

const Footer = () => {
  const { isAuthorized } = useContext(Context);
  return (
    <footer className={isAuthorized ? "footerShow" : "footerHide"}>
      <div className="footer-content">
        <div className="footer-section">
          <h3>About Us</h3>
          <p>
          Our mission is to streamline the placement process, providing a seamless and efficient platform for students, recruiters, and college administrators to achieve their goals effortlessly.
          </p>
        </div>
        <div className="footer-section">
          <h3>Quick Links</h3>
          <ul>
            <li>
              <a
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              >
                Home
              </a>
            </li>
            <li>
              <Link to="https://nita.ac.in/UserPanel/DisplayPage.aspx?page=c&ItemID=m">
                About
              </Link>
            </li>
            <li>
              <Link to="https://nita.ac.in/">Contact</Link>
            </li>
          </ul>
        </div>
        <div className="footer-section">
          <h3>Connect With Us</h3>
          <div className="social-links">
            <a href="https://www.facebook.com/profile.php?id=61564880039705">
              <FaFacebookF />
            </a>
            <a href="https://www.instagram.com/nitagartalaofficial">
              <RiInstagramFill />
            </a>
            <a href="https://www.youtube.com/@nitagartalaofficialchannel2272">
              <FaYoutube />
            </a>
            <a href="https://www.linkedin.com/school/national-institute-of-technology-agartala">
              <FaLinkedin />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;