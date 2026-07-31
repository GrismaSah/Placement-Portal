import { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FiBriefcase, FiCheckSquare, FiLock, FiMail, FiUser } from "react-icons/fi";
import { Context } from "../../main";
import { api, apiError } from "../../lib/api";
import { cn } from "../../lib/cn";
import { Button, Input } from "../ui";
import AuthLayout from "./AuthLayout";
import OtpInput from "./OtpInput";

/**
 * One sign-in screen for all three roles.
 *
 * Previously students and recruiters shared /login with a bare <select>, while
 * placement officers had an entirely separate /tpo/login page that most of
 * them had no way to discover. The segmented control makes the choice
 * explicit, and the role decides which endpoint is called.
 */

const ROLES = [
  { value: "Student", label: "Student", icon: FiUser },
  { value: "TNP", label: "Recruiter", icon: FiBriefcase },
  { value: "TPO", label: "Placement Officer", icon: FiCheckSquare },
];

const Login = () => {
  const { setIsAuthorized } = useContext(Context);
  const navigate = useNavigate();

  const [role, setRole] = useState("Student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState("credentials"); // credentials | verify
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const isTPO = role === "TPO";
  const base = isTPO ? "/api/v1/tpo" : "/api/v1/user";

  // Resend cooldown, so the button cannot be hammered.
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const finish = () => {
    setIsAuthorized(true);
    navigate("/app/dashboard", { replace: true });
  };

  const submitCredentials = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = isTPO
        ? { email, password, verificationCode: code }
        : { email, password, role };

      const { data } = await api.post(`${base}/login`, payload);

      // Recruiters and officers must supply a fresh code every sign-in, and an
      // unverified student is sent one automatically. In both cases the server
      // answers 200 without setting a cookie, so the presence of a user object
      // — not the status code — is what tells us we are actually signed in.
      if (data.user) {
        toast.success(data.message || "Signed in");
        finish();
      } else {
        setStep("verify");
        setCooldown(60);
        toast.success(data.message || "We've emailed you a verification code.");
      }
    } catch (err) {
      const message = apiError(err, "Could not sign in.");

      // A recruiter's code is cleared on use, so a second sign-in legitimately
      // needs a new one. Move them straight to the code step instead of
      // showing an error they cannot act on.
      if (/verification code/i.test(message) && !isTPO) {
        setStep("verify");
        setCooldown(0);
      }
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const submitCode = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isTPO || role === "TNP") {
        // These roles verify as part of logging in, not through /verify.
        const payload = isTPO
          ? { email, password, verificationCode: code }
          : { email, password, role, verificationCode: code };
        const { data } = await api.post(`${base}/login`, payload);
        if (!data.user) throw new Error("That code was not accepted.");
        toast.success("Signed in");
      } else {
        await api.post(`${base}/verify`, { email, verificationCode: code });
        toast.success("Email verified");
      }
      finish();
    } catch (err) {
      const message = apiError(err, "That code was not accepted.");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    try {
      await api.post(`${base}/generate-code`, { email });
      setCooldown(60);
      toast.success("A new code is on its way.");
    } catch (err) {
      toast.error(apiError(err, "Could not send a new code."));
    }
  };

  // ---- Code step ----------------------------------------------------------
  if (step === "verify") {
    return (
      <AuthLayout
        title="Check your email"
        subtitle={`We've sent a 6-digit code to ${email}. Enter it below to continue.`}
        footer={
          <button
            type="button"
            onClick={() => {
              setStep("credentials");
              setCode("");
              setError("");
            }}
            className="font-semibold text-[var(--brand)] hover:underline"
          >
            Use a different account
          </button>
        }
      >
        <form onSubmit={submitCode} className="space-y-6">
          <OtpInput value={code} onChange={setCode} error={error} />

          <Button type="submit" fullWidth size="lg" loading={loading} disabled={code.length < 6}>
            Verify and sign in
          </Button>

          <p className="text-center text-sm text-[var(--text-secondary)]">
            Didn&rsquo;t get it?{" "}
            <button
              type="button"
              onClick={resend}
              disabled={cooldown > 0}
              className="font-semibold text-[var(--brand)] hover:underline disabled:pointer-events-none disabled:opacity-50"
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Send a new code"}
            </button>
          </p>
        </form>
      </AuthLayout>
    );
  }

  // ---- Credentials step ---------------------------------------------------
  return (
    <AuthLayout
      title="Sign in"
      subtitle="Welcome back to the JAIN Placement Portal."
      footer={
        <>
          Don&rsquo;t have an account?{" "}
          <Link to="/register" className="font-semibold text-[var(--brand)] hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={submitCredentials} className="space-y-5">
        {/* Role picker */}
        <div>
          <span className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
            I&rsquo;m signing in as
          </span>
          <div
            role="radiogroup"
            aria-label="Account type"
            className="grid grid-cols-3 gap-1 rounded-[var(--radius-field)] bg-[var(--surface-hover)] p-1"
          >
            {ROLES.map(({ value, label, icon: Icon }) => {
              const active = role === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => {
                    setRole(value);
                    setError("");
                  }}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-[calc(var(--radius-field)-3px)] px-2 py-2.5",
                    "text-xs font-semibold transition-colors",
                    active
                      ? "bg-[var(--surface-raised)] text-[var(--text-primary)] shadow-[var(--shadow-xs)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  )}
                >
                  <Icon aria-hidden="true" className="size-4" />
                  <span className="text-center leading-tight">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <Input
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@jain.test"
          leadingIcon={<FiMail className="size-4" />}
        />

        <div>
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            leadingIcon={<FiLock className="size-4" />}
            error={error && !/verification/i.test(error) ? error : undefined}
          />
          <div className="mt-2 text-right">
            <Link
              to={`/forgot-password?role=${isTPO ? "tpo" : "user"}`}
              className="text-sm font-medium text-[var(--brand)] hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        {isTPO && (
          <div>
            <span className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
              Verification code
            </span>
            <OtpInput value={code} onChange={setCode} autoFocus={false} />
            <p className="mt-1.5 text-xs text-[var(--text-tertiary)]">
              Placement Officer accounts require a code at every sign-in.{" "}
              <button
                type="button"
                onClick={resend}
                disabled={cooldown > 0 || !email}
                className="font-medium text-[var(--brand)] hover:underline disabled:opacity-50"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Send me one"}
              </button>
            </p>
          </div>
        )}

        <Button type="submit" fullWidth size="lg" loading={loading}>
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
};

export default Login;
