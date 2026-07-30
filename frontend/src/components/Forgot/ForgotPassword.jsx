import React, { useEffect, useState } from "react";
import { MdOutlineMailOutline } from "react-icons/md";
import { RiLock2Fill } from "react-icons/ri";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import nitaLogo from "../../../public/nita.png";
import toast from "react-hot-toast";
import axios from "axios";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showVerification, setShowVerification] = useState(false);
  const [timer, setTimer] = useState(0);
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const role = searchParams.get("role");
  // console.log("role", role);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleSendVerification = async () => {
    try {
      if (!email) {
        toast.error("Please enter Email first!");
        return;
      }
      if (timer > 0) {
        toast.error(`Please wait ${timer} seconds before requesting new code`);
        return;
      }

      if (role === "tpo") {
        const resp = await axios.post(
          "http://localhost:4000/api/v1/tpo/generate-code",
          { email },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        toast.success(resp.data.message);
      } else {
        const resp = await axios.post(
          "http://localhost:4000/api/v1/user/generate-code",
          { email },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        toast.success(resp.data.message);
      }
      setTimer(60);
    } catch (error) {
      console.log("error", error);

      toast.error(error.response?.data?.message || "An error occurred");
    }
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    try {
      if (!email || !verificationCode) {
        toast.error("Please enter Email and Verification Code first!");
        return;
      }
      if (role === "tpo") {
        const resp = await axios.post(
          "http://localhost:4000/api/v1/tpo/forgot-password",
          { email, verificationCode },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        toast.success(resp.data.message);
      } else {
        const resp = await axios.post(
          "http://localhost:4000/api/v1/user/forgot-password",
          { email, verificationCode },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        toast.success(resp.data.message);
      }
      setShowVerification(true);
    } catch (error) {}
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    try {
      if (!password || !confirmPassword) {
        toast.error("Please enter New Password and Confirm Password first!");
        return;
      }
      if (role === "tpo") {
        const resp = await axios.post(
          "http://localhost:4000/api/v1/tpo/generate-new-password",
          { email, newPassword: password },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        toast.success(resp.data.message);
      } else {
        const resp = await axios.post(
          "http://localhost:4000/api/v1/user/generate-new-password",
          { email, newPassword: password },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        toast.success(resp.data.message);
      }
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setVerificationCode("");
      if (role === "tpo") {
        navigate("/tpo/login");
      } else {
        navigate("/login");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "An error occurred");
    }
  };

  return (
    <>
      <section className="authPage">
        <div className="container">
          <div className="header">
            <img src={nitaLogo} alt="logo" />
            <h3>Reset Password</h3>
          </div>
          {showVerification ? (
            <form onSubmit={handleChangePassword}>
              <div className="inputTag">
                <label>New Password</label>
                <div>
                  <input
                    type="password"
                    placeholder="Enter new password"
                    value={password}
                    required
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <RiLock2Fill />
                </div>
              </div>

              <div className="inputTag">
                <label>Confirm Password</label>
                <div>
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    required
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <RiLock2Fill />
                </div>
              </div>

              <button type="submit">Reset Password</button>
            </form>
          ) : (
            <form onSubmit={handleVerifyEmail}>
              <div className="inputTag">
                <label>Email Address</label>
                <div>
                  <input
                    type="email"
                    placeholder="example@email.com"
                    value={email}
                    required
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <MdOutlineMailOutline />
                </div>
              </div>

              <div className="inputTag">
                <label>Verification Code</label>
                <div>
                  <input
                    type="text"
                    placeholder="Enter verification code"
                    value={verificationCode}
                    required
                    onChange={(e) => setVerificationCode(e.target.value)}
                  />
                  <button type="button" onClick={handleSendVerification}>
                    {timer > 0
                      ? `Wait ${timer}s`
                      : showVerification
                      ? "Resend Code"
                      : "Send Code"}
                  </button>
                </div>
              </div>

              <button type="submit">Verify Email</button>
            </form>
          )}
        </div>
      </section>
    </>
  );
};

export default ForgotPassword;