import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Flame, Dumbbell, Droplet, Scale, Sparkles, Plus, TrendingDown, Check, Minus, X } from "lucide-react";
import {
  Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { useAuth } from "../lib/auth-context";

export const Route = createFileRoute("/app/")({
  component: Dashboard,
});

const weightData = [
  { d: "Mon", v: 73.8 }, { d: "Tue", v: 73.5 }, { d: "Wed", v: 73.2 }, { d: "Thu", v: 73.1 },
  { d: "Fri", v: 72.8 }, { d: "Sat", v: 72.6 }, { d: "Sun", v: 72.4 },
];
const calData = [
  { d: "M", v: 1980 }, { d: "T", v: 2100 }, { d: "W", v: 1850 }, { d: "T", v: 2050 },
  { d: "F", v: 1900 }, { d: "S", v: 2200 }, { d: "S", v: 1850 },
];

type Meal = { id: string; t: string; n: string; k: number; p: number };

const initialMeals: Meal[] = [
  { id: "b", t: "Breakfast", n: "Greek yogurt bowl w/ berries", k: 420, p: 32 },
  { id: "l", t: "Lunch", n: "Chicken quinoa salad", k: 640, p: 48 },
  { id: "s", t: "Snack", n: "Apple + almond butter", k: 210, p: 6 },
  { id: "d", t: "Dinner", n: "Miso-glazed salmon", k: 580, p: 44 },
];

const CALORIE_GOAL = 2200;
const WATER_GOAL_ML = 3500;

function Dashboard() {
  const { user } = useAuth();
  const firstName =
    user?.user_metadata?.full_name?.split(" ")[0] ||
    user?.user_metadata?.name?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "there";

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const [meals, setMeals] = useState<Meal[]>(initialMeals);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ t: "Snack", n: "", k: "", p: "" });
  const [waterMl, setWaterMl] = useState(2500);
  const [planAdded, setPlanAdded] = useState(false);

  const totals = useMemo(
    () =>
      meals.reduce(
        (acc, m) => ({ k: acc.k + m.k, p: acc.p + m.p }),
        { k: 0, p: 0 },
      ),
    [meals],
  );

  const addMeal = (meal: Omit<Meal, "id">) => {
    setMeals((prev) => [...prev, { ...meal, id: `${Date.now()}` }]);
  };

  const submitMeal = (e: React.FormEvent) => {
    e.preventDefault();
    const kcal = Number(form.k);
    if (!form.n.trim() || !Number.isFinite(kcal) || kcal <= 0) {
      toast.error("Add a meal name and calories.");
      return;
    }
    addMeal({ t: form.t, n: form.n.trim(), k: Math.round(kcal), p: Math.round(Number(form.p) || 0) });
    toast.success(`${form.n.trim()} logged · ${Math.round(kcal)} kcal`);
    setForm({ t: "Snack", n: "", k: "", p: "" });
    setShowForm(false);
  };

  return (
    <div className="space-y-6 pb-24 lg:pb-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{greet}, {firstName} 👋</h1>
          <p className="mt-1 text-sm text-muted-foreground">You're on track today. Keep it up.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          aria-expanded={showForm}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:brightness-110 active:scale-95"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Cancel" : "Log meal"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submitMeal} className="grid gap-3 rounded-3xl glass p-5 sm:grid-cols-5">
          <select
            aria-label="Meal type"
            value={form.t}
            onChange={(e) => setForm({ ...form, t: e.target.value })}
            className="rounded-2xl bg-white/5 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
          >
            {["Breakfast", "Lunch", "Snack", "Dinner"].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <input
            aria-label="Meal name"
            placeholder="What did you eat?"
            value={form.n}
            onChange={(e) => setForm({ ...form, n: e.target.value })}
            className="rounded-2xl bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-primary sm:col-span-2"
          />
          <input
            aria-label="Calories"
            inputMode="numeric"
            placeholder="kcal"
            value={form.k}
            onChange={(e) => setForm({ ...form, k: e.target.value })}
            className="font-num rounded-2xl bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-primary"
          />
          <div className="flex gap-2">
            <input
              aria-label="Protein grams"
              inputMode="numeric"
              placeholder="protein g"
              value={form.p}
              onChange={(e) => setForm({ ...form, p: e.target.value })}
              className="font-num min-w-0 flex-1 rounded-2xl bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-primary"
            />
            <button type="submit" className="rounded-2xl bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:brightness-110 active:scale-95">
              Add
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <CalorieCard consumed={totals.k} />
        <MacroCard protein={totals.p} />
        <WaterCard ml={waterMl} onChange={setWaterMl} />
        <WeightCard />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl glass p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Weight trend</h3>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-1 text-xs text-success">
              <TrendingDown className="h-3 w-3" /> -1.4 kg
            </span>
          </div>
          <div className="mt-4 h-56">
            <ResponsiveContainer>
              <AreaChart data={weightData}>
                <defs>
                  <linearGradient id="wg" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#2EE6A6" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#2EE6A6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="d" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} domain={["dataMin - 0.5", "dataMax + 0.5"]} />
                <Tooltip contentStyle={{ background: "#10261C", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12 }} />
                <Area type="monotone" dataKey="v" stroke="#2EE6A6" strokeWidth={2} fill="url(#wg)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl glass p-6">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-4 w-4" /><span className="text-xs uppercase tracking-wider">AI recommendation</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed">
            You're ~{Math.max(CALORIE_GOAL - totals.k, 0)} kcal under target. A protein-forward snack (Greek yogurt + berries, ~180 kcal, 18g protein)
            would help you hit today's macros without overshooting.
          </p>
          <button
            type="button"
            disabled={planAdded}
            onClick={() => {
              addMeal({ t: "Snack", n: "Greek yogurt + berries", k: 180, p: 18 });
              setPlanAdded(true);
              toast.success("Added to today's plan");
            }}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full glass px-4 py-2 text-xs transition hover:bg-white/5 active:scale-95 disabled:opacity-60"
          >
            {planAdded ? <><Check className="h-3 w-3" /> Added</> : "Add to plan"}
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl glass p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Today's meals</h3>
            <span className="font-num text-xs text-muted-foreground">{totals.k} kcal · {totals.p}g protein</span>
          </div>
          <div className="mt-4 divide-y divide-white/5">
            {meals.map((m) => (
              <div key={m.id} className="group flex items-center justify-between py-3">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">{m.t}</div>
                  <div className="text-sm">{m.n}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-num text-sm text-primary">{m.k} kcal</div>
                    <div className="font-num text-xs text-muted-foreground">{m.p}g protein</div>
                  </div>
                  <button
                    type="button"
                    aria-label={`Remove ${m.n}`}
                    onClick={() => {
                      setMeals((prev) => prev.filter((x) => x.id !== m.id));
                      toast(`${m.n} removed`);
                    }}
                    className="rounded-full p-1.5 text-muted-foreground opacity-0 transition hover:bg-white/5 hover:text-foreground focus:opacity-100 group-hover:opacity-100"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {meals.length === 0 && (
              <p className="py-6 text-sm text-muted-foreground">No meals logged yet — tap “Log meal” to start.</p>
            )}
          </div>
        </div>

        <div className="rounded-3xl glass p-6">
          <h3 className="text-lg font-medium">Calories · week</h3>
          <div className="mt-4 h-56">
            <ResponsiveContainer>
              <AreaChart data={calData}>
                <defs>
                  <linearGradient id="cg" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#74F3C5" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#74F3C5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="d" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#10261C", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12 }} />
                <Area type="monotone" dataKey="v" stroke="#74F3C5" strokeWidth={2} fill="url(#cg)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function CalorieCard({ consumed }: { consumed: number }) {
  const pct = Math.min(Math.round((consumed / CALORIE_GOAL) * 100), 100);
  const r = 42, c = 2 * Math.PI * r;
  return (
    <div className="rounded-3xl glass p-6">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">Calories</span>
        <Flame className="h-4 w-4 text-primary" />
      </div>
      <div className="mt-4 flex items-center gap-4">
        <svg width="104" height="104" viewBox="0 0 104 104" className="-rotate-90">
          <circle cx="52" cy="52" r={r} stroke="rgba(255,255,255,0.06)" strokeWidth="8" fill="none" />
          <circle cx="52" cy="52" r={r} stroke="url(#gc)" strokeWidth="8" fill="none"
            strokeDasharray={c} strokeDashoffset={c - (c * pct) / 100} strokeLinecap="round"
            className="transition-[stroke-dashoffset] duration-500" />
          <defs>
            <linearGradient id="gc" x1="0" x2="1"><stop offset="0" stopColor="#2EE6A6" /><stop offset="1" stopColor="#74F3C5" /></linearGradient>
          </defs>
        </svg>
        <div>
          <div className="font-num text-3xl font-semibold">{Math.max(CALORIE_GOAL - consumed, 0)}</div>
          <div className="text-xs text-muted-foreground">kcal remaining</div>
          <div className="mt-1 font-num text-xs text-muted-foreground">
            {consumed.toLocaleString()} / {CALORIE_GOAL.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}
function MacroCard({ protein }: { protein: number }) {
  const macros = [{ k: "Protein", v: protein, g: 140, c: "#2EE6A6" }, { k: "Carbs", v: 180, g: 240, c: "#74F3C5" }, { k: "Fat", v: 58, g: 72, c: "#F5A623" }];
  return (
    <div className="rounded-3xl glass p-6">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">Macros</span>
        <Dumbbell className="h-4 w-4 text-primary" />
      </div>
      <div className="mt-5 space-y-3">
        {macros.map((m) => (
          <div key={m.k}>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{m.k}</span>
              <span className="font-num">{m.v} / {m.g}g</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
              <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${Math.min((m.v / m.g) * 100, 100)}%`, background: m.c }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
function WaterCard({ ml, onChange }: { ml: number; onChange: (v: number) => void }) {
  const filled = Math.round((ml / WATER_GOAL_ML) * 8);
  return (
    <div className="rounded-3xl glass p-6">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">Water</span>
        <Droplet className="h-4 w-4 text-primary" />
      </div>
      <div className="mt-4 font-num text-3xl font-semibold">{(ml / 1000).toFixed(2).replace(/0$/, "")}<span className="text-base text-muted-foreground"> / 3.5 L</span></div>
      <div className="mt-4 flex gap-1.5">
        {Array.from({ length: 8 }).map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Set water to ${(((i + 1) * WATER_GOAL_ML) / 8 / 1000).toFixed(2)} L`}
            onClick={() => onChange(Math.round(((i + 1) * WATER_GOAL_ML) / 8))}
            className={`h-8 flex-1 rounded-md transition ${i < filled ? "bg-primary/60 hover:bg-primary/80" : "bg-white/5 hover:bg-white/10"}`}
          />
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          aria-label="Remove 250 ml"
          onClick={() => onChange(Math.max(ml - 250, 0))}
          className="rounded-full glass px-3 py-2 text-xs transition hover:bg-white/5 active:scale-95"
        >
          <Minus className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={() => {
            const next = Math.min(ml + 250, 6000);
            onChange(next);
            if (next >= WATER_GOAL_ML && ml < WATER_GOAL_ML) toast.success("Hydration goal hit 💧");
          }}
          className="flex-1 rounded-full glass py-2 text-xs transition hover:bg-white/5 active:scale-95"
        >
          + 250 ml
        </button>
      </div>
    </div>
  );
}
function WeightCard() {
  return (
    <div className="rounded-3xl glass p-6">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">Weight</span>
        <Scale className="h-4 w-4 text-primary" />
      </div>
      <div className="mt-4 font-num text-3xl font-semibold">72.4<span className="text-base text-muted-foreground"> kg</span></div>
      <div className="mt-1 inline-flex items-center gap-1 text-xs text-success">
        <TrendingDown className="h-3 w-3" /> -1.4 kg this week
      </div>
      <div className="mt-4 grid grid-cols-7 gap-1">
        {[10, 30, 45, 55, 65, 78, 90].map((h, i) => (
          <div key={i} className="rounded-md bg-primary/30" style={{ height: `${h * 0.5}px` }} />
        ))}
      </div>
    </div>
  );
}