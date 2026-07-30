import React, { useContext, useEffect, useRef, useState } from "react";
import { Context } from "../../main";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { GiHamburgerMenu } from "react-icons/gi";
import { FiLogOut, FiUser } from "react-icons/fi";
import Avatar from "./Avatar";
import { displayName, roleLabel } from "../../utils/avatar";

const Navbar = () => {
  const [show, setShow] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthorized, setIsAuthorized, user, setUser } = useContext(Context);
  const navigateTo = useNavigate();

  const menuRef = useRef(null);
  const triggerRef = useRef(null);

  // Dismiss on outside click and on Escape. A dropdown that can only be closed
  // by clicking the trigger again is a keyboard trap.
  useEffect(() => {
    if (!menuOpen) return;

    const onPointerDown = (e) => {
      if (
        menuRef.current?.contains(e.target) ||
        triggerRef.current?.contains(e.target)
      ) {
        return;
      }
      setMenuOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    // TPOs live in a different collection with their own logout handler. Both
    // clear the same cookie, so hitting the wrong one happened to work — but
    // only by accident.
    const endpoint =
      user?.role === "TPO" ? "/api/v1/tpo/logout" : "/api/v1/user/logout";

    try {
      const response = await axios.get(endpoint, { withCredentials: true });
      toast.success(response.data.message);
      setMenuOpen(false);
      setUser({});
      setIsAuthorized(false);
      navigateTo("/login");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not log out");
      setIsAuthorized(true);
    }
  };

  return (
    <nav className={isAuthorized ? "navbarShow" : "navbarHide"}>
      <div className="container">
        <div className="heading">
          <div className="logo">
            <img src="/nita.png" alt="logo" />
          </div>
          <div className="letter">
            National Institute of Technology Agartala
            <br /> राष्ट्रीय प्रौद्योगिकी संस्थान अगरतला
          </div>
        </div>
        <ul className={!show ? "menu" : "show-menu menu"}>
          <li>
            <Link to={"/"} onClick={() => setShow(false)}>
              HOME
            </Link>
          </li>
          <li>
            <Link to={"/job/getall"} onClick={() => setShow(false)}>
              ALL JOBS
            </Link>
          </li>
          <li>
            <Link to={"/applications/me"} onClick={() => setShow(false)}>
              {user && user?.role === "TNP"
                ? "STUDENT'S APPLICATIONS"
                : user?.role === "Student" ? "MY APPLICATIONS":
                "Pending TNPs"}
            </Link>
          </li>
          {user && user.role === "TNP" ? (
            <>
              <li>
                <Link to={"/job/post"} onClick={() => setShow(false)}>
                  POST NEW JOB
                </Link>
              </li>
              <li>
                <Link to={"/job/me"} onClick={() => setShow(false)}>
                  VIEW YOUR JOBS
                </Link>
              </li>
            </>
          ) : (
            <></>
          )}

        </ul>

        {/*
          The avatar deliberately lives OUTSIDE ul.menu. Below 1520px the
          existing responsive CSS slides .menu off-screen (position: fixed;
          left: -100%) behind the hamburger — anything inside it goes with it,
          which left the avatar sitting ~1300px to the left of the viewport and
          completely unclickable. Account access has to stay reachable at every
          width, so it sits in the always-visible action strip instead.
        */}
        <div className="nav_actions">
          <div className="account">
            <button
              type="button"
              ref={triggerRef}
              className="avatar_trigger"
              onClick={() => setMenuOpen((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label={`Account menu for ${displayName(user) || "your account"}`}
            >
              <Avatar user={user} size={44} />
            </button>

            {menuOpen && (
              <div className="account_menu" ref={menuRef} role="menu">
                <div className="account_menu_header">
                  <Avatar user={user} size={40} />
                  <div>
                    <p>{displayName(user) || "Your account"}</p>
                    <p>{user?.email}</p>
                    {user?.role && <span>{roleLabel(user.role)}</span>}
                  </div>
                </div>

                <Link
                  to="/profile"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    setShow(false);
                  }}
                >
                  <FiUser /> My Profile
                </Link>

                <button type="button" role="menuitem" onClick={handleLogout}>
                  <FiLogOut /> Logout
                </button>
              </div>
            )}
          </div>

          <div className="hamburger">
            <GiHamburgerMenu onClick={() => setShow(!show)} />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
