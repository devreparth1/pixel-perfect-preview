import { createFileRoute } from "@tanstack/react-router";
import { Clock, Flame, Dumbbell, Heart } from "lucide-react";

export const Route = createFileRoute("/app/recipes")({
  component: Recipes,
});

const RECIPES = [
  { n: "Miso-Glazed Salmon", tag: "High protein", k: 480, p: 42, time: "25 min" },
  { n: "Chicken Quinoa Bowl", tag: "Balanced", k: 520, p: 44, time: "20 min" },
  { n: "Tofu Stir-Fry", tag: "Vegan", k: 410, p: 28, time: "15 min" },
  { n: "Greek Yogurt Parfait", tag: "Breakfast", k: 320, p: 24, time: "5 min" },
  { n: "Turkey Chili", tag: "Meal prep", k: 460, p: 38, time: "40 min" },
  { n: "Overnight Oats", tag: "Breakfast", k: 380, p: 22, time: "5 min" },
];

function Recipes() {
  return (
    <div className="space-y-6 pb-24 lg:pb-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Recipes</h1>
        <p className="mt-1 text-sm text-muted-foreground">Curated for your goals & preferences.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {["All", "High protein", "Vegan", "Vegetarian", "Under 15 min", "Meal prep", "Breakfast"].map((t, i) => (
          <button key={t} className={`rounded-full px-4 py-1.5 text-xs ${i === 0 ? "bg-primary/15 text-primary ring-1 ring-primary/40" : "glass text-muted-foreground hover:bg-white/5"}`}>{t}</button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {RECIPES.map((r) => (
          <article key={r.n} className="rounded-3xl glass p-6">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">{r.tag}</span>
              <button className="text-muted-foreground hover:text-primary"><Heart className="h-4 w-4" /></button>
            </div>
            <h3 className="mt-4 text-lg font-medium">{r.n}</h3>
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {r.time}</span>
              <span className="inline-flex items-center gap-1"><Flame className="h-3 w-3" /> <span className="font-num">{r.k}</span> kcal</span>
              <span className="inline-flex items-center gap-1"><Dumbbell className="h-3 w-3" /> <span className="font-num">{r.p}g</span></span>
            </div>
            <button className="mt-5 w-full rounded-full glass py-2 text-xs hover:bg-white/5">View recipe</button>
          </article>
        ))}
      </div>
    </div>
  );
}