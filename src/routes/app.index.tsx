import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Flame, Dumbbell, Droplet, Scale, Sparkles, Plus, Minus, Trash2, Pencil,
  Utensils, Bot, CalendarDays, ChevronRight, Wheat, Nut, AlertCircle,
} from "lucide-react";
import {
  Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

import { useAuth } from "../lib/auth-context";
import { dateKey, daysAgoKey, shortDate, MEAL_TYPES, num } from "../lib/nutrition";
import {
  useTargets, useMealsForDate, useMealHistory, useWaterForDate, useWeightLogs,
  useLogMeal, useDeleteMeal, useUpdateMeal, useAddWater, useLogWeight, sumMacros,
  type MealLog,
} from "../lib/nutrition-data";
import { Bar, CardSkeleton, ChartSkeleton, EmptyState, EstimateNote, Modal } from "../components/nutrition/primitives";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "Today's Dashboard — RP Nutrition" },
      { name: "description", content: "Your estimated calorie and macro targets, logged meals, water and weight — all in one place." },
      { property: "og:title", content: "Today's Dashboard — RP Nutrition" },
      { property: "og:description", content: "Track calories, macros, water and weight against targets estimated from your profile." },
    ],
  }),
  component: Dashboard,
});

const MEAL_LABEL: Record<string, string> = {
  breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack",
};

type Panel = null | "calories" | "protein" | "water" | "weight" | "meals" | "logMeal" | "logWeight" | "editMeal";

function Dashboard() {
  const { user } = useAuth();
  const nav = useNavigate();
  const today = dateKey();

  const { targets, profile, isLoading: profileLoading } = useTargets();
  const meals = useMealsForDate(today);
  const water = useWaterForDate(today);
  const history = useMealHistory(30);
  const weights = useWeightLogs();

  const logMeal = useLogMeal();
  const deleteMeal = useDeleteMeal();
  const updateMeal = useUpdateMeal();
  const addWater = useAddWater();
  const logWeight = useLogWeight();

  const [panel, setPanel] = useState<Panel>(null);
  const [editing, setEditing] = useState<MealLog | null>(null);
  const close = () => {
    setPanel(null);
    setEditing(null);
  };

  const firstName =
    profile?.full_name?.split(" ")[0] ||
    user?.user_metadata?.full_name?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "there";
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const todayMeals = meals.data ?? [];
  const totals = useMemo(() => sumMacros(todayMeals), [todayMeals]);
  const waterMl = water.data ?? 0;

  const weightRows = weights.data ?? [];
  const currentWeight = weightRows.length
    ? weightRows[weightRows.length - 1]!.weight_kg
    : profile?.weight_kg
      ? num(profile.weight_kg)
      : null;
  const startWeight = weightRows.length ? weightRows[0]!.weight_kg : null;
  const weightChange = currentWeight !== null && startWeight !== null ? currentWeight - startWeight : null;

  // Weekly calories: real logged data only, zero-filled for days with no logs.
  const weekly = useMemo(() => {
    const byDate = new Map<string, number>();
    for (const m of history.data ?? []) {
      byDate.set(m.log_date, (byDate.get(m.log_date) ?? 0) + num(m.calories));
    }
    return Array.from({ length: 7 }, (_, i) => {
      const key = daysAgoKey(6 - i);
      return { d: shortDate(key), key, v: Math.round(byDate.get(key) ?? 0) };
    });
  }, [history.data]);

  const loggedDaysThisWeek = weekly.filter((d) => d.v > 0).length;
  const caloriesLeft = Math.max(0, targets.calories - totals.calories);

  const recommendations = useMemo(
    () => buildRecommendations({ targets, totals, waterMl, mealCount: todayMeals.length, loggedDaysThisWeek }),
    [targets, totals, waterMl, todayMeals.length, loggedDaysThisWeek],
  );

  const loading = profileLoading || meals.isLoading || water.isLoading;

  return (
    <div className="space-y-6 pb-24 lg:pb-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{greet}, {firstName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {targets.goalLabel} · {targets.complete ? "targets estimated from your profile" : "add your details for personalised targets"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPanel("logMeal")}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:brightness-110 active:scale-95"
        >
          <Plus className="h-4 w-4" /> Add meal
        </button>
      </div>

      {!profileLoading && !targets.complete && (
        <Link to="/app/settings" className="flex items-center gap-3 rounded-3xl glass p-4 text-sm hover:bg-white/5">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
          <span className="flex-1">
            Add your age, height and weight to unlock personalised calorie and macro estimates.
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <QuickAction icon={Utensils} label="Log meal" onClick={() => setPanel("logMeal")} />
        <QuickAction icon={Droplet} label="Add water" onClick={() => setPanel("water")} />
        <QuickAction icon={Scale} label="Log weight" onClick={() => setPanel("logWeight")} />
        <QuickAction icon={Bot} label="Ask AI" onClick={() => nav({ to: "/app/coach" })} />
        <QuickAction icon={CalendarDays} label="Meal plan" onClick={() => nav({ to: "/app/meal-plans" })} />
      </div>

      {/* Metric cards */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <CardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Calories" icon={Flame} onClick={() => setPanel("calories")}
            value={Math.round(totals.calories).toLocaleString()}
            unit={`/ ${targets.calories.toLocaleString()} kcal`}
            sub={`${caloriesLeft.toLocaleString()} kcal remaining (est.)`}
            bar={{ value: totals.calories, max: targets.calories }}
          />
          <MetricCard
            label="Protein" icon={Dumbbell} onClick={() => setPanel("protein")}
            value={`${Math.round(totals.protein)}`} unit={`/ ${targets.protein} g`}
            sub={`${Math.max(0, targets.protein - Math.round(totals.protein))} g to go`}
            bar={{ value: totals.protein, max: targets.protein }}
          />
          <MetricCard
            label="Water" icon={Droplet} onClick={() => setPanel("water")}
            value={(waterMl / 1000).toFixed(2)} unit={`/ ${(targets.waterMl / 1000).toFixed(1)} L`}
            sub="Tap to add a glass"
            bar={{ value: waterMl, max: targets.waterMl, tone: "sky" }}
          />
          <MetricCard
            label="Weight" icon={Scale} onClick={() => setPanel("weight")}
            value={currentWeight !== null ? currentWeight.toFixed(1) : "—"}
            unit={currentWeight !== null ? "kg" : ""}
            sub={
              weightChange === null
                ? "Log your weight to start a trend"
                : `${weightChange > 0 ? "+" : ""}${weightChange.toFixed(1)} kg since first entry`
            }
          />
        </div>
      )}

      {/* Carbs / fat / fiber */}
      {!loading && (
        <div className="grid gap-4 sm:grid-cols-3">
          <MacroMini label="Carbs" icon={Wheat} value={totals.carbs} target={targets.carbs} />
          <MacroMini label="Fat" icon={Nut} value={totals.fat} target={targets.fat} />
          <MacroMini label="Fiber" icon={Sparkles} value={totals.fiber} target={targets.fiber} />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Today's meals */}
        <div className="rounded-3xl glass p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Today's meals</h3>
              <p className="text-xs text-muted-foreground">
                {todayMeals.length} logged · ~{Math.round(totals.calories).toLocaleString()} kcal estimated
              </p>
            </div>
            <button onClick={() => setPanel("logMeal")} className="rounded-full glass px-3 py-1.5 text-xs hover:bg-white/5">
              <Plus className="mr-1 inline h-3 w-3" /> Add
            </button>
          </div>

          {meals.isLoading ? (
            <div className="mt-5 space-y-2">
              {[0, 1, 2].map((i) => <CardSkeleton key={i} className="p-4" />)}
            </div>
          ) : todayMeals.length === 0 ? (
            <div className="mt-5">
              <EmptyState
                icon={<Utensils className="h-5 w-5" />}
                title="You haven't logged any meals today."
                description="Log what you eat and your calories, macros and progress update instantly."
                action={
                  <button onClick={() => setPanel("logMeal")} className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:brightness-110">
                    Log your first meal
                  </button>
                }
              />
            </div>
          ) : (
            <ul className="mt-5 space-y-2">
              {todayMeals.map((m) => (
                <li key={m.id} className="flex items-center gap-3 rounded-2xl bg-white/[0.03] px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{m.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {MEAL_LABEL[m.meal_type] ?? m.meal_type} · <span className="font-num">{Math.round(num(m.protein))}g</span> protein ·{" "}
                      <span className="font-num">{Math.round(num(m.carbs))}g</span> carbs · <span className="font-num">{Math.round(num(m.fat))}g</span> fat
                    </div>
                  </div>
                  <div className="font-num text-sm">{Math.round(num(m.calories))}<span className="text-xs text-muted-foreground"> kcal</span></div>
                  <button
                    onClick={() => { setEditing(m); setPanel("editMeal"); }}
                    aria-label={`Edit ${m.name}`}
                    className="grid h-8 w-8 place-items-center rounded-xl text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => deleteMeal.mutate(m.id)}
                    aria-label={`Remove ${m.name}`}
                    className="grid h-8 w-8 place-items-center rounded-xl text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4"><EstimateNote /></div>
        </div>

        {/* AI recommendations */}
        <div className="rounded-3xl glass p-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-lg font-medium">Suggestions</h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Based on what you've logged today.</p>
          <ul className="mt-4 space-y-2">
            {recommendations.map((r) => (
              <li key={r} className="rounded-2xl bg-white/[0.03] px-4 py-3 text-sm text-muted-foreground">{r}</li>
            ))}
          </ul>
          <Link to="/app/coach" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full glass py-2 text-xs hover:bg-white/5">
            <Bot className="h-3.5 w-3.5" /> Ask the AI coach
          </Link>
        </div>
      </div>

      {/* Weekly progress */}
      {history.isLoading ? (
        <ChartSkeleton />
      ) : loggedDaysThisWeek === 0 ? (
        <EmptyState
          icon={<Flame className="h-5 w-5" />}
          title="Keep logging your meals to unlock your nutrition trends."
          description="Your weekly calorie chart appears as soon as you have logged days."
        />
      ) : (
        <div className="rounded-3xl glass p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-medium">Weekly progress</h3>
              <p className="text-xs text-muted-foreground">
                Logged calories over the last 7 days · meals logged on {loggedDaysThisWeek} of 7 days
              </p>
            </div>
            <Link to="/app/progress" className="rounded-full glass px-3 py-1.5 text-xs hover:bg-white/5">Full progress</Link>
          </div>
          <div className="mt-4 h-56">
            <ResponsiveContainer>
              <AreaChart data={weekly}>
                <defs>
                  <linearGradient id="dashCal" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#2EE6A6" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#2EE6A6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="d" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "#10261C", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12 }}
                  formatter={(v) => [`${Number(v).toLocaleString()} kcal`, "Logged"]}
                />
                <Area type="monotone" dataKey="v" stroke="#2EE6A6" strokeWidth={2} fill="url(#dashCal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Panels ─────────────────────────────────────────────── */}

      <Modal open={panel === "logMeal"} onClose={close} title="Log a meal" subtitle="Nutrition values are your estimates.">
        <MealForm
          pending={logMeal.isPending}
          onSubmit={(meal) => logMeal.mutate(meal, { onSuccess: close })}
        />
      </Modal>

      <Modal open={panel === "calories"} onClose={close} title="Today's nutrition" subtitle="Estimated from your logged meals.">
        <div className="space-y-4">
          <SummaryRow label="Calorie target (estimated)" value={`${targets.calories.toLocaleString()} kcal`} />
          <SummaryRow label="Consumed (logged)" value={`${Math.round(totals.calories).toLocaleString()} kcal`} />
          <SummaryRow label="Remaining" value={`${caloriesLeft.toLocaleString()} kcal`} />
          <Bar value={totals.calories} max={targets.calories} />
          <div className="grid grid-cols-2 gap-3 pt-2">
            <SummaryRow label="Protein" value={`${Math.round(totals.protein)} / ${targets.protein} g`} />
            <SummaryRow label="Carbs" value={`${Math.round(totals.carbs)} / ${targets.carbs} g`} />
            <SummaryRow label="Fat" value={`${Math.round(totals.fat)} / ${targets.fat} g`} />
            <SummaryRow label="Fiber" value={`${Math.round(totals.fiber)} / ${targets.fiber} g`} />
          </div>
          {targets.complete && (
            <div className="grid grid-cols-3 gap-3 rounded-2xl bg-white/[0.03] p-4 text-center">
              <Stat label="BMI" value={targets.bmi?.toFixed(1) ?? "—"} />
              <Stat label="BMR" value={`${targets.bmr?.toLocaleString()}`} />
              <Stat label="TDEE" value={`${targets.tdee?.toLocaleString()}`} />
            </div>
          )}
          <EstimateNote>
            Targets use the Mifflin–St Jeor equation with an activity multiplier and a goal adjustment. Treat every number as an estimate.
          </EstimateNote>
        </div>
      </Modal>

      <Modal open={panel === "protein"} onClose={close} title="Protein breakdown" subtitle="Per meal, from your logs.">
        {todayMeals.length === 0 ? (
          <EmptyState title="No meals logged yet today." description="Log a meal to see your protein breakdown." />
        ) : (
          <div className="space-y-3">
            {todayMeals.map((m) => (
              <div key={m.id}>
                <div className="flex justify-between text-sm">
                  <span className="truncate pr-3">{m.name}</span>
                  <span className="font-num">{Math.round(num(m.protein))} g</span>
                </div>
                <div className="mt-1"><Bar value={num(m.protein)} max={Math.max(targets.protein, 1)} /></div>
              </div>
            ))}
            <SummaryRow label="Total protein" value={`${Math.round(totals.protein)} / ${targets.protein} g`} />
          </div>
        )}
      </Modal>

      <Modal open={panel === "water"} onClose={close} title="Water intake" subtitle={`Goal ${(targets.waterMl / 1000).toFixed(1)} L per day`}>
        <div className="space-y-5">
          <div className="text-center">
            <div className="font-num text-4xl font-semibold">{(waterMl / 1000).toFixed(2)}<span className="text-base text-muted-foreground"> L</span></div>
            <div className="mt-3"><Bar value={waterMl} max={targets.waterMl} tone="sky" /></div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[200, 250, 500].map((ml) => (
              <button
                key={ml}
                onClick={() => addWater.mutate(ml)}
                className="rounded-2xl glass py-3 text-sm hover:bg-white/5"
              >
                <Plus className="mr-1 inline h-3 w-3" />{ml} ml
              </button>
            ))}
          </div>
          <button
            onClick={() => (waterMl > 0 ? addWater.mutate(-250) : toast.error("Nothing to remove yet."))}
            className="w-full rounded-2xl glass py-2 text-xs text-muted-foreground hover:bg-white/5"
          >
            <Minus className="mr-1 inline h-3 w-3" /> Remove 250 ml
          </button>
        </div>
      </Modal>

      <Modal open={panel === "logWeight"} onClose={close} title="Log today's weight" subtitle="One entry per day — logging again updates today.">
        <WeightForm pending={logWeight.isPending} onSubmit={(w) => logWeight.mutate({ weightKg: w }, { onSuccess: close })} />
      </Modal>

      <Modal open={panel === "weight"} onClose={close} title="Weight" subtitle="Your latest entries.">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <Stat label="Current" value={currentWeight !== null ? `${currentWeight.toFixed(1)} kg` : "—"} />
            <Stat label="Starting" value={startWeight !== null ? `${startWeight.toFixed(1)} kg` : "—"} />
            <Stat label="Change" value={weightChange !== null ? `${weightChange > 0 ? "+" : ""}${weightChange.toFixed(1)} kg` : "—"} />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setPanel("logWeight")} className="flex-1 rounded-full bg-primary py-2 text-sm font-medium text-primary-foreground hover:brightness-110">
              Log weight
            </button>
            <Link to="/app/progress" onClick={close} className="flex-1 rounded-full glass py-2 text-center text-sm hover:bg-white/5">
              Open progress
            </Link>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── pieces ──────────────────────────────────────────────────────────────────

function QuickAction({ icon: Icon, label, onClick }: { icon: typeof Flame; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 rounded-2xl glass px-3 py-3 text-sm transition hover:bg-white/5 active:scale-[0.98]">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <span className="truncate">{label}</span>
    </button>
  );
}

function MetricCard({
  label, icon: Icon, value, unit, sub, bar, onClick,
}: {
  label: string; icon: typeof Flame; value: string; unit?: string; sub?: string;
  bar?: { value: number; max: number; tone?: "primary" | "amber" | "sky" }; onClick?: () => void;
}) {
  return (
    <button onClick={onClick} className="rounded-3xl glass p-5 text-left transition hover:bg-white/5 active:scale-[0.99]">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="mt-3 font-num text-3xl font-semibold">
        {value}{unit ? <span className="text-sm text-muted-foreground"> {unit}</span> : null}
      </div>
      {bar ? <div className="mt-3"><Bar value={bar.value} max={bar.max} tone={bar.tone} /></div> : null}
      {sub ? <div className="mt-2 text-xs text-muted-foreground">{sub}</div> : null}
    </button>
  );
}

function MacroMini({ label, icon: Icon, value, target }: { label: string; icon: typeof Flame; value: number; target: number }) {
  return (
    <div className="rounded-3xl glass p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-primary/80" />
      </div>
      <div className="mt-2 font-num text-2xl font-semibold">
        {Math.round(value)}<span className="text-sm text-muted-foreground"> / {target} g</span>
      </div>
      <div className="mt-3"><Bar value={value} max={target} tone="amber" /></div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-num font-medium">{value}</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-num text-lg font-semibold">{value}</div>
    </div>
  );
}

function MealForm({
  pending, onSubmit,
}: {
  pending: boolean;
  onSubmit: (m: { name: string; meal_type: string; calories: number; protein: number; carbs: number; fat: number; fiber: number }) => void;
}) {
  const [f, setF] = useState({ name: "", meal_type: "snack", calories: "", protein: "", carbs: "", fat: "", fiber: "" });
  const field = "w-full rounded-2xl bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-primary";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const kcal = Number(f.calories);
        if (!f.name.trim()) return toast.error("Give your meal a name.");
        if (!Number.isFinite(kcal) || kcal <= 0 || kcal > 6000) return toast.error("Enter calories between 1 and 6000.");
        onSubmit({
          name: f.name, meal_type: f.meal_type, calories: kcal,
          protein: Number(f.protein) || 0, carbs: Number(f.carbs) || 0,
          fat: Number(f.fat) || 0, fiber: Number(f.fiber) || 0,
        });
      }}
      className="space-y-3"
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <select aria-label="Meal type" value={f.meal_type} onChange={(e) => setF({ ...f, meal_type: e.target.value })} className={field}>
          {MEAL_TYPES.map((t) => <option key={t} value={t}>{MEAL_LABEL[t]}</option>)}
        </select>
        <input aria-label="Meal name" placeholder="What did you eat?" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={`${field} sm:col-span-2`} />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <input aria-label="Calories" inputMode="numeric" placeholder="kcal" value={f.calories} onChange={(e) => setF({ ...f, calories: e.target.value })} className={field} />
        <input aria-label="Protein grams" inputMode="numeric" placeholder="protein g" value={f.protein} onChange={(e) => setF({ ...f, protein: e.target.value })} className={field} />
        <input aria-label="Carbs grams" inputMode="numeric" placeholder="carbs g" value={f.carbs} onChange={(e) => setF({ ...f, carbs: e.target.value })} className={field} />
        <input aria-label="Fat grams" inputMode="numeric" placeholder="fat g" value={f.fat} onChange={(e) => setF({ ...f, fat: e.target.value })} className={field} />
        <input aria-label="Fiber grams" inputMode="numeric" placeholder="fiber g" value={f.fiber} onChange={(e) => setF({ ...f, fiber: e.target.value })} className={field} />
      </div>
      <button disabled={pending} className="w-full rounded-full bg-primary py-2.5 text-sm font-medium text-primary-foreground transition hover:brightness-110 disabled:opacity-60">
        {pending ? "Saving…" : "Log meal"}
      </button>
      <EstimateNote>Nutrition you enter is stored as your own estimate.</EstimateNote>
    </form>
  );
}

function WeightForm({ pending, onSubmit }: { pending: boolean; onSubmit: (w: number) => void }) {
  const [v, setV] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const w = Number(v);
        if (!Number.isFinite(w) || w <= 20 || w >= 400) return toast.error("Enter a weight between 20 and 400 kg.");
        onSubmit(w);
      }}
      className="space-y-3"
    >
      <input
        aria-label="Weight in kilograms" inputMode="decimal" placeholder="e.g. 72.4"
        value={v} onChange={(e) => setV(e.target.value)}
        className="w-full rounded-2xl bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-primary"
      />
      <button disabled={pending} className="w-full rounded-full bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:brightness-110 disabled:opacity-60">
        {pending ? "Saving…" : "Save weight"}
      </button>
    </form>
  );
}

function buildRecommendations({
  targets, totals, waterMl, mealCount, loggedDaysThisWeek,
}: {
  targets: { calories: number; protein: number; waterMl: number; fiber: number; goalLabel: string };
  totals: { calories: number; protein: number; fiber: number };
  waterMl: number; mealCount: number; loggedDaysThisWeek: number;
}) {
  const out: string[] = [];
  const proteinLeft = Math.round(targets.protein - totals.protein);
  const calLeft = Math.round(targets.calories - totals.calories);

  if (mealCount === 0) out.push("Nothing logged yet today — log your first meal to see live estimates.");
  if (proteinLeft > 20) out.push(`About ${proteinLeft} g of protein left. A high-protein snack would close most of that gap.`);
  if (calLeft < 0) out.push(`You're roughly ${Math.abs(calLeft)} kcal above today's estimated target.`);
  else if (calLeft > 0 && mealCount > 0) out.push(`Around ${calLeft} kcal of room left against your estimated target.`);
  if (waterMl < targets.waterMl * 0.5) out.push(`Water is at ${(waterMl / 1000).toFixed(1)} L — aim for ${(targets.waterMl / 1000).toFixed(1)} L today.`);
  if (Math.round(totals.fiber) < targets.fiber * 0.5 && mealCount > 0) out.push("Fiber is running low — vegetables, beans or oats help.");
  if (loggedDaysThisWeek >= 5) out.push(`Strong consistency: ${loggedDaysThisWeek} logged days this week.`);
  if (out.length === 0) out.push(`On track against your ${targets.goalLabel.toLowerCase()} estimates today.`);
  return out.slice(0, 4);
}
