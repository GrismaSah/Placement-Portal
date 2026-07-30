import { useContext, useState, useEffect } from "react";
import { MdOutlineMailOutline } from "react-icons/md";
import { RiLock2Fill } from "react-icons/ri";
import { Link, Navigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { Context } from "../../main";
import nitaLogo from "../../../public/nita.png";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [showVerification, setShowVerification] = useState(false);
  const [timer, setTimer] = useState(0);

  const { isAuthorized, setIsAuthorized, setUser } = useContext(Context);

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
      setShowVerification(true);
      setTimer(60); // Set 60 seconds timer
    } catch (error) {
      toast.error(error.response?.data?.message || "An error occurred");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      if (!email || !password || !verificationCode) {
        toast.error("Please fill all fields");
        return;
      }

      const resp = await axios.post(
        "http://localhost:4000/api/v1/tpo/login",
        { email, password, verificationCode },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      const { data } = resp;
      if (data.user) {
        setUser(data.user);
        toast.success(data.message);
        setEmail("");
        setPassword("");
        setVerificationCode("");
        setIsAuthorized(true);
      } else {
        toast.error("Login failed");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "An error occurred");
    }
  };

  if (isAuthorized) {
    return <Navigate to={"/"} />;
  }

  return (
    <>
      <section className="authPage">
        <div className="container">
          <div className="header">
            <img src={nitaLogo} alt="logo" />
            <h3>Login as TPO</h3>
          </div>
          <form onSubmit={handleLogin}>
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
                  {timer > 0 ? `Wait ${timer}s` : showVerification ? "Resend Code" : "Send Code"}
                </button>
              </div>
            </div>

            <div className="inputTag">
              <label>Password</label>
              <div>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  required
                  onChange={(e) => setPassword(e.target.value)}
                />
                <RiLock2Fill />
              </div>
            </div>
            <button type="submit">Login</button>
            <Link className="forgot" to={"/forgot-password?role=tpo"}>
              Forgot Password?
            </Link>
            <p>
              Don't have an account? <Link to={"/tpo/register"}>Sign Up</Link>
            </p>
          </form>
        </div>
      </section>
    </>
  );
};

export default Login;