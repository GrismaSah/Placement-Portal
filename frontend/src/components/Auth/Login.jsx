import { useContext, useState, useEffect } from "react";
import { MdOutlineMailOutline } from "react-icons/md";
import { RiLock2Fill } from "react-icons/ri";
import { Link, Navigate } from "react-router-dom";
import { FaRegUser } from "react-icons/fa";
import axios from "axios";
import toast from "react-hot-toast";
import { Context } from "../../main";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [showVerification, setShowVerification] = useState(false);
  const [timer, setTimer] = useState(0);

  const { isAuthorized, setIsAuthorized } = useContext(Context);
  const [isStudentNotVerified, setIsStudentNotVerified] = useState(false);

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
        toast.error("Please enter email first");
        return;
      }
      
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
      setShowVerification(true);
      setTimer(60);
    } catch (error) {
      toast.error(error.response?.data?.message || "An error occurred");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      if (!email || !password || !role) {
        toast.error("Please fill all required fields");
        return;
      }

      if (role === "TNP" && !verificationCode) {
        toast.error("Please enter verification code");
        return;
      }

      const resp = await axios.post(
        "http://localhost:4000/api/v1/user/login",
        { email, password, role, verificationCode },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      const data = resp.data;
      toast.success(data.message);

      if(data.user.role === "Student" && !data.user.isVerified) {
        setIsStudentNotVerified(true);
      } else {
        setEmail("");
        setPassword("");
        setRole("");
        setVerificationCode("");
        setShowVerification(false);
        setIsAuthorized(true);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "An error occurred");
    }
  };

  const handleVerifyStudent = async (e) => {
    e.preventDefault();
    try {
      if (!verificationCode) {
        toast.error("Please enter verification code");
        return;
      }
      
      const resp = await axios.post(
        "http://localhost:4000/api/v1/user/verify",
        { email, verificationCode },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      toast.success(resp.data.message);
      setIsStudentNotVerified(false);
      setIsAuthorized(true);
    } catch (error) {
      toast.error(error.response?.data?.message || "An error occurred");
    }
  };

  if (isAuthorized) {
    return <Navigate to={"/"} />;
  }

  return (
    <section className="authPage">
      <div className="container">
        <div className="header">
          <img src="./nita.png" alt="logo" />
          <h3>Login to your account</h3>
        </div>
        {isStudentNotVerified ? (
          <div>
            <p>
              Please enter the verification code sent to your <br /> email
              address.
            </p>
            <br />
            <br />
            <form onSubmit={handleVerifyStudent}>
              <div className="inputTag">
                <label>Verification Code</label>
                <div>
                  <input
                    type="text"
                    placeholder="Enter verification code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    required
                  />
                  <MdOutlineMailOutline />
                </div>
              </div>
              <button type="submit">Verify Code</button>
              <button
                type="button"
                onClick={handleSendVerification}
                disabled={timer > 0}
              >
                {timer > 0 ? `Resend Code (${timer}s)` : "Resend Code"}
              </button>
            </form>
          </div>
        ) : (
          <form onSubmit={handleLogin}>
            <div className="inputTag">
              <label>Login As</label>
              <div>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                >
                  <option value="">Select Role</option>
                  <option value="TNP">TNPs</option>
                  <option value="Student">Students</option>
                </select>
                <FaRegUser />
              </div>
            </div>
            <div className="inputTag">
              <label>Email Address</label>
              <div>
                <input
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <MdOutlineMailOutline />
              </div>
            </div>

            {role === "TNP" && (
              <div className="inputTag">
                <label>Verification Code</label>
                <div>
                  <input
                    type="text"
                    placeholder="Enter verification code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    required
                  />
                  <button 
                    type="button" 
                    onClick={handleSendVerification}
                    disabled={timer > 0}
                  >
                    {timer > 0
                      ? `Resend Code (${timer}s)`
                      : showVerification
                      ? "Resend Code"
                      : "Send Code"}
                  </button>
                </div>
              </div>
            )}
            <div className="inputTag">
              <label>Password</label>
              <div>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <RiLock2Fill />
              </div>
            </div>
            <button type="submit">Login</button>
            <Link className="forgot" to={"/forgot-password?role=user"}>
              Forgot Password?
            </Link>
            <p>
              Don't have an account? <Link to={"/register"}>Sign Up</Link>
            </p>
          </form>
        )}
      </div>
    </section>
  );
};

export default Login;