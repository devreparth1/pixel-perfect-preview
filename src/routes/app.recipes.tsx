import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Clock, Flame, Dumbbell, Heart, Search, Sparkles, ChefHat, Plus, Utensils } from "lucide-react";

import {
  useRecipes, useFavorites, useToggleFavorite, useLogMeal, useAddToMealPlan, useSaveRecipe,
  type Recipe,
} from "../lib/nutrition-data";
import { generateRecipe } from "../lib/recipe-ai.functions";
import { CardSkeleton, EmptyState, EstimateNote, Modal } from "../components/nutrition/primitives";

export const Route = createFileRoute("/app/recipes")({
  head: () => ({
    meta: [
      { title: "Recipes — RP Nutrition" },
      { name: "description", content: "Search, filter and save high-protein, low-calorie and plant-based recipes with estimated nutrition per serving." },
      { property: "og:title", content: "Recipes — RP Nutrition" },
      { property: "og:description", content: "Browse recipes, log them as meals, or generate a new one with AI." },
    ],
  }),
  component: Recipes,
});

const FILTERS = ["All", "Favorites", "High protein", "Low calorie", "Vegetarian", "Vegan", "Breakfast", "Lunch", "Dinner", "Snack"] as const;
type Filter = (typeof FILTERS)[number];
type Sort = "newest" | "calories-asc" | "calories-desc" | "protein-desc" | "time-asc";

function Recipes() {
  const { data: recipes, isLoading, isError } = useRecipes();
  const { data: favoriteIds } = useFavorites();
  const toggleFavorite = useToggleFavorite();
  const logMeal = useLogMeal();
  const addToPlan = useAddToMealPlan();
  const saveRecipe = useSaveRecipe();

  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("All");
  const [sort, setSort] = useState<Sort>("newest");
  const [open, setOpen] = useState<Recipe | null>(null);
  const [showGen, setShowGen] = useState(false);
  const [logged, setLogged] = useState<Record<string, boolean>>({});

  const favorites = favoriteIds ?? [];

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    let out = (recipes ?? []).filter((r) => {
      if (term && !`${r.name} ${r.description} ${r.ingredients.join(" ")} ${r.cuisine}`.toLowerCase().includes(term)) return false;
      switch (filter) {
        case "Favorites": return favorites.includes(r.id);
        case "High protein": return r.protein >= 30;
        case "Low calorie": return r.calories <= 400;
        case "Vegetarian": return r.dietary_tags.includes("vegetarian") || r.dietary_tags.includes("vegan");
        case "Vegan": return r.dietary_tags.includes("vegan");
        case "Breakfast": case "Lunch": case "Dinner": case "Snack":
          return r.meal_type === filter.toLowerCase();
        default: return true;
      }
    });
    out = [...out].sort((a, b) => {
      switch (sort) {
        case "calories-asc": return a.calories - b.calories;
        case "calories-desc": return b.calories - a.calories;
        case "protein-desc": return b.protein - a.protein;
        case "time-asc": return (a.prep_minutes + a.cook_minutes) - (b.prep_minutes + b.cook_minutes);
        default: return b.created_at.localeCompare(a.created_at);
      }
    });
    return out;
  }, [recipes, q, filter, sort, favorites]);

  const logAsMeal = (r: Recipe) => {
    if (logged[r.id]) return toast.info("Already logged this recipe today.");
    setLogged((s) => ({ ...s, [r.id]: true }));
    logMeal.mutate(
      { name: r.name, meal_type: r.meal_type, calories: r.calories, protein: r.protein, carbs: r.carbs, fat: r.fat, fiber: r.fiber, recipe_id: r.id, source: "recipe" },
      { onError: () => setLogged((s) => ({ ...s, [r.id]: false })) },
    );
  };

  return (
    <div className="space-y-6 pb-24 lg:pb-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Recipes</h1>
          <p className="mt-1 text-sm text-muted-foreground">Nutrition shown per serving and estimated.</p>
        </div>
        <button onClick={() => setShowGen(true)} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:brightness-110">
          <Sparkles className="h-4 w-4" /> Generate recipe
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-1 items-center gap-2 rounded-2xl glass px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search recipes or ingredients…"
            aria-label="Search recipes"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
          />
        </div>
        <select aria-label="Sort recipes" value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="rounded-2xl glass px-3 py-2 text-sm outline-none">
          <option value="newest">Newest</option>
          <option value="protein-desc">Highest protein</option>
          <option value="calories-asc">Fewest calories</option>
          <option value="calories-desc">Most calories</option>
          <option value="time-asc">Quickest</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((t) => (
          <button key={t} onClick={() => setFilter(t)}
            className={`rounded-full px-4 py-1.5 text-xs transition ${filter === t ? "bg-primary/15 text-primary ring-1 ring-primary/40" : "glass text-muted-foreground hover:bg-white/5"}`}>
            {t}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2, 3, 4, 5].map((i) => <CardSkeleton key={i} className="h-44" />)}</div>
      ) : isError ? (
        <EmptyState title="We couldn't load recipes." description="Check your connection and try again." />
      ) : list.length === 0 ? (
        <EmptyState icon={<ChefHat className="h-5 w-5" />} title="No recipes match your filters."
          description="Try clearing the search or generating a new recipe with AI."
          action={<button onClick={() => { setQ(""); setFilter("All"); }} className="rounded-full glass px-4 py-2 text-sm hover:bg-white/5">Clear filters</button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((r) => {
            const isFav = favorites.includes(r.id);
            return (
              <article key={r.id} className="flex flex-col rounded-3xl glass p-6">
                <div className="flex items-start justify-between gap-2">
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs capitalize text-primary">{r.meal_type}</span>
                  <button
                    aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
                    onClick={() => toggleFavorite.mutate({ recipeId: r.id, isFavorite: isFav })}
                    className={isFav ? "text-primary" : "text-muted-foreground hover:text-primary"}
                  >
                    <Heart className={`h-4 w-4 ${isFav ? "fill-current" : ""}`} />
                  </button>
                </div>
                <h3 className="mt-4 text-lg font-medium">{r.name}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{r.description}</p>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {r.prep_minutes + r.cook_minutes} min</span>
                  <span className="inline-flex items-center gap-1"><Flame className="h-3 w-3" /> ~<span className="font-num">{r.calories}</span> kcal</span>
                  <span className="inline-flex items-center gap-1"><Dumbbell className="h-3 w-3" /> <span className="font-num">{Math.round(r.protein)}g</span></span>
                </div>
                <div className="mt-5 flex gap-2">
                  <button onClick={() => setOpen(r)} className="flex-1 rounded-full glass py-2 text-xs hover:bg-white/5">View recipe</button>
                  <button onClick={() => logAsMeal(r)} disabled={logged[r.id]} className="rounded-full bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:brightness-110 disabled:opacity-50">
                    {logged[r.id] ? "Logged" : "Log"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Recipe detail */}
      <Modal open={!!open} onClose={() => setOpen(null)} title={open?.name ?? ""} subtitle={open ? `${open.cuisine} · ${open.difficulty} · ${open.servings} serving(s)` : ""} wide>
        {open && (
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground">{open.description}</p>
            <div className="grid grid-cols-3 gap-3 rounded-2xl bg-white/[0.03] p-4 text-center sm:grid-cols-5">
              {[["Calories", `~${open.calories}`], ["Protein", `${Math.round(open.protein)}g`], ["Carbs", `${Math.round(open.carbs)}g`], ["Fat", `${Math.round(open.fat)}g`], ["Fiber", `${Math.round(open.fiber)}g`]].map(([l, v]) => (
                <div key={l}>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{l}</div>
                  <div className="mt-1 font-num text-lg font-semibold">{v}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="rounded-full glass px-3 py-1">Prep {open.prep_minutes} min</span>
              <span className="rounded-full glass px-3 py-1">Cook {open.cook_minutes} min</span>
              {open.dietary_tags.map((t) => <span key={t} className="rounded-full bg-primary/10 px-3 py-1 text-primary">{t}</span>)}
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <h4 className="text-sm font-medium">Ingredients</h4>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {open.ingredients.map((i, idx) => <li key={idx}>• {i}</li>)}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium">Instructions</h4>
                <ol className="mt-2 space-y-2 text-sm text-muted-foreground">
                  {open.instructions.map((s, idx) => <li key={idx}><span className="font-num text-primary">{idx + 1}.</span> {s}</li>)}
                </ol>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => addToPlan.mutate({ recipe: open })} className="rounded-full glass px-4 py-2 text-sm hover:bg-white/5">
                <Plus className="mr-1 inline h-3.5 w-3.5" /> Add to meal plan
              </button>
              <button onClick={() => logAsMeal(open)} disabled={logged[open.id]} className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:brightness-110 disabled:opacity-50">
                <Utensils className="mr-1 inline h-3.5 w-3.5" /> {logged[open.id] ? "Logged today" : "Log as meal"}
              </button>
              <button onClick={() => { setOpen(null); setShowGen(true); }} className="rounded-full glass px-4 py-2 text-sm hover:bg-white/5">
                <Sparkles className="mr-1 inline h-3.5 w-3.5" /> Generate similar
              </button>
            </div>
            <EstimateNote>Nutrition is an estimate per serving, not laboratory-measured data.</EstimateNote>
          </div>
        )}
      </Modal>

      <GenerateModal
        open={showGen}
        onClose={() => setShowGen(false)}
        onSave={async (r, mealType) => {
          const saved = await saveRecipe.mutateAsync({
            name: r.name, description: r.description, image_url: null,
            calories: Math.round(r.calories), protein: Math.round(r.protein), carbs: Math.round(r.carbs),
            fat: Math.round(r.fat), fiber: Math.round(r.fiber),
            ingredients: r.ingredients, instructions: r.instructions,
            prep_minutes: Math.round(r.prep_minutes), cook_minutes: Math.round(r.cook_minutes),
            servings: Math.max(1, Math.round(r.servings)), difficulty: r.difficulty,
            dietary_tags: r.dietary_tags, cuisine: r.cuisine, meal_type: mealType, is_ai_generated: true,
          });
          toast.success("Recipe saved to your library");
          setShowGen(false);
          setOpen(saved);
        }}
      />
    </div>
  );
}

type Gen = Awaited<ReturnType<typeof generateRecipe>>;

function GenerateModal({
  open, onClose, onSave,
}: {
  open: boolean; onClose: () => void;
  onSave: (r: Gen, mealType: string) => Promise<void>;
}) {
  const [f, setF] = useState({ goal: "gain", preference: "non-vegetarian", mealType: "dinner", calories: "550", protein: "40", ingredients: "" });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Gen | null>(null);
  const field = "w-full rounded-2xl bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-primary";

  const run = async () => {
    setBusy(true);
    try {
      const r = await generateRecipe({
        data: {
          goal: f.goal as "lose" | "maintain" | "gain",
          preference: f.preference as "vegetarian" | "vegan" | "non-vegetarian",
          mealType: f.mealType as "breakfast" | "lunch" | "dinner" | "snack",
          calories: Number(f.calories) || 500,
          protein: Number(f.protein) || 30,
          ingredients: f.ingredients.trim() || undefined,
        },
      });
      setResult(r);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "The AI couldn't generate a recipe right now.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={() => { setResult(null); onClose(); }} title="Generate a recipe" subtitle="AI-estimated nutrition — not laboratory-accurate." wide>
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <select aria-label="Goal" value={f.goal} onChange={(e) => setF({ ...f, goal: e.target.value })} className={field}>
            <option value="lose">Weight loss</option><option value="maintain">Maintenance</option><option value="gain">Muscle gain</option>
          </select>
          <select aria-label="Preference" value={f.preference} onChange={(e) => setF({ ...f, preference: e.target.value })} className={field}>
            <option value="non-vegetarian">Non-vegetarian</option><option value="vegetarian">Vegetarian</option><option value="vegan">Vegan</option>
          </select>
          <select aria-label="Meal type" value={f.mealType} onChange={(e) => setF({ ...f, mealType: e.target.value })} className={field}>
            <option value="breakfast">Breakfast</option><option value="lunch">Lunch</option><option value="dinner">Dinner</option><option value="snack">Snack</option>
          </select>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <input aria-label="Target calories" inputMode="numeric" placeholder="calories" value={f.calories} onChange={(e) => setF({ ...f, calories: e.target.value })} className={field} />
          <input aria-label="Target protein" inputMode="numeric" placeholder="protein g" value={f.protein} onChange={(e) => setF({ ...f, protein: e.target.value })} className={field} />
          <input aria-label="Available ingredients" placeholder="ingredients you have" value={f.ingredients} onChange={(e) => setF({ ...f, ingredients: e.target.value })} className={field} />
        </div>
        <button onClick={run} disabled={busy} className="w-full rounded-full bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:brightness-110 disabled:opacity-60">
          {busy ? "Generating…" : "Generate"}
        </button>

        {result && (
          <div className="space-y-4 rounded-3xl bg-white/[0.03] p-5">
            <div>
              <h3 className="text-lg font-medium">{result.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{result.description}</p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center sm:grid-cols-5">
              {[["Calories", `~${Math.round(result.calories)}`], ["Protein", `${Math.round(result.protein)}g`], ["Carbs", `${Math.round(result.carbs)}g`], ["Fat", `${Math.round(result.fat)}g`], ["Fiber", `${Math.round(result.fiber)}g`]].map(([l, v]) => (
                <div key={l}><div className="text-[11px] uppercase tracking-wider text-muted-foreground">{l}</div><div className="mt-1 font-num font-semibold">{v}</div></div>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <ul className="space-y-1 text-sm text-muted-foreground">{result.ingredients.map((i, k) => <li key={k}>• {i}</li>)}</ul>
              <ol className="space-y-2 text-sm text-muted-foreground">{result.instructions.map((s, k) => <li key={k}><span className="font-num text-primary">{k + 1}.</span> {s}</li>)}</ol>
            </div>
            <button onClick={() => onSave(result, f.mealType)} className="w-full rounded-full glass py-2 text-sm hover:bg-white/5">Save to my recipes</button>
            <EstimateNote>AI-estimated nutrition. Verify values before relying on them.</EstimateNote>
          </div>
        )}
      </div>
    </Modal>
  );
}
