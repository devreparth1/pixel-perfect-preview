import { createFileRoute, Link } from "@tanstack/react-router";
import { Salad, ArrowLeft, Mail, AlertCircle, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../lib/auth-context";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot Password — RP Nutrition" },
      { name: "description", content: "Reset your RP Nutrition account password." },
    ],
  }),
  component: ForgotPassword,
});

function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    const { error: authError } = await resetPassword(email);
    setLoading(false);

    if (authError) {
      setError(authError.message);
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div className="grid min-h-screen place-items-center px-4 py-12">
        <div className="w-full max-w-md rounded-3xl glass p-8 anim-fade-up text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success/15">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <h1 className="mt-6 text-2xl font-semibold tracking-tight">Check your email</h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Password reset email has been sent to{" "}
            <span className="text-foreground font-medium">{email}</span>.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Click the link in the email to reset your password.
          </p>
          <Link
            to="/login"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:brightness-110"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen place-items-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl glass p-8 anim-fade-up">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to login
        </Link>

        <div className="mt-6 flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/15 text-primary">
            <Salad className="h-4 w-4" />
          </span>
          <span className="font-display text-lg font-semibold">RP Nutrition</span>
        </div>

        <h1 className="mt-8 text-3xl font-semibold tracking-tight">Forgot password?</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your email and we'll send you a reset link.
        </p>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Email Address</span>
            <div className="relative mt-2">
              <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 pl-11 text-sm outline-none placeholder:text-muted-foreground/60 focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : (
              "Send Reset Link"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}