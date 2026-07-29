import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Salad, ArrowRight, AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../lib/auth-context";
import { PasswordInput } from "../components/auth/password-input";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — RP Nutrition" },
      { name: "description", content: "Set a new password for your RP Nutrition account." },
    ],
  }),
  component: ResetPassword,
});

function validatePassword(password: string): string | undefined {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(password)) return "Must contain at least one uppercase letter.";
  if (!/[a-z]/.test(password)) return "Must contain at least one lowercase letter.";
  if (!/[0-9]/.test(password)) return "Must contain at least one number.";
  return undefined;
}

function ResetPassword() {
  const nav = useNavigate();
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPasswordError("");
    setConfirmError("");

    const pwError = validatePassword(password);
    if (pwError) {
      setPasswordError(pwError);
      return;
    }

    if (password !== confirmPassword) {
      setConfirmError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error: authError } = await updatePassword(password);
    setLoading(false);

    if (authError) {
      setError(authError.message);
    } else {
      setSuccess(true);
      setTimeout(() => nav({ to: "/login" }), 3000);
    }
  };

  if (success) {
    return (
      <div className="grid min-h-screen place-items-center px-4 py-12">
        <div className="w-full max-w-md rounded-3xl glass p-8 anim-fade-up text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success/15">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <h1 className="mt-6 text-2xl font-semibold tracking-tight">Password updated!</h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Your password has been successfully reset. Redirecting to login...
          </p>
          <Link
            to="/login"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:brightness-110"
          >
            Go to Login <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen place-items-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl glass p-8 anim-fade-up">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/15 text-primary">
            <Salad className="h-4 w-4" />
          </span>
          <span className="font-display text-lg font-semibold">RP Nutrition</span>
        </div>

        <div className="mt-8 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Reset password</h1>
            <p className="text-sm text-muted-foreground">Choose a strong new password.</p>
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <PasswordInput
            label="New Password"
            value={password}
            onChange={setPassword}
            placeholder="At least 8 characters"
            error={passwordError}
          />

          <PasswordInput
            label="Confirm New Password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Re-enter your new password"
            error={confirmError}
          />

          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-3">
            <p className="text-xs text-muted-foreground font-medium mb-2">Password requirements:</p>
            <ul className="space-y-1">
              {[
                { label: "At least 8 characters", met: password.length >= 8 },
                { label: "One uppercase letter", met: /[A-Z]/.test(password) },
                { label: "One lowercase letter", met: /[a-z]/.test(password) },
                { label: "One number", met: /[0-9]/.test(password) },
              ].map((req) => (
                <li key={req.label} className={`flex items-center gap-2 text-xs ${req.met ? "text-success" : "text-muted-foreground"}`}>
                  <div className={`h-1.5 w-1.5 rounded-full ${req.met ? "bg-success" : "bg-muted-foreground/40"}`} />
                  {req.label}
                </li>
              ))}
            </ul>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : (
              "Update Password"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}