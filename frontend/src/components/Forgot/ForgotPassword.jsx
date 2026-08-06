import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { FiLock, FiMail } from "react-icons/fi";
import { api, apiError } from "../../lib/api";
import { Button, Input } from "../ui";
import AuthLayout from "../Auth/AuthLayout";
import OtpInput from "../Auth/OtpInput";

/**
 * Password reset, in three steps: identify → code → new password.
 *
 * The verification code is now sent with the final request as well as checked
 * on step two. That matters: the reset endpoint used to accept
 * { email, newPassword } with no proof of ownership at all, so anyone who knew
 * an address could take over the account — and nothing obliged a caller to
 * make the step-two request first.
 */
const ForgotPassword = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const roleParam = params.get("role");
  const isTPO = roleParam === "tpo";
  const base = isTPO ? "/api/v1/tpo" : "/api/v1/user";
  // Where "back to sign in" goes once the reset is done — the account types
  // live on different, unlinked login routes now (see Login.jsx), so this
  // has to route back to the same scoped page the reset was started from.
  const loginPath =
    roleParam === "tpo"
      ? "/placement-office/login"
      : roleParam === "tnp"
        ? "/recruiter/login"
        : "/login";

  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const sendCode = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post(`${base}/generate-code`, { email });
      toast.success("We've emailed you a reset code.");
      setStep("code");
      setCooldown(60);
    } catch (err) {
      const message = apiError(err, "Could not send a code to that address.");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const checkCode = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post(`${base}/forgot-password`, { email, verificationCode: code });
      setStep("password");
    } catch (err) {
      // A wrong code now returns 400 rather than hanging the request forever,
      // so this branch is actually reachable.
      const message = apiError(err, "That code was not correct.");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const setNewPassword = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      await api.post(`${base}/generate-new-password`, {
        email,
        newPassword: password,
        // Required by the server now — the code is the only proof of ownership
        // this flow has.
        verificationCode: code,
      });
      toast.success("Password updated. You can sign in now.");
      navigate(loginPath, { replace: true });
    } catch (err) {
      const message = apiError(err, "Could not update your password.");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <>
      Remembered it?{" "}
      <Link to={loginPath} className="font-semibold text-[var(--brand)] hover:underline">
        Back to sign in
      </Link>
    </>
  );

  if (step === "code") {
    return (
      <AuthLayout
        title="Enter your reset code"
        subtitle={`We've sent a 6-digit code to ${email}.`}
        footer={footer}
      >
        <form onSubmit={checkCode} className="space-y-6">
          <OtpInput value={code} onChange={setCode} error={error} />

          <Button type="submit" fullWidth size="lg" loading={loading} disabled={code.length < 6}>
            Continue
          </Button>

          <p className="text-center text-sm text-[var(--text-secondary)]">
            <button
              type="button"
              onClick={sendCode}
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

  if (step === "password") {
    return (
      <AuthLayout
        title="Choose a new password"
        subtitle="Make it at least 8 characters."
        footer={footer}
      >
        <form onSubmit={setNewPassword} className="space-y-5">
          <Input
            label="New password"
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leadingIcon={<FiLock className="size-4" />}
          />
          <Input
            label="Confirm new password"
            type="password"
            required
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            error={error}
            leadingIcon={<FiLock className="size-4" />}
          />

          <Button type="submit" fullWidth size="lg" loading={loading}>
            Update password
          </Button>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we'll send you a code to reset it."
      footer={footer}
    >
      <form onSubmit={sendCode} className="space-y-5">
        <Input
          label="Email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error}
          placeholder="you@jain.test"
          leadingIcon={<FiMail className="size-4" />}
        />

        <Button type="submit" fullWidth size="lg" loading={loading}>
          Send reset code
        </Button>
      </form>
    </AuthLayout>
  );
};

export default ForgotPassword;
