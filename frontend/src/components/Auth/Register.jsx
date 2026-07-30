import { useContext, useState, useEffect } from "react";
import { FaPhone, FaRegUser } from "react-icons/fa";
import { MdOutlineMailOutline } from "react-icons/md";
import { RiLock2Fill } from "react-icons/ri";
import { FaPencilAlt } from "react-icons/fa";
import { FaLocationPin } from "react-icons/fa6";
import { Link, Navigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { Context } from "../../main";

const Register = () => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [enrollment, setEnrollment] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [timer, setTimer] = useState(0);

  const [verify, setVerify] = useState(false);
  const { isAuthorized, setIsAuthorized } = useContext(Context);
  const [loader, setLoader] = useState(false);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }
    setLoader(true);
    try {
      const { data } = await axios.post(
        "http://localhost:4000/api/v1/user/register",
        { name, phone, email, role, password, enrollment, address },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );
      toast.success(data.message);
      setVerify(true);
      setTimer(60);
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      setLoader(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(
        "http://localhost:4000/api/v1/user/verify",
        { email, verificationCode },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );
      toast.success(data.message);
      setAddress("");
      setEmail("");
      setName("");
      setPhone("");
      setPassword("");
      setConfirmPassword("");
      setRole("");
      setEnrollment("");
      setIsAuthorized(true);
    } catch (error) {
      toast.error(error.response.data.message);
    }
  };
  const handleResendCode = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(
        "http://localhost:4000/api/v1/user/generate-code",
        { email },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );
      toast.success(data.message);
      setTimer(60);
    } catch (error) {
      toast.error(error.response.data.message);
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
            <img src="./nita.png" alt="logo" />
            <h3>Create a new account</h3>
          </div>
          {verify ? (
            <div className="">
              <p>
                Please enter the verification code sent to your <br /> email
                address.
              </p>
              <br />
              <br />
              <form>
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
                <button type="submit" onClick={handleVerify}>
                  Verify Code
                </button>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={timer > 0}
                >
                  {timer > 0 ? `Resend Code (${timer}s)` : "Resend Code"}
                </button>
              </form>
            </div>
          ) : (
            <form>
              <div className="inputTag">
                <label>Register As</label>
                <div>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="" disabled>
                      Select Role
                    </option>
                    <option value="TNP">TNPs</option>
                    <option value="Student">Students</option>
                  </select>
                  <FaRegUser />
                </div>
              </div>
              <div className="inputTag">
                <label>Name</label>
                <div>
                  <input
                    type="text"
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                  <FaPencilAlt />
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
              <div className="inputTag">
                <label>Phone Number</label>
                <div>
                  <input
                    type="tel"
                    placeholder="98XXXXXXXX"
                    title="Please enter a valid phone number"
                    pattern="[6789][0-9]{9}"
                    value={phone}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^[0-9]{0,10}$/.test(value)) {
                        setPhone(value);
                      }
                    }}
                    required
                  />

                  <FaPhone />
                </div>
              </div>
              {role === "Student" && (
                <div className="inputTag">
                  <label>Enrollment Number</label>
                  <div>
                    <input
                      type="text"
                      placeholder="Enter Enrollment number"
                      value={enrollment}
                      onChange={(e) => setEnrollment(e.target.value)}
                      required
                    />
                    <FaPencilAlt />
                  </div>
                </div>
              )}
              <div className="inputTag">
                <label>Address</label>
                <div>
                  <input
                    type="text"
                    placeholder="Enter your address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  />
                  <FaLocationPin />
                </div>
              </div>
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
              <div className="inputTag">
                <label>Confirm Password</label>
                <div>
                  <input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <RiLock2Fill />
                </div>
              </div>
              <button type="submit" onClick={handleRegister} disabled={loader}>
                {loader ? "Loading..." : "Register"}
              </button>
              <p>
                Already have an account? <Link to={"/login"}>Login</Link>
              </p>
            </form>
          )}
        </div>
      </section>
    </>
  );
};

export default Register;
