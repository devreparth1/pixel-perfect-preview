import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Salad, ArrowRight } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [
    { title: "Create account — RP Nutrition" },
    { name: "description", content: "Create your RP Nutrition account and start eating better today." },
    { property: "og:title", content: "Create account — RP Nutrition" },
    { property: "og:description", content: "Start your AI-powered nutrition journey." },
  ]}),
  component: Register,
});

function Register() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        <form onSubmit={(e) => { e.preventDefault(); nav({ to: "/onboarding" }); }} className="mt-6 space-y-4">
          <Field label="Name" type="text" value={name} onChange={setName} placeholder="Jane Doe" />
          <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
          <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="At least 8 characters" />
          <button type="submit" className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground hover:brightness-110">
            Create account <ArrowRight className="h-4 w-4" />
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have one? <Link to="/login" className="text-primary hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}

function Field({ label, type, value, onChange, placeholder }: { label: string; type: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm outline-none placeholder:text-muted-foreground/60 focus:border-primary/60 focus:ring-2 focus:ring-primary/20" />
    </label>
  );
}