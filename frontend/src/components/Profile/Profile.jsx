import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Navigate } from "react-router-dom";
import { Context } from "../../main";
import Avatar from "../Layout/Avatar";
import { displayName, roleLabel } from "../../utils/avatar";
import ResumeSection from "./ResumeSection";
import { getSocket } from "../../socket";

const isTPO = (user) => user?.role === "TPO";

const emptyDetails = {
  name: "",
  firstname: "",
  lastname: "",
  phone: "",
  address: "",
  enrollment: "",
};

const Profile = () => {
  const { isAuthorized, user, setUser, authChecked } = useContext(Context);

  const [details, setDetails] = useState(emptyDetails);
  const [errors, setErrors] = useState({});
  const [savingDetails, setSavingDetails] = useState(false);

  const [passwords, setPasswords] = useState({ oldPassword: "", newPassword: "", confirm: "" });
  const [savingPassword, setSavingPassword] = useState(false);

  const [resume, setResume] = useState(null);

  // Load the resume, then keep it live. The server pushes resume:updated to this
  // user's own room, so an edit on another device lands here without a refresh.
  useEffect(() => {
    if (user?.role !== "Student") return;

    let cancelled = false;
    axios
      .get("/api/v1/resume/me", { withCredentials: true })
      .then((res) => {
        if (!cancelled) setResume(res.data.resume);
      })
      .catch(() => {});

    const socket = getSocket();
    const onResumeUpdated = (updated) => setResume(updated);
    socket.on("resume:updated", onResumeUpdated);

    return () => {
      cancelled = true;
      socket.off("resume:updated", onResumeUpdated);
    };
  }, [user?.role, user?._id]);

  // Re-seed the form whenever the canonical user changes — including when a
  // socket push arrives from this user's other device.
  useEffect(() => {
    if (!user?._id) return;
    setDetails({
      name: user.name ?? "",
      firstname: user.firstname ?? "",
      lastname: user.lastname ?? "",
      phone: user.phone != null ? String(user.phone) : "",
      address: user.address ?? "",
      enrollment: user.enrollment ?? "",
    });
  }, [user]);

  // Wait for the auth check before deciding. Redirecting on isAuthorized alone
  // bounces a logged-in user to /login (and onward to /) whenever they load or
  // refresh this URL directly, because it starts false.
  if (!authChecked) {
    return (
      <section className="profile page">
        <div className="container">
          <p className="result_count">Loading your profile…</p>
        </div>
      </section>
    );
  }

  if (!isAuthorized) {
    return <Navigate to={"/login"} />;
  }

  const setField = (field) => (e) => {
    setDetails((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // Mirrors the server-side schema so users see problems before a round trip.
  const validateDetails = () => {
    const next = {};

    if (isTPO(user)) {
      if (!details.firstname.trim()) next.firstname = "First name is required.";
      if (!details.lastname.trim()) next.lastname = "Last name is required.";
    } else {
      const name = details.name.trim();
      if (name.length < 3) next.name = "Name must be at least 3 characters.";
      else if (name.length > 30) next.name = "Name cannot exceed 30 characters.";
      if (!details.address.trim()) next.address = "Address is required.";
    }

    const phone = details.phone.trim();
    if (!phone) next.phone = "Phone number is required.";
    else if (!/^\d{6,15}$/.test(phone)) next.phone = "Enter a valid phone number (digits only).";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const saveDetails = async (e) => {
    e.preventDefault();
    if (!validateDetails()) return;

    const endpoint = isTPO(user)
      ? "/api/v1/tpo/update-profile"
      : "/api/v1/user/update-profile";

    const payload = isTPO(user)
      ? {
          firstname: details.firstname.trim(),
          lastname: details.lastname.trim(),
          phone: details.phone.trim(),
        }
      : {
          name: details.name.trim(),
          phone: Number(details.phone.trim()),
          address: details.address.trim(),
          ...(user.role === "Student" ? { enrollment: details.enrollment.trim() } : {}),
        };

    try {
      setSavingDetails(true);
      const res = await axios.put(endpoint, payload, { withCredentials: true });
      // Render the server's saved record, never the local form state.
      setUser(res.data.user);
      toast.success(res.data.message || "Profile updated.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not update profile.");
    } finally {
      setSavingDetails(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();

    if (passwords.newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    if (passwords.newPassword !== passwords.confirm) {
      toast.error("New passwords do not match.");
      return;
    }

    const endpoint = isTPO(user)
      ? "/api/v1/tpo/update-password"
      : "/api/v1/user/update-password";

    try {
      setSavingPassword(true);
      const res = await axios.post(
        endpoint,
        { oldPassword: passwords.oldPassword, newPassword: passwords.newPassword },
        { withCredentials: true }
      );
      toast.success(res.data.message || "Password updated.");
      setPasswords({ oldPassword: "", newPassword: "", confirm: "" });
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not update password.");
    } finally {
      setSavingPassword(false);
    }
  };

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <section className="profile page">
      <div className="container">
        <header className="profile_header">
          <Avatar user={user} size={92} />
          <div className="profile_identity">
            <h2>{displayName(user) || "Your account"}</h2>
            <p>{user?.email}</p>
            <div className="badges">
              {user?.role && <span className="badge role">{roleLabel(user.role)}</span>}
              {user?.role === "TNP" && user?.status && (
                <span className={`badge status ${String(user.status).toLowerCase()}`}>
                  {user.status}
                </span>
              )}
              {memberSince && <span className="badge muted">Member since {memberSince}</span>}
            </div>
          </div>
        </header>

        <div className="profile_panels">
          <form className="panel" onSubmit={saveDetails}>
            <h3>Account Details</h3>

            {isTPO(user) ? (
              <>
                <label>
                  First Name
                  <input type="text" value={details.firstname} onChange={setField("firstname")} />
                  {errors.firstname && <small>{errors.firstname}</small>}
                </label>
                <label>
                  Last Name
                  <input type="text" value={details.lastname} onChange={setField("lastname")} />
                  {errors.lastname && <small>{errors.lastname}</small>}
                </label>
              </>
            ) : (
              <label>
                Full Name
                <input type="text" value={details.name} onChange={setField("name")} />
                {errors.name && <small>{errors.name}</small>}
              </label>
            )}

            <label>
              Email Address
              <input type="email" value={user?.email ?? ""} disabled />
              <small className="hint">
                Email is your login identity and cannot be changed here.
              </small>
            </label>

            {user?.role === "Student" && (
              <label>
                Enrollment Number
                <input
                  type="text"
                  value={details.enrollment}
                  onChange={setField("enrollment")}
                  placeholder="e.g. 23BTRCN001"
                />
              </label>
            )}

            <label>
              Phone Number
              <input type="tel" value={details.phone} onChange={setField("phone")} />
              {errors.phone && <small>{errors.phone}</small>}
            </label>

            {!isTPO(user) && (
              <label>
                Address
                <input type="text" value={details.address} onChange={setField("address")} />
                {errors.address && <small>{errors.address}</small>}
              </label>
            )}

            <button type="submit" disabled={savingDetails}>
              {savingDetails ? "Saving…" : "Save Changes"}
            </button>
          </form>

          <form className="panel" onSubmit={changePassword}>
            <h3>Change Password</h3>

            <label>
              Current Password
              <input
                type="password"
                value={passwords.oldPassword}
                onChange={(e) =>
                  setPasswords((p) => ({ ...p, oldPassword: e.target.value }))
                }
                required
              />
            </label>
            <label>
              New Password
              <input
                type="password"
                value={passwords.newPassword}
                onChange={(e) =>
                  setPasswords((p) => ({ ...p, newPassword: e.target.value }))
                }
                required
              />
              <small className="hint">At least 8 characters.</small>
            </label>
            <label>
              Confirm New Password
              <input
                type="password"
                value={passwords.confirm}
                onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
                required
              />
            </label>

            <button type="submit" disabled={savingPassword}>
              {savingPassword ? "Updating…" : "Update Password"}
            </button>
          </form>
        </div>

        {user?.role === "Student" && (
          <ResumeSection resume={resume} setResume={setResume} />
        )}
      </div>
    </section>
  );
};

export default Profile;
