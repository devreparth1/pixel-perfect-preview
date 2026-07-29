import { createFileRoute } from "@tanstack/react-router";
import { User, Target, Bell, Shield } from "lucide-react";

export const Route = createFileRoute("/app/settings")({
  component: Settings,
});

function Settings() {
  return (
    <div className="space-y-6 pb-24 lg:pb-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Profile, goals, and preferences.</p>
      </div>

      <Section icon={User} title="Profile">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Name" value="John Doe" />
          <Field label="Email" value="john@example.com" />
          <Field label="Age" value="28" />
          <Field label="Country" value="United States" />
        </div>
      </Section>

      <Section icon={Target} title="Goal & body">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Goal" value="Lean bulk (+0.25 kg/wk)" />
          <Field label="Activity level" value="Active" />
          <Field label="Height (cm)" value="178" />
          <Field label="Weight (kg)" value="72.4" />
          <Field label="Daily calories" value="2,200 kcal" />
          <Field label="Protein target" value="140 g" />
        </div>
      </Section>

      <Section icon={Bell} title="Notifications">
        <div className="space-y-3">
          {["Drink water reminders", "Meal time reminders", "Weekly progress reports", "AI coach nudges"].map((n, i) => (
            <div key={n} className="flex items-center justify-between rounded-2xl bg-white/[0.03] px-4 py-3">
              <span className="text-sm">{n}</span>
              <Toggle on={i !== 3} />
            </div>
          ))}
        </div>
      </Section>

      <Section icon={Shield} title="Account">
        <div className="flex flex-wrap gap-2">
          <button className="rounded-full glass px-4 py-2 text-sm hover:bg-white/5">Change password</button>
          <button className="rounded-full glass px-4 py-2 text-sm hover:bg-white/5">Export my data</button>
          <button className="rounded-full px-4 py-2 text-sm text-destructive hover:bg-destructive/10">Delete account</button>
        </div>
      </Section>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl glass p-6">
      <div className="flex items-center gap-2 text-primary">
        <Icon className="h-4 w-4" />
        <h2 className="text-sm font-medium uppercase tracking-wider">{title}</h2>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}
function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="mt-1.5 rounded-2xl bg-white/[0.03] px-4 py-3 text-sm">{value}</div>
    </label>
  );
}
function Toggle({ on }: { on: boolean }) {
  return (
    <div className={`relative h-6 w-11 rounded-full transition ${on ? "bg-primary" : "bg-white/10"}`}>
      <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${on ? "left-5" : "left-0.5"}`} />
    </div>
  );
}