import { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FiBriefcase,
  FiHash,
  FiLock,
  FiMail,
  FiMapPin,
  FiPhone,
  FiUser,
} from "react-icons/fi";
import { Context } from "../../main";
import { api, apiError } from "../../lib/api";
import { cn } from "../../lib/cn";
import { Button, Input } from "../ui";
import { BRAND } from "../../constants/brand";
import AuthLayout from "./AuthLayout";
import OtpInput from "./OtpInput";

/**
 * Account creation for students and recruiters.
 *
 * Placement Officer accounts are deliberately NOT self-service here. The old
 * /admin/register endpoint let anyone on the internet create an administrator
 * account with authority over every recruiter on the platform; removing the
 * route from the UI is the first half of closing that, and the endpoint itself
 * should be locked down before this ships publicly.
 */

const ROLES = [
  {
    value: "Student",
    label: "Student",
    icon: FiUser,
    blurb: "Apply to roles and track your applications.",
  },
  {
    value: "Recruiter",
    label: "Recruiter",
    icon: FiBriefcase,
    blurb: "Post openings and review applicants.",
  },
];

/** Cheap strength signal — length first, since that is what actually matters. */
function passwordStrength(pw) {
  if (!pw) return { score: 0, label: "" };
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (pw.length >= 12) score += 1;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score += 1;
  if (/\d/.test(pw)) score += 1;
  if (/[^\w\s]/.test(pw)) score += 1;

  const labels = ["Too short", "Weak", "Fair", "Good", "Strong", "Strong"];
  return { score, label: labels[score] };
}

const Register = () => {
  const { setUser, setIsAuthorized } = useContext(Context);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    enrollment: "",
    password: "",
    confirmPassword: "",
  });
  const [role, setRole] = useState("Student");
  const [step, setStep] = useState("details");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [cooldown, setCooldown] = useState(0);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const strength = passwordStrength(form.password);

  const validate = () => {
    const next = {};
    if (form.name.trim().length < 3) next.name = "Please enter at least 3 characters.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Enter a valid email address.";
    if (!/^\d{10,}$/.test(form.phone.replace(/\D/g, "")))
      next.phone = "Enter a valid phone number.";
    if (!form.address.trim()) next.address = "Address is required.";
    if (role === "Student") {
      if (!form.enrollment.trim()) {
        next.enrollment = "Your enrollment number is required.";
      } else if (!next.email) {
        // The server enforces this too (userController.js register()) — this
        // is just faster feedback than a round trip. Ties every student
        // account to the mailbox the university actually issued for that
        // enrollment number, so a personal address can't be used instead.
        const expected = `${form.enrollment.trim().toLowerCase()}@${BRAND.studentEmailDomain}`;
        if (form.email.trim().toLowerCase() !== expected) {
          next.email = `Use your official JAIN University email: ${expected}`;
        }
      }
    }
    if (form.password.length < 8) next.password = "Use at least 8 characters.";
    if (form.password !== form.confirmPassword)
      next.confirmPassword = "Passwords don't match.";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    // Validate before the request, so the user sees every problem at once
    // rather than one server error at a time.
    if (!validate()) return;

    setLoading(true);
    try {
      const { data } = await api.post("/api/v1/user/register", {
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        enrollment: form.enrollment,
        password: form.password,
        role,
      });
      toast.success(data.message || "Account created. Check your email.");
      setStep("verify");
      setCooldown(60);
    } catch (err) {
      toast.error(apiError(err, "Could not create your account."));
    } finally {
      setLoading(false);
    }
  };

  const verify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/api/v1/user/verify", {
        email: form.email,
        verificationCode: code,
      });
      toast.success("Welcome to JAIN Placements");
      // Store the user, not just the flag — see the note on finish() in
      // Login.jsx. App.jsx only fetches it on mount, so without this the new
      // account lands on the dashboard with no role until a hard refresh.
      setUser(data.user);
      setIsAuthorized(true);
      navigate("/app/dashboard", { replace: true });
    } catch (err) {
      toast.error(apiError(err, "That code was not accepted."));
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    try {
      await api.post("/api/v1/user/generate-code", { email: form.email });
      setCooldown(60);
      toast.success("A new code is on its way.");
    } catch (err) {
      toast.error(apiError(err, "Could not send a new code."));
    }
  };

  // ---- Verification step --------------------------------------------------
  if (step === "verify") {
    return (
      <AuthLayout
        title="Verify your email"
        subtitle={`We've sent a 6-digit code to ${form.email}.`}
      >
        <form onSubmit={verify} className="space-y-6">
          <OtpInput value={code} onChange={setCode} />

          <Button type="submit" fullWidth size="lg" loading={loading} disabled={code.length < 6}>
            Verify and continue
          </Button>

          <p className="text-center text-sm text-[var(--text-secondary)]">
            Didn&rsquo;t get it?{" "}
            <button
              type="button"
              onClick={resend}
              disabled={cooldown > 0}
              className="font-semibold text-[var(--brand)] hover:underline disabled:opacity-50"
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Send a new code"}
            </button>
          </p>
        </form>
      </AuthLayout>
    );
  }

  // ---- Details step -------------------------------------------------------
  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join the JAIN Placement Portal."
      footer={
        <>
          Already have an account?{" "}
          <Link
            to={role === "Recruiter" ? "/recruiter/login" : "/login"}
            className="font-semibold text-[var(--brand)] hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5">
        <div>
          <span className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
            I&rsquo;m joining as
          </span>
          <div role="radiogroup" aria-label="Account type" className="grid gap-2 sm:grid-cols-2">
            {ROLES.map(({ value, label, icon: Icon, blurb }) => {
              const active = role === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setRole(value)}
                  className={cn(
                    "rounded-[var(--radius-field)] border p-3.5 text-left transition-all",
                    active
                      ? "border-[var(--brand)] bg-[var(--brand-subtle)] shadow-[var(--shadow-xs)]"
                      : "border-[var(--border-strong)] hover:border-[var(--text-tertiary)]"
                  )}
                >
                  <span className="flex items-center gap-2 font-semibold text-[var(--text-primary)]">
                    <Icon aria-hidden="true" className="size-4" />
                    {label}
                  </span>
                  <span className="mt-1 block text-xs text-[var(--text-secondary)]">
                    {blurb}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <Input
          label="Full name"
          required
          value={form.name}
          onChange={set("name")}
          error={errors.name}
          autoComplete="name"
          leadingIcon={<FiUser className="size-4" />}
        />

        <Input
          label="Email"
          type="email"
          required
          value={form.email}
          onChange={set("email")}
          error={errors.email}
          autoComplete="email"
          placeholder={
            role === "Student"
              ? `enrollment@${BRAND.studentEmailDomain}`
              : "you@company.com"
          }
          hint={
            role === "Student"
              ? "Must be your official JAIN University email, matching your enrollment number."
              : undefined
          }
          leadingIcon={<FiMail className="size-4" />}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Phone"
            type="tel"
            required
            value={form.phone}
            onChange={set("phone")}
            error={errors.phone}
            autoComplete="tel"
            leadingIcon={<FiPhone className="size-4" />}
          />

          {role === "Student" && (
            <Input
              label="Enrollment number"
              required
              value={form.enrollment}
              onChange={set("enrollment")}
              error={errors.enrollment}
              placeholder="23BTRCN001"
              leadingIcon={<FiHash className="size-4" />}
            />
          )}
        </div>

        <Input
          label="Address"
          required
          value={form.address}
          onChange={set("address")}
          error={errors.address}
          autoComplete="street-address"
          leadingIcon={<FiMapPin className="size-4" />}
        />

        <div>
          <Input
            label="Password"
            type="password"
            required
            value={form.password}
            onChange={set("password")}
            error={errors.password}
            autoComplete="new-password"
            hint="At least 8 characters."
            leadingIcon={<FiLock className="size-4" />}
          />

          {form.password && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex flex-1 gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-colors",
                      i < strength.score
                        ? strength.score <= 2
                          ? "bg-[var(--color-danger-500)]"
                          : strength.score <= 3
                            ? "bg-[var(--color-warning-500)]"
                            : "bg-[var(--color-success-500)]"
                        : "bg-[var(--surface-active)]"
                    )}
                  />
                ))}
              </div>
              <span className="text-xs font-medium text-[var(--text-tertiary)]">
                {strength.label}
              </span>
            </div>
          )}
        </div>

        <Input
          label="Confirm password"
          type="password"
          required
          value={form.confirmPassword}
          onChange={set("confirmPassword")}
          error={errors.confirmPassword}
          autoComplete="new-password"
          leadingIcon={<FiLock className="size-4" />}
        />

        <Button type="submit" fullWidth size="lg" loading={loading}>
          Create account
        </Button>

        {role === "Recruiter" && (
          <p className="text-center text-xs text-[var(--text-tertiary)]">
            Recruiter accounts are reviewed by the Placement Office before postings go
            live.
          </p>
        )}
      </form>
    </AuthLayout>
  );
};

export default Register;
