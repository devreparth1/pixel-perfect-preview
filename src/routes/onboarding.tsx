import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, ArrowLeft, Target, Salad } from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [
    { title: "Set up your profile — RP Nutrition" },
    { name: "description", content: "Tell us about your goals so we can personalize your plan." },
    { property: "og:title", content: "Set up your profile — RP Nutrition" },
    { property: "og:description", content: "Personalize your AI nutrition plan in under a minute." },
  ]}),
  component: Onboarding,
});

type Data = {
  age: string; gender: string; height: string; weight: string;
  activity: string; goal: string; diet: string; allergies: string;
};

const steps = ["About you", "Body", "Lifestyle", "Goal", "Preferences"];

function Onboarding() {
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [d, setD] = useState<Data>({ age: "", gender: "female", height: "", weight: "", activity: "moderate", goal: "lose", diet: "omnivore", allergies: "" });
  const set = (k: keyof Data) => (v: string) => setD((s) => ({ ...s, [k]: v }));

  const next = () => step < steps.length - 1 ? setStep(step + 1) : nav({ to: "/app" });
  const prev = () => step > 0 && setStep(step - 1);

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-10">
      <Link to="/" className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/15 text-primary">
          <Salad className="h-4 w-4" />
        </span>
        <span className="font-display text-lg font-semibold">RP Nutrition</span>
      </Link>

      <div className="mt-8 flex items-center gap-2">
        {steps.map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-white/10"}`} />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
        <span>Step {step + 1} of {steps.length}</span>
        <span>{steps[step]}</span>
      </div>

      <div className="mt-8 flex-1 rounded-3xl glass p-8 anim-fade-up">
        {step === 0 && (
          <>
            <h2 className="text-2xl font-semibold tracking-tight">Nice to meet you.</h2>
            <p className="mt-1 text-sm text-muted-foreground">We'll use this to personalize your calorie and macro targets.</p>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <Text label="Age" value={d.age} onChange={set("age")} placeholder="28" />
              <Choice label="Gender" value={d.gender} onChange={set("gender")} options={["female", "male", "other"]} />
            </div>
          </>
        )}
        {step === 1 && (
          <>
            <h2 className="text-2xl font-semibold tracking-tight">Your body.</h2>
            <p className="mt-1 text-sm text-muted-foreground">Used for BMI, BMR & TDEE.</p>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <Text label="Height (cm)" value={d.height} onChange={set("height")} placeholder="170" />
              <Text label="Weight (kg)" value={d.weight} onChange={set("weight")} placeholder="72" />
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <h2 className="text-2xl font-semibold tracking-tight">How active are you?</h2>
            <div className="mt-6 grid gap-2">
              {[
                ["sedentary", "Sedentary — desk job, little exercise"],
                ["light", "Light — 1–3 workouts / week"],
                ["moderate", "Moderate — 3–5 workouts / week"],
                ["active", "Active — 6+ workouts / week"],
                ["athlete", "Athlete — twice daily training"],
              ].map(([v, l]) => (
                <button key={v} onClick={() => set("activity")(v)}
                  className={`rounded-2xl px-4 py-3 text-left text-sm transition ${d.activity === v ? "bg-primary/15 text-primary ring-1 ring-primary/40" : "glass hover:bg-white/5"}`}>
                  {l}
                </button>
              ))}
            </div>
          </>
        )}
        {step === 3 && (
          <>
            <h2 className="text-2xl font-semibold tracking-tight">What's your goal?</h2>
            <div className="mt-6 grid gap-2">
              {[
                ["lose", "Lose weight", "Sustainable deficit"],
                ["maintain", "Maintain", "Recomp / lifestyle"],
                ["gain", "Gain muscle", "Lean bulk"],
              ].map(([v, t, s]) => (
                <button key={v} onClick={() => set("goal")(v)}
                  className={`flex items-center justify-between rounded-2xl px-4 py-4 text-left transition ${d.goal === v ? "bg-primary/15 text-primary ring-1 ring-primary/40" : "glass hover:bg-white/5"}`}>
                  <div>
                    <div className="text-sm font-medium">{t}</div>
                    <div className="text-xs text-muted-foreground">{s}</div>
                  </div>
                  <Target className="h-4 w-4" />
                </button>
              ))}
            </div>
          </>
        )}
        {step === 4 && (
          <>
            <h2 className="text-2xl font-semibold tracking-tight">Food preferences.</h2>
            <p className="mt-1 text-sm text-muted-foreground">We'll build plans around this.</p>
            <div className="mt-6 grid gap-4">
              <Choice label="Diet" value={d.diet} onChange={set("diet")} options={["omnivore", "vegetarian", "vegan", "pescatarian", "keto"]} />
              <Text label="Allergies (comma-separated)" value={d.allergies} onChange={set("allergies")} placeholder="peanuts, shellfish" />
            </div>
          </>
        )}

        <div className="mt-10 flex items-center justify-between">
          <button onClick={prev} disabled={step === 0}
            className="inline-flex items-center gap-1 rounded-full glass px-4 py-2 text-sm disabled:opacity-40">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <button onClick={next} className="inline-flex items-center gap-1 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:brightness-110">
            {step === steps.length - 1 ? "Finish" : "Continue"} <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Text({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20" />
    </label>
  );
}
function Choice({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => (
          <button key={o} onClick={() => onChange(o)} type="button"
            className={`rounded-full px-4 py-2 text-sm capitalize transition ${value === o ? "bg-primary/15 text-primary ring-1 ring-primary/40" : "glass hover:bg-white/5"}`}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}