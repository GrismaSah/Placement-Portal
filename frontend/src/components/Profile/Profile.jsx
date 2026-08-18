import { useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { FiLock, FiUser } from "react-icons/fi";
import { Context } from "../../main";
import { api, apiError } from "../../lib/api";
import { getSocket } from "../../socket";
import { displayName } from "../../utils/avatar";
import { isOfficer, isStudent, roleLabelLong } from "../../lib/roles";
import PageHeader from "../Layout/PageHeader";
import { Avatar, Badge, Button, Card, CardHeader, Input, Tabs } from "../ui";
import ResumeSection from "./ResumeSection";

/**
 * Account settings, and — for students — the resume builder.
 *
 * Admin records live in a separate collection with firstname/lastname instead of
 * a single name, and their own update endpoint, so both shapes are handled
 * here rather than in two near-identical screens.
 */
const Profile = () => {
  const { user, setUser } = useContext(Context);

  const { pathname } = useLocation();

  // /app/profile and /app/resume render this same component, so the opening tab
  // has to come from the route rather than the role alone.
  const [tab, setTab] = useState(
    pathname.endsWith("/resume")
      ? "resume"
      : pathname.endsWith("/profile")
        ? "details"
        : isStudent(user) ? "resume" : "details"
  );
  const [details, setDetails] = useState({
    name: "",
    firstname: "",
    lastname: "",
    phone: "",
    address: "",
    enrollment: "",
    branch: "",
    batch: "",
    cgpa: "",
  });
  const [passwords, setPasswords] = useState({
    oldPassword: "",
    newPassword: "",
    confirm: "",
  });
  const [savingDetails, setSavingDetails] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [resume, setResume] = useState(null);

  const officer = isOfficer(user);
  const student = isStudent(user);

  // Load the resume, then keep it live. The server pushes resume:updated to
  // this user's own room, so an edit on another device lands here.
  useEffect(() => {
    if (!student) return;

    let cancelled = false;
    api
      .get("/api/v1/resume/me")
      .then(({ data }) => !cancelled && setResume(data.resume))
      .catch(() => {});

    const socket = getSocket();
    const onResumeUpdated = (updated) => setResume(updated);
    socket.on("resume:updated", onResumeUpdated);

    return () => {
      cancelled = true;
      socket.off("resume:updated", onResumeUpdated);
    };
  }, [student, user?._id]);

  // Re-seed whenever the canonical user changes, including on a socket push.
  useEffect(() => {
    if (!user?._id) return;
    setDetails({
      name: user.name ?? "",
      firstname: user.firstname ?? "",
      lastname: user.lastname ?? "",
      phone: user.phone != null ? String(user.phone) : "",
      address: user.address ?? "",
      enrollment: user.enrollment ?? "",
      branch: user.branch ?? "",
      batch: user.batch != null ? String(user.batch) : "",
      cgpa: user.cgpa != null ? String(user.cgpa) : "",
    });
  }, [user]);

  const set = (key) => (e) => setDetails((d) => ({ ...d, [key]: e.target.value }));

  const saveDetails = async (e) => {
    e.preventDefault();
    setSavingDetails(true);

    const endpoint = officer ? "/api/v1/admin/update-profile" : "/api/v1/user/update-profile";
    const payload = officer
      ? {
          firstname: details.firstname,
          lastname: details.lastname,
          phone: details.phone,
        }
      : {
          name: details.name,
          phone: details.phone,
          address: details.address,
          enrollment: details.enrollment,
          ...(student && {
            branch: details.branch || undefined,
            batch: details.batch ? Number(details.batch) : undefined,
            cgpa: details.cgpa ? Number(details.cgpa) : undefined,
          }),
        };

    try {
      const { data } = await api.put(endpoint, payload);
      if (data.user) setUser(data.user);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(apiError(err, "Could not save your profile."));
    } finally {
      setSavingDetails(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirm) {
      toast.error("New passwords don't match.");
      return;
    }
    if (passwords.newPassword.length < 8) {
      toast.error("Use at least 8 characters.");
      return;
    }

    setSavingPassword(true);
    const endpoint = officer ? "/api/v1/admin/update-password" : "/api/v1/user/update-password";

    try {
      await api.post(endpoint, {
        oldPassword: passwords.oldPassword,
        newPassword: passwords.newPassword,
      });
      setPasswords({ oldPassword: "", newPassword: "", confirm: "" });
      toast.success("Password updated");
    } catch (err) {
      toast.error(apiError(err, "Could not update your password."));
    } finally {
      setSavingPassword(false);
    }
  };

  const tabs = [
    ...(student ? [{ value: "resume", label: "Resume" }] : []),
    { value: "details", label: "Profile" },
    { value: "security", label: "Security" },
  ];

  return (
    <>
      <PageHeader title="Your account" />

      {/* Identity banner */}
      <Card className="mb-6 bg-brand-gradient border-transparent text-white">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar user={user} size={64} ring />
          <div className="min-w-0">
            <p className="text-xl font-bold tracking-tight">
              {displayName(user) || "Your account"}
            </p>
            <p className="truncate text-sm text-white/70">{user?.email}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge tone="accent" size="sm">
                {roleLabelLong(user?.role)}
              </Badge>
              {user?.status && (
                <Badge
                  size="sm"
                  tone={
                    user.status === "Approved"
                      ? "success"
                      : user.status === "Declined"
                        ? "danger"
                        : "warning"
                  }
                >
                  {user.status}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Tabs
        ariaLabel="Account sections"
        value={tab}
        onChange={setTab}
        items={tabs}
        className="mb-6"
      />

      {tab === "resume" && student && (
        <ResumeSection resume={resume} onChange={setResume} />
      )}

      {tab === "details" && (
        <Card className="max-w-2xl">
          <CardHeader
            title="Profile"
            description="This is what recruiters see on your applications."
          />
          <form onSubmit={saveDetails} className="space-y-5">
            {officer ? (
              <div className="grid gap-5 sm:grid-cols-2">
                <Input
                  label="First name"
                  value={details.firstname}
                  onChange={set("firstname")}
                  leadingIcon={<FiUser className="size-4" />}
                />
                <Input label="Last name" value={details.lastname} onChange={set("lastname")} />
              </div>
            ) : (
              <Input
                label="Full name"
                value={details.name}
                onChange={set("name")}
                leadingIcon={<FiUser className="size-4" />}
              />
            )}

            <Input label="Email" value={user?.email ?? ""} disabled hint="Email cannot be changed." />

            <Input label="Phone" type="tel" value={details.phone} onChange={set("phone")} />

            {!officer && (
              <Input label="Address" value={details.address} onChange={set("address")} />
            )}

            {student && (
              <>
                <Input
                  label="Enrollment number"
                  value={details.enrollment}
                  onChange={set("enrollment")}
                />
                <div className="grid gap-5 sm:grid-cols-3">
                  <Input label="Branch" value={details.branch} onChange={set("branch")} />
                  <Input
                    label="Graduating year"
                    type="number"
                    value={details.batch}
                    onChange={set("batch")}
                    placeholder="2027"
                  />
                  <Input
                    label="CGPA"
                    type="number"
                    step="0.01"
                    min={0}
                    max={10}
                    value={details.cgpa}
                    onChange={set("cgpa")}
                  />
                </div>
              </>
            )}

            <div className="flex justify-end">
              <Button type="submit" loading={savingDetails}>
                Save changes
              </Button>
            </div>
          </form>
        </Card>
      )}

      {tab === "security" && (
        <Card className="max-w-2xl">
          <CardHeader title="Change password" description="Use at least 8 characters." />
          <form onSubmit={savePassword} className="space-y-5">
            <Input
              label="Current password"
              type="password"
              required
              autoComplete="current-password"
              value={passwords.oldPassword}
              onChange={(e) => setPasswords((p) => ({ ...p, oldPassword: e.target.value }))}
              leadingIcon={<FiLock className="size-4" />}
            />
            <Input
              label="New password"
              type="password"
              required
              autoComplete="new-password"
              value={passwords.newPassword}
              onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
              leadingIcon={<FiLock className="size-4" />}
            />
            <Input
              label="Confirm new password"
              type="password"
              required
              autoComplete="new-password"
              value={passwords.confirm}
              onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
              leadingIcon={<FiLock className="size-4" />}
            />
            <div className="flex justify-end">
              <Button type="submit" loading={savingPassword}>
                Update password
              </Button>
            </div>
          </form>
        </Card>
      )}
    </>
  );
};

export default Profile;
