import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { RefreshCw, Clock, Flame, Dumbbell, Trash2, Utensils, CalendarDays, ChefHat, Plus } from "lucide-react";

import { dateKey, shortDate, MEAL_TYPES, num } from "../lib/nutrition";
import {
  useTargets, useRecipes, useMealPlan, useSavePlan, useDeletePlanItem, useLogMeal,
  type Recipe, type NewPlanItem, type PlanItem,
} from "../lib/nutrition-data";
import { CardSkeleton, EmptyState, EstimateNote } from "../components/nutrition/primitives";

export const Route = createFileRoute("/app/meal-plans")({
  head: () => ({
    meta: [
      { title: "Meal Plan — RP Nutrition" },
      { name: "description", content: "Build a daily meal plan from your recipe library, matched to your estimated calorie and macro targets." },
      { property: "og:title", content: "Meal Plan — RP Nutrition" },
      { property: "og:description", content: "Plan breakfast, lunch, dinner and snacks against your daily targets, then log them in one tap." },
    ],
  }),
  component: MealPlans,
});

const MEAL_LABEL: Record<string, string> = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack" };
const SPLIT: Record<string, number> = { breakfast: 0.25, lunch: 0.35, dinner: 0.3, snack: 0.1 };

function dayOffsetKey(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return dateKey(d);
}

function MealPlans() {
  const [offset, setOffset] = useState(0);
  const date = dayOffsetKey(offset);

  const { targets, profile } = useTargets();
  const recipes = useRecipes();
  const plan = useMealPlan(date);
  const savePlan = useSavePlan();
  const deleteItem = useDeletePlanItem();
  const logMeal = useLogMeal();

  const items = (plan.data ?? []) as PlanItem[];

  const totals = useMemo(
    () =>
      items.reduce(
        (a, i) => ({
          calories: a.calories + num(i.calories),
          protein: a.protein + num(i.protein),
          carbs: a.carbs + num(i.carbs),
          fat: a.fat + num(i.fat),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 },
      ),
    [items],
  );

  const library = recipes.data ?? [];

  const buildPlan = (): NewPlanItem[] => {
    const diet = (profile?.diet ?? "omnivore").toLowerCase();
    const allergies = (profile?.allergies ?? []).map((a) => a.toLowerCase()).filter(Boolean);

    const allowed = library.filter((r) => {
      const tags = r.dietary_tags.map((t) => t.toLowerCase());
      if (diet === "vegan" && !tags.includes("vegan")) return false;
      if (diet === "vegetarian" && !tags.includes("vegan") && !tags.includes("vegetarian")) return false;
      const text = `${r.name} ${r.ingredients.join(" ")}`.toLowerCase();
      return !allergies.some((a) => a.length > 2 && text.includes(a));
    });

    const chosen: NewPlanItem[] = [];
    for (const type of MEAL_TYPES) {
      const target = targets.calories * (SPLIT[type] ?? 0.25);
      const pool = allowed.filter((r) => r.meal_type === type);
      const candidates = pool.length ? pool : allowed;
      if (!candidates.length) continue;
      const ranked = [...candidates].sort(
        (a, b) => Math.abs(a.calories - target) - Math.abs(b.calories - target),
      );
      const pick = ranked[Math.floor(Math.random() * Math.min(3, ranked.length))] as Recipe;
      chosen.push({
        plan_date: date,
        meal_type: type,
        recipe_id: pick.id,
        name: pick.name,
        calories: Math.round(pick.calories),
        protein: Math.round(pick.protein),
        carbs: Math.round(pick.carbs),
        fat: Math.round(pick.fat),
      });
    }
    return chosen;
  };

  const regenerate = () => {
    if (!library.length) {
      toast.error("Your recipe library is empty — generate or save recipes first.");
      return;
    }
    const next = buildPlan();
    if (!next.length) {
      toast.error("No recipes match your diet and allergies yet.");
      return;
    }
    savePlan.mutate({ date, items: next });
  };

  const busy = plan.isLoading || recipes.isLoading;

  return (
    <div className="space-y-6 pb-24 lg:pb-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Meal plan</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {targets.goalLabel} · target ~{targets.calories.toLocaleString()} kcal (estimated) · {shortDate(date)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1 rounded-full glass p-1">
            {[0, 1, 2].map((o) => (
              <button
                key={o}
                onClick={() => setOffset(o)}
                className={`rounded-full px-3 py-1.5 text-xs ${offset === o ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-white/5"}`}
              >
                {o === 0 ? "Today" : o === 1 ? "Tomorrow" : shortDate(dayOffsetKey(o))}
              </button>
            ))}
          </div>
          <button
            onClick={regenerate}
            disabled={savePlan.isPending}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:brightness-110 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${savePlan.isPending ? "animate-spin" : ""}`} />
            {items.length ? "Regenerate plan" : "Generate plan"}
          </button>
        </div>
      </div>

      {busy ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <CardSkeleton key={i} />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-5 w-5" />}
          title="No meals planned for this day yet."
          description={
            library.length
              ? "Generate a plan from your recipe library, matched to your estimated targets."
              : "Add or AI-generate a few recipes first, then build your plan from them."
          }
          action={
            library.length ? (
              <button onClick={regenerate} className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:brightness-110">
                Generate plan
              </button>
            ) : (
              <Link to="/app/recipes" className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:brightness-110">
                <ChefHat className="h-4 w-4" /> Go to recipes
              </Link>
            )
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {items.map((m) => (
            <article key={m.id} className="flex flex-col rounded-3xl glass p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-primary">{MEAL_LABEL[m.meal_type] ?? m.meal_type}</span>
                <button
                  onClick={() => deleteItem.mutate({ id: m.id, date })}
                  aria-label={`Remove ${m.name} from plan`}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <h3 className="mt-3 text-lg font-medium">{m.name}</h3>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Flame className="h-3 w-3" /><span className="font-num">{Math.round(num(m.calories))}</span> kcal</span>
                <span className="inline-flex items-center gap-1"><Dumbbell className="h-3 w-3" /><span className="font-num">{Math.round(num(m.protein))}g</span></span>
                <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> planned</span>
              </div>
              <div className="mt-auto flex gap-2 pt-4">
                <button
                  onClick={() =>
                    logMeal.mutate({
                      name: m.name,
                      meal_type: m.meal_type,
                      calories: num(m.calories),
                      protein: num(m.protein),
                      carbs: num(m.carbs),
                      fat: num(m.fat),
                      recipe_id: m.recipe_id,
                      source: "plan",
                      log_date: date,
                    })
                  }
                  disabled={logMeal.isPending}
                  className="flex-1 rounded-full bg-primary py-2 text-xs font-medium text-primary-foreground hover:brightness-110 disabled:opacity-60"
                >
                  <Utensils className="mr-1 inline h-3 w-3" /> Log it
                </button>
                <Link
                  to="/app/recipes"
                  search={m.recipe_id ? ({ recipe: m.recipe_id } as never) : undefined}
                  className="flex-1 rounded-full glass py-2 text-center text-xs hover:bg-white/5"
                >
                  Recipe
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <div className="rounded-3xl glass p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-medium">Planned daily total</h3>
            <Link to="/app/grocery" className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs hover:bg-white/5">
              <Plus className="h-3 w-3" /> Build grocery list
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { l: "Calories", v: Math.round(totals.calories), u: "kcal", g: targets.calories },
              { l: "Protein", v: Math.round(totals.protein), u: "g", g: targets.protein },
              { l: "Carbs", v: Math.round(totals.carbs), u: "g", g: targets.carbs },
              { l: "Fat", v: Math.round(totals.fat), u: "g", g: targets.fat },
            ].map((t) => (
              <div key={t.l} className="rounded-2xl bg-white/[0.03] p-4">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{t.l}</div>
                <div className="mt-2 font-num text-2xl font-semibold">
                  {t.v}<span className="text-sm text-muted-foreground"> / {t.g} {t.u}</span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, (t.v / Math.max(1, t.g)) * 100)}%`, background: "var(--gradient-primary)" }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4"><EstimateNote /></div>
        </div>
      )}
    </div>
  );
}
