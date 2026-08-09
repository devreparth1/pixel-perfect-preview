import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Scale, Flame, Dumbbell, Target, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

import { dateKey, daysAgoKey, shortDate, num } from "../lib/nutrition";
import { useMealHistory, useWaterHistory, useWeightLogs, useLogWeight, useDeleteWeight, useTargets } from "../lib/nutrition-data";
import { CardSkeleton, ChartSkeleton, EmptyState, EstimateNote, Modal } from "../components/nutrition/primitives";

export const Route = createFileRoute("/app/progress")({
  head: () => ({
    meta: [
      { title: "Progress — RP Nutrition" },
      { name: "description", content: "Track your weight trend, calorie and protein consistency, and goal progress from your own logged data." },
      { property: "og:title", content: "Progress — RP Nutrition" },
      { property: "og:description", content: "Weight trends, nutrition consistency and weekly summaries built from your logs." },
    ],
  }),
  component: Progress,
});

const RANGES = [
  { key: "7", label: "7 days", days: 7 },
  { key: "30", label: "30 days", days: 30 },
  { key: "90", label: "90 days", days: 90 },
  { key: "all", label: "All time", days: 3650 },
] as const;

type Metric = "calories" | "protein" | "carbs" | "fat" | "water";

function Progress() {
  const { targets, profile } = useTargets();
  const weights = useWeightLogs();
  const meals = useMealHistory(90);
  const water = useWaterHistory(90);
  const logWeight = useLogWeight();
  const deleteWeight = useDeleteWeight();

  const [rangeKey, setRangeKey] = useState<(typeof RANGES)[number]["key"]>("30");
  const [metric, setMetric] = useState<Metric>("calories");
  const [nutriDays, setNutriDays] = useState(7);
  const [showLog, setShowLog] = useState(false);
  const [showEntries, setShowEntries] = useState(false);
  const [weightInput, setWeightInput] = useState("");

  const range = RANGES.find((r) => r.key === rangeKey)!;
  const rows = weights.data ?? [];

  const chartRows = useMemo(() => {
    const from = daysAgoKey(range.days);
    return rows.filter((r) => r.log_date >= from).map((r) => ({ d: shortDate(r.log_date), iso: r.log_date, v: r.weight_kg }));
  }, [rows, range.days]);

  const current = rows.length ? rows[rows.length - 1]!.weight_kg : null;
  const start = rows.length ? rows[0]!.weight_kg : null;
  const change = current !== null && start !== null ? current - start : null;
  const weeklyRate = useMemo(() => {
    if (rows.length < 2) return null;
    const first = rows[0]!, last = rows[rows.length - 1]!;
    const days = (new Date(last.log_date).getTime() - new Date(first.log_date).getTime()) / 86_400_000;
    if (days < 1) return null;
    return ((last.weight_kg - first.weight_kg) / days) * 7;
  }, [rows]);

  // per-day nutrition aggregation from real logs only
  const nutrition = useMemo(() => {
    const byDate = new Map<string, { calories: number; protein: number; carbs: number; fat: number; water: number }>();
    const blank = () => ({ calories: 0, protein: 0, carbs: 0, fat: 0, water: 0 });
    for (const m of meals.data ?? []) {
      const e = byDate.get(m.log_date) ?? blank();
      e.calories += num(m.calories); e.protein += num(m.protein); e.carbs += num(m.carbs); e.fat += num(m.fat);
      byDate.set(m.log_date, e);
    }
    for (const w of water.data ?? []) {
      const e = byDate.get(w.log_date) ?? blank();
      e.water += num(w.amount_ml);
      byDate.set(w.log_date, e);
    }
    const series = Array.from({ length: nutriDays }, (_, i) => {
      const key = daysAgoKey(nutriDays - 1 - i);
      const e = byDate.get(key) ?? blank();
      return { d: shortDate(key), key, ...e };
    });
    return { series, byDate };
  }, [meals.data, water.data, nutriDays]);

  const last7 = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => daysAgoKey(6 - i));
    const logged = days.filter((d) => (nutrition.byDate.get(d)?.calories ?? 0) > 0);
    const cal = logged.reduce((a, d) => a + (nutrition.byDate.get(d)?.calories ?? 0), 0);
    const pro = logged.reduce((a, d) => a + (nutrition.byDate.get(d)?.protein ?? 0), 0);
    const weightWeek = rows.filter((r) => r.log_date >= daysAgoKey(7));
    const wChange = weightWeek.length >= 2 ? weightWeek[weightWeek.length - 1]!.weight_kg - weightWeek[0]!.weight_kg : null;
    return {
      loggedDays: logged.length,
      avgCal: logged.length ? Math.round(cal / logged.length) : 0,
      avgPro: logged.length ? Math.round(pro / logged.length) : 0,
      wChange,
    };
  }, [nutrition.byDate, rows]);

  const hasNutrition = nutrition.series.some((d) => d.calories > 0 || d.water > 0);
  const target = profile?.target_weight_kg == null ? null : Number(profile.target_weight_kg);

  const submitWeight = () => {
    const w = Number(weightInput);
    if (!Number.isFinite(w) || w <= 20 || w >= 400) return toast.error("Enter a weight between 20 and 400 kg.");
    logWeight.mutate({ weightKg: w, date: dateKey() }, { onSuccess: () => { setWeightInput(""); setShowLog(false); } });
  };

  const metricConfig: Record<Metric, { label: string; unit: string; color: string }> = {
    calories: { label: "Calories", unit: "kcal", color: "#2EE6A6" },
    protein: { label: "Protein", unit: "g", color: "#74F3C5" },
    carbs: { label: "Carbs", unit: "g", color: "#F5C97B" },
    fat: { label: "Fat", unit: "g", color: "#F0A2A2" },
    water: { label: "Water", unit: "ml", color: "#7BC8F5" },
  };

  return (
    <div className="space-y-6 pb-24 lg:pb-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Progress</h1>
          <p className="mt-1 text-sm text-muted-foreground">Trends built only from what you've logged.</p>
        </div>
        <button onClick={() => setShowLog(true)} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:brightness-110">
          <Plus className="h-4 w-4" /> Log weight
        </button>
      </div>

      {/* KPIs */}
      {weights.isLoading || meals.isLoading ? (
        <div className="grid gap-4 md:grid-cols-4">{[0, 1, 2, 3].map((i) => <CardSkeleton key={i} />)}</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Kpi label="Current weight" icon={Scale} value={current !== null ? current.toFixed(1) : "—"} unit="kg" sub={start !== null ? `Started at ${start.toFixed(1)} kg` : "No entries yet"} />
          <Kpi label="Weight change" icon={Target} value={change !== null ? `${change > 0 ? "+" : ""}${change.toFixed(1)}` : "—"} unit="kg" sub={weeklyRate !== null ? `${weeklyRate > 0 ? "+" : ""}${weeklyRate.toFixed(2)} kg / week average` : "Needs 2+ entries"} />
          <Kpi label="Avg calories" icon={Flame} value={last7.avgCal ? last7.avgCal.toLocaleString() : "—"} unit="kcal" sub="Logged days, last 7 days" />
          <Kpi label="Avg protein" icon={Dumbbell} value={last7.avgPro ? `${last7.avgPro}` : "—"} unit="g" sub="Logged days, last 7 days" />
        </div>
      )}

      {/* Weight chart */}
      {weights.isLoading ? (
        <ChartSkeleton />
      ) : (
        <div className="rounded-3xl glass p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-medium">Weight trend</h3>
              <p className="text-xs text-muted-foreground">Hover a point for the exact date and weight.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {RANGES.map((r) => (
                <button key={r.key} onClick={() => setRangeKey(r.key)}
                  className={`rounded-full px-3 py-1.5 text-xs ${rangeKey === r.key ? "bg-primary/15 text-primary ring-1 ring-primary/40" : "glass text-muted-foreground hover:bg-white/5"}`}>
                  {r.label}
                </button>
              ))}
              {rows.length > 0 && (
                <button onClick={() => setShowEntries(true)} className="rounded-full glass px-3 py-1.5 text-xs hover:bg-white/5">Manage entries</button>
              )}
            </div>
          </div>

          {chartRows.length === 0 ? (
            <div className="mt-5">
              <EmptyState icon={<Scale className="h-5 w-5" />} title="Start tracking your weight to see your progress."
                description="Add one entry per day; the chart appears from your second entry."
                action={<button onClick={() => setShowLog(true)} className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:brightness-110">Log your weight</button>} />
            </div>
          ) : (
            <div className="mt-4 h-64">
              <ResponsiveContainer>
                <AreaChart data={chartRows}>
                  <defs>
                    <linearGradient id="pw" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#2EE6A6" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#2EE6A6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="d" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} domain={["dataMin - 1", "dataMax + 1"]} />
                  <Tooltip
                    contentStyle={{ background: "#10261C", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12 }}
                    formatter={(v) => [`${Number(v).toFixed(1)} kg`, "Weight"]}
                  />
                  <Area type="monotone" dataKey="v" stroke="#2EE6A6" strokeWidth={2} fill="url(#pw)" dot />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Nutrition progress */}
      {meals.isLoading ? (
        <ChartSkeleton />
      ) : !hasNutrition ? (
        <EmptyState icon={<Flame className="h-5 w-5" />} title="Keep logging your meals to unlock your nutrition trends." />
      ) : (
        <div className="rounded-3xl glass p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-medium">Nutrition consistency</h3>
              <p className="text-xs text-muted-foreground">Logged {metricConfig[metric].label.toLowerCase()} per day.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(metricConfig) as Metric[]).map((m) => (
                <button key={m} onClick={() => setMetric(m)}
                  className={`rounded-full px-3 py-1.5 text-xs ${metric === m ? "bg-primary/15 text-primary ring-1 ring-primary/40" : "glass text-muted-foreground hover:bg-white/5"}`}>
                  {metricConfig[m].label}
                </button>
              ))}
              <button onClick={() => setNutriDays(nutriDays === 7 ? 30 : 7)} className="rounded-full glass px-3 py-1.5 text-xs hover:bg-white/5">
                {nutriDays === 7 ? "Weekly" : "Monthly"}
              </button>
            </div>
          </div>
          <div className="mt-4 h-64">
            <ResponsiveContainer>
              <BarChart data={nutrition.series}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="d" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "#10261C", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12 }}
                  formatter={(v) => [`${Math.round(Number(v))} ${metricConfig[metric].unit}`, metricConfig[metric].label]}
                />
                <Bar dataKey={metric} fill={metricConfig[metric].color} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Goal + weekly summary */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl glass p-6">
          <h3 className="text-lg font-medium">Goal progress</h3>
          <p className="text-xs text-muted-foreground">Goal: {targets.goalLabel}</p>
          <div className="mt-4 space-y-2 text-sm">
            <Row label="Starting weight" value={start !== null ? `${start.toFixed(1)} kg` : "—"} />
            <Row label="Current weight" value={current !== null ? `${current.toFixed(1)} kg` : "—"} />
            <Row label="Target weight" value={target !== null ? `${target.toFixed(1)} kg` : "Not set"} />
            <Row label="Remaining" value={target !== null && current !== null ? `${Math.abs(current - target).toFixed(1)} kg` : "—"} />
            <Row label="Daily calorie estimate" value={`${targets.calories.toLocaleString()} kcal`} />
          </div>
          <div className="mt-4"><EstimateNote>Progress reflects logged entries only and isn't a prediction of future results.</EstimateNote></div>
        </div>

        <div className="rounded-3xl glass p-6">
          <h3 className="text-lg font-medium">This week</h3>
          <p className="text-xs text-muted-foreground">Summarised from your own logs.</p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            {last7.loggedDays === 0 ? (
              <li>No meals logged in the last 7 days yet.</li>
            ) : (
              <>
                <li>Your average calorie intake was {last7.avgCal.toLocaleString()} kcal on logged days.</li>
                <li>Your average protein intake was {last7.avgPro} g.</li>
                <li>You logged meals on {last7.loggedDays} of 7 days.</li>
                <li>{last7.wChange !== null ? `Your weight changed by ${last7.wChange > 0 ? "+" : ""}${last7.wChange.toFixed(1)} kg.` : "Log weight twice this week to see a weekly change."}</li>
              </>
            )}
          </ul>
        </div>
      </div>

      <Modal open={showLog} onClose={() => setShowLog(false)} title="Log today's weight" subtitle="One entry per day — saving again updates today.">
        <div className="space-y-3">
          <input
            aria-label="Weight in kilograms" inputMode="decimal" placeholder="e.g. 72.4" value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            className="w-full rounded-2xl bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-primary"
          />
          <button onClick={submitWeight} disabled={logWeight.isPending} className="w-full rounded-full bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:brightness-110 disabled:opacity-60">
            {logWeight.isPending ? "Saving…" : "Save weight"}
          </button>
        </div>
      </Modal>

      <Modal open={showEntries} onClose={() => setShowEntries(false)} title="Weight entries" subtitle="Delete anything you logged by mistake.">
        <ul className="max-h-80 space-y-2 overflow-y-auto">
          {[...rows].reverse().map((r) => (
            <li key={r.id} className="flex items-center justify-between rounded-2xl bg-white/[0.03] px-4 py-3 text-sm">
              <span className="text-muted-foreground">{shortDate(r.log_date)}</span>
              <span className="font-num">{r.weight_kg.toFixed(1)} kg</span>
              <button onClick={() => deleteWeight.mutate(r.id)} aria-label={`Delete entry for ${r.log_date}`} className="grid h-8 w-8 place-items-center rounded-xl text-muted-foreground hover:bg-white/5 hover:text-foreground">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      </Modal>
    </div>
  );
}

function Kpi({ label, icon: Icon, value, unit, sub }: { label: string; icon: typeof Scale; value: string; unit?: string; sub?: string }) {
  return (
    <div className="rounded-3xl glass p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="mt-3 font-num text-3xl font-semibold">{value}{unit ? <span className="text-sm text-muted-foreground"> {unit}</span> : null}</div>
      {sub ? <div className="mt-1 text-xs text-muted-foreground">{sub}</div> : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-num font-medium">{value}</span>
    </div>
  );
}
