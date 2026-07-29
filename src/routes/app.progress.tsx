import { createFileRoute } from "@tanstack/react-router";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendingDown, Flame, Dumbbell, Target } from "lucide-react";

export const Route = createFileRoute("/app/progress")({
  component: Progress,
});

const weight = Array.from({ length: 12 }, (_, i) => ({ w: `W${i + 1}`, v: 76 - i * 0.35 - (i % 3 === 0 ? 0.2 : 0) }));
const proteinWeek = [
  { d: "Mon", v: 138 }, { d: "Tue", v: 124 }, { d: "Wed", v: 145 },
  { d: "Thu", v: 132 }, { d: "Fri", v: 140 }, { d: "Sat", v: 118 }, { d: "Sun", v: 142 },
];

function Progress() {
  return (
    <div className="space-y-6 pb-24 lg:pb-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Progress</h1>
        <p className="mt-1 text-sm text-muted-foreground">Weekly & monthly trends across weight, macros, and consistency.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { l: "Weight change", v: "-4.2", u: "kg", i: TrendingDown, s: "Since start" },
          { l: "Avg calories", v: "1,980", u: "kcal", i: Flame, s: "Last 30 days" },
          { l: "Avg protein", v: "134", u: "g", i: Dumbbell, s: "Last 30 days" },
          { l: "Goal completion", v: "82", u: "%", i: Target, s: "This week" },
        ].map((k) => (
          <div key={k.l} className="rounded-3xl glass p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">{k.l}</span>
              <k.i className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-3 font-num text-3xl font-semibold">{k.v}<span className="text-sm text-muted-foreground"> {k.u}</span></div>
            <div className="mt-1 text-xs text-muted-foreground">{k.s}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl glass p-6">
          <h3 className="text-lg font-medium">Weight · 12 weeks</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer>
              <AreaChart data={weight}>
                <defs>
                  <linearGradient id="pw" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#2EE6A6" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#2EE6A6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="w" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} domain={["dataMin - 1", "dataMax + 1"]} />
                <Tooltip contentStyle={{ background: "#10261C", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12 }} />
                <Area type="monotone" dataKey="v" stroke="#2EE6A6" strokeWidth={2} fill="url(#pw)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-3xl glass p-6">
          <h3 className="text-lg font-medium">Protein · this week</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer>
              <BarChart data={proteinWeek}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="d" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#10261C", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="v" fill="#74F3C5" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-3xl glass p-6">
        <h3 className="text-lg font-medium">Consistency</h3>
        <p className="text-xs text-muted-foreground">Days you logged meals & water in the last 8 weeks.</p>
        <div className="mt-6 flex flex-wrap gap-1.5">
          {Array.from({ length: 56 }).map((_, i) => {
            const intensity = Math.random();
            const bg = intensity > 0.85 ? "bg-primary" : intensity > 0.55 ? "bg-primary/60" : intensity > 0.25 ? "bg-primary/25" : "bg-white/5";
            return <div key={i} className={`h-6 w-6 rounded-md ${bg}`} />;
          })}
        </div>
      </div>
    </div>
  );
}