import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Salad, ArrowRight, Mail, AlertCircle, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../lib/auth-context";
import { PasswordInput } from "../components/auth/password-input";
import { GoogleButton } from "../components/auth/google-button";
import { AuthLoading } from "../components/auth/auth-loading";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — RP Nutrition" },
      { name: "description", content: "Log in to your RP Nutrition AI coach." },
      { property: "og:title", content: "Login — RP Nutrition" },
      { property: "og:description", content: "Log in to your AI nutrition coach." },
    ],
  }),
  component: Login,
});

function Login() {
  const nav = useNavigate();
  const { signIn, user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailNotVerified, setEmailNotVerified] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      nav({ to: "/app" });
    }
  }, [user, authLoading, nav]);

  if (authLoading) return <AuthLoading />;
  if (user) return <AuthLoading />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setEmailNotVerified(false);

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    const { error: authError } = await signIn(email, password);
    setLoading(false);

    if (authError) {
      if (authError.message.toLowerCase().includes("email not confirmed")) {
        setEmailNotVerified(true);
      } else if (authError.message.toLowerCase().includes("invalid login credentials")) {
        setError("Invalid email or password. Please try again.");
      } else {
        setError(authError.message);
      }
    } else {
      nav({ to: "/app" });
    }
  };

  return (
    <div className="grid min-h-screen place-items-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl glass p-8 anim-fade-up">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/15 text-primary">
            <Salad className="h-4 w-4" />
          </span>
          <span className="font-display text-lg font-semibold">RP Nutrition</span>
        </Link>

        <h1 className="mt-8 text-3xl font-semibold tracking-tight">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">Log in to continue your journey.</p>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {emailNotVerified && (
          <div className="mt-4 flex items-start gap-2 rounded-2xl border border-warning/20 bg-warning/5 px-4 py-3">
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <div>
              <p className="text-sm text-warning">Please verify your email before continuing.</p>
              <ResendButton email={email} />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm outline-none placeholder:text-muted-foreground/60 focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
            />
          </label>

          <PasswordInput
            label="Password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
          />

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-white/10 bg-white/[0.03] text-primary focus:ring-primary/20"
              />
              Remember me
            </label>
            <Link to="/forgot-password" className="text-sm text-primary hover:underline">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : (
              <>
                Login <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-[oklch(0.17_0.03_160)] px-3 text-muted-foreground">or</span>
          </div>
        </div>

        <GoogleButton />

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/register" className="text-primary hover:underline">
            Create Account
          </Link>
        </p>
      </div>
    </div>
  );
}

function ResendButton({ email }: { email: string }) {
  const { resendVerificationEmail } = useAuth();
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleResend = async () => {
    setSending(true);
    await resendVerificationEmail(email);
    setSending(false);
    setSent(true);
  };

  if (sent) {
    return (
      <p className="mt-1 flex items-center gap-1 text-xs text-success">
        <CheckCircle2 className="h-3 w-3" /> Verification email sent!
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={handleResend}
      disabled={sending}
      className="mt-1 text-xs text-primary hover:underline disabled:opacity-50"
    >
      {sending ? "Sending..." : "Resend verification email"}
    </button>
  );
}