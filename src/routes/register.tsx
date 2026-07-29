import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Salad, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../lib/auth-context";
import { PasswordInput } from "../components/auth/password-input";
import { GoogleButton } from "../components/auth/google-button";
import { AuthLoading } from "../components/auth/auth-loading";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create account — RP Nutrition" },
      { name: "description", content: "Create your RP Nutrition account and start eating better today." },
      { property: "og:title", content: "Create account — RP Nutrition" },
      { property: "og:description", content: "Start your AI-powered nutrition journey." },
    ],
  }),
  component: Register,
});

interface ValidationErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
}

function validatePassword(password: string): string | undefined {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(password)) return "Must contain at least one uppercase letter.";
  if (!/[a-z]/.test(password)) return "Must contain at least one lowercase letter.";
  if (!/[0-9]/.test(password)) return "Must contain at least one number.";
  return undefined;
}

function Register() {
  const nav = useNavigate();
  const { signUp, user, loading: authLoading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      nav({ to: "/app" });
    }
  }, [user, authLoading, nav]);

  if (authLoading) return <AuthLoading />;
  if (user) return <AuthLoading />;

  const validate = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!name.trim()) newErrors.name = "Full name is required.";
    if (!email.trim()) newErrors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Please enter a valid email.";

    const pwError = validatePassword(password);
    if (!password) newErrors.password = "Password is required.";
    else if (pwError) newErrors.password = pwError;

    if (!confirmPassword) newErrors.confirmPassword = "Please confirm your password.";
    else if (password !== confirmPassword) newErrors.confirmPassword = "Passwords do not match.";

    if (!agreeTerms) newErrors.terms = "You must agree to the Terms of Service.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");

    if (!validate()) return;

    setLoading(true);
    const { error } = await signUp(email, password, name);
    setLoading(false);

    if (error) {
      if (error.message.toLowerCase().includes("already registered")) {
        setServerError("This email is already registered. Please log in instead.");
      } else {
        setServerError(error.message);
      }
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
            Your account has been created. Please verify your email before logging in.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            We sent a verification link to <span className="text-foreground font-medium">{email}</span>
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
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/15 text-primary">
            <Salad className="h-4 w-4" />
          </span>
          <span className="font-display text-lg font-semibold">RP Nutrition</span>
        </Link>

        <h1 className="mt-8 text-3xl font-semibold tracking-tight">Create your account</h1>
        <p className="mt-1 text-sm text-muted-foreground">Free forever. Upgrade anytime.</p>

        {serverError && (
          <div className="mt-4 flex items-start gap-2 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <p className="text-sm text-destructive">{serverError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Full Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              className={`mt-2 w-full rounded-2xl border ${errors.name ? "border-destructive/60" : "border-white/10"} bg-white/[0.03] px-4 py-3 text-sm outline-none placeholder:text-muted-foreground/60 focus:border-primary/60 focus:ring-2 focus:ring-primary/20`}
            />
            {errors.name && <p className="mt-1.5 text-xs text-destructive">{errors.name}</p>}
          </label>

          <label className="block">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Email Address</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={`mt-2 w-full rounded-2xl border ${errors.email ? "border-destructive/60" : "border-white/10"} bg-white/[0.03] px-4 py-3 text-sm outline-none placeholder:text-muted-foreground/60 focus:border-primary/60 focus:ring-2 focus:ring-primary/20`}
            />
            {errors.email && <p className="mt-1.5 text-xs text-destructive">{errors.email}</p>}
          </label>

          <PasswordInput
            label="Password"
            value={password}
            onChange={setPassword}
            placeholder="At least 8 characters"
            error={errors.password}
          />

          <PasswordInput
            label="Confirm Password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Re-enter your password"
            error={errors.confirmPassword}
          />

          <div>
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-white/10 bg-white/[0.03] text-primary focus:ring-primary/20"
              />
              <span className="text-sm text-muted-foreground">
                I agree to the{" "}
                <a href="#" className="text-primary hover:underline">Terms of Service</a>
                {" "}and{" "}
                <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
              </span>
            </label>
            {errors.terms && <p className="mt-1.5 text-xs text-destructive">{errors.terms}</p>}
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
                Create Account <ArrowRight className="h-4 w-4" />
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
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}