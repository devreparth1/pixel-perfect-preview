import { createFileRoute } from "@tanstack/react-router";
import { Flame, Dumbbell, Droplet, Scale, Sparkles, Plus, TrendingDown } from "lucide-react";
import {
  Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

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

function Dashboard() {
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return (
    <div className="space-y-6 pb-24 lg:pb-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{greet}, John 👋</h1>
          <p className="mt-1 text-sm text-muted-foreground">You're on track today. Keep it up.</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:brightness-110">
          <Plus className="h-4 w-4" /> Log meal
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <CalorieCard />
        <MacroCard />
        <WaterCard />
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
            You're ~350 kcal under target. A protein-forward snack (Greek yogurt + berries, ~180 kcal, 18g protein)
            would help you hit today's macros without overshooting.
          </p>
          <button className="mt-4 rounded-full glass px-4 py-2 text-xs hover:bg-white/5">Add to plan</button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl glass p-6 lg:col-span-2">
          <h3 className="text-lg font-medium">Today's meals</h3>
          <div className="mt-4 divide-y divide-white/5">
            {[
              { t: "Breakfast", n: "Greek yogurt bowl w/ berries", k: 420, p: 32 },
              { t: "Lunch", n: "Chicken quinoa salad", k: 640, p: 48 },
              { t: "Snack", n: "Apple + almond butter", k: 210, p: 6 },
              { t: "Dinner", n: "Miso-glazed salmon", k: 580, p: 44 },
            ].map((m) => (
              <div key={m.t} className="flex items-center justify-between py-3">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">{m.t}</div>
                  <div className="text-sm">{m.n}</div>
                </div>
                <div className="text-right">
                  <div className="font-num text-sm text-primary">{m.k} kcal</div>
                  <div className="font-num text-xs text-muted-foreground">{m.p}g protein</div>
                </div>
              </div>
            ))}
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

function CalorieCard() {
  const pct = 84;
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
            strokeDasharray={c} strokeDashoffset={c - (c * pct) / 100} strokeLinecap="round" />
          <defs>
            <linearGradient id="gc" x1="0" x2="1"><stop offset="0" stopColor="#2EE6A6" /><stop offset="1" stopColor="#74F3C5" /></linearGradient>
          </defs>
        </svg>
        <div>
          <div className="font-num text-3xl font-semibold">350</div>
          <div className="text-xs text-muted-foreground">kcal remaining</div>
          <div className="mt-1 font-num text-xs text-muted-foreground">1,850 / 2,200</div>
        </div>
      </div>
    </div>
  );
}
function MacroCard() {
  const macros = [{ k: "Protein", v: 112, g: 140, c: "#2EE6A6" }, { k: "Carbs", v: 180, g: 240, c: "#74F3C5" }, { k: "Fat", v: 58, g: 72, c: "#F5A623" }];
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
              <div className="h-full rounded-full" style={{ width: `${(m.v / m.g) * 100}%`, background: m.c }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
function WaterCard() {
  return (
    <div className="rounded-3xl glass p-6">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">Water</span>
        <Droplet className="h-4 w-4 text-primary" />
      </div>
      <div className="mt-4 font-num text-3xl font-semibold">2.5<span className="text-base text-muted-foreground"> / 3.5 L</span></div>
      <div className="mt-4 flex gap-1.5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={`h-8 flex-1 rounded-md ${i < 5 ? "bg-primary/60" : "bg-white/5"}`} />
        ))}
      </div>
      <button className="mt-4 w-full rounded-full glass py-2 text-xs hover:bg-white/5">+ 250 ml</button>
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