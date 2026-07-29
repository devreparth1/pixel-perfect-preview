import { createFileRoute } from "@tanstack/react-router";
import { RefreshCw, Heart, Clock, Flame, Dumbbell } from "lucide-react";

export const Route = createFileRoute("/app/meal-plans")({
  component: MealPlans,
});

const MEALS = [
  { t: "Breakfast", n: "Greek Yogurt Bowl", k: 420, p: 32, c: 48, f: 12, time: "5 min",
    ing: ["200g Greek yogurt", "50g mixed berries", "30g granola", "1 tbsp honey", "10g almonds"] },
  { t: "Lunch", n: "Chicken Quinoa Salad", k: 640, p: 48, c: 62, f: 22, time: "20 min",
    ing: ["160g chicken breast", "80g cooked quinoa", "1 avocado", "Spinach & cherry tomatoes", "Olive oil & lemon"] },
  { t: "Snack", n: "Apple + Almond Butter", k: 210, p: 6, c: 28, f: 10, time: "1 min",
    ing: ["1 apple", "2 tbsp almond butter"] },
  { t: "Dinner", n: "Miso-Glazed Salmon", k: 580, p: 44, c: 45, f: 20, time: "25 min",
    ing: ["180g salmon fillet", "80g brown rice", "100g edamame", "Miso glaze", "Sesame seeds"] },
];

function MealPlans() {
  const total = MEALS.reduce((a, m) => ({ k: a.k + m.k, p: a.p + m.p, c: a.c + m.c, f: a.f + m.f }), { k: 0, p: 0, c: 0, f: 0 });
  return (
    <div className="space-y-6 pb-24 lg:pb-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Meal plan</h1>
          <p className="mt-1 text-sm text-muted-foreground">Personalized for your goal: lean bulk, ~2,200 kcal.</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:brightness-110">
          <RefreshCw className="h-4 w-4" /> Regenerate plan
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {MEALS.map((m) => (
          <article key={m.t} className="flex flex-col rounded-3xl glass p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-primary">{m.t}</span>
              <button className="text-muted-foreground hover:text-primary"><Heart className="h-4 w-4" /></button>
            </div>
            <h3 className="mt-3 text-lg font-medium">{m.n}</h3>
            <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {m.time}</span>
              <span className="inline-flex items-center gap-1"><Flame className="h-3 w-3" /> <span className="font-num">{m.k}</span> kcal</span>
              <span className="inline-flex items-center gap-1"><Dumbbell className="h-3 w-3" /> <span className="font-num">{m.p}g</span></span>
            </div>
            <ul className="mt-4 space-y-1 text-xs text-muted-foreground">
              {m.ing.map((i) => <li key={i}>• {i}</li>)}
            </ul>
            <div className="mt-auto flex gap-2 pt-4">
              <button className="flex-1 rounded-full glass py-2 text-xs hover:bg-white/5">Swap</button>
              <button className="flex-1 rounded-full bg-primary py-2 text-xs font-medium text-primary-foreground hover:brightness-110">Recipe</button>
            </div>
          </article>
        ))}
      </div>

      <div className="rounded-3xl glass p-6">
        <h3 className="text-lg font-medium">Daily total</h3>
        <div className="mt-4 grid grid-cols-4 gap-4">
          {[
            { l: "Calories", v: total.k, u: "kcal", g: 2200 },
            { l: "Protein", v: total.p, u: "g", g: 140 },
            { l: "Carbs", v: total.c, u: "g", g: 240 },
            { l: "Fat", v: total.f, u: "g", g: 72 },
          ].map((t) => (
            <div key={t.l} className="rounded-2xl bg-white/[0.03] p-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{t.l}</div>
              <div className="mt-2 font-num text-2xl font-semibold">{t.v}<span className="text-sm text-muted-foreground"> / {t.g} {t.u}</span></div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                <div className="h-full rounded-full" style={{ width: `${Math.min(100, (t.v / t.g) * 100)}%`, background: "var(--gradient-primary)" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}