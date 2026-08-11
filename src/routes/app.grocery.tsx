import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Printer, RefreshCw, Plus, Trash2, ShoppingCart, CalendarDays } from "lucide-react";

import {
  useGroceryItems, useAddGroceryItems, useToggleGroceryItem, useDeleteGroceryItems,
  useMealPlanRange, useRecipes, type GroceryItem,
} from "../lib/nutrition-data";
import { CardSkeleton, EmptyState } from "../components/nutrition/primitives";

export const Route = createFileRoute("/app/grocery")({
  head: () => ({
    meta: [
      { title: "Grocery List — RP Nutrition" },
      { name: "description", content: "Build a grocery list from your saved meal plan, then check items off as you shop." },
      { property: "og:title", content: "Grocery List — RP Nutrition" },
      { property: "og:description", content: "Ingredients pulled straight from your planned recipes, saved to your account." },
    ],
  }),
  component: Grocery,
});

const CATEGORY_RULES: [string, RegExp][] = [
  ["Produce", /spinach|tomato|avocado|broccoli|kale|lettuce|onion|garlic|pepper|carrot|cucumber|zucchini|mushroom|potato|herb|basil|cilantro|parsley|lemon|lime|apple|banana|berry|berries|orange|mango|fruit|veg/i],
  ["Meat & Fish", /chicken|beef|pork|turkey|lamb|salmon|tuna|shrimp|prawn|fish|bacon|mince/i],
  ["Dairy & Eggs", /milk|yogurt|yoghurt|cheese|feta|butter|cream|egg|paneer/i],
  ["Grains & Bread", /rice|quinoa|oat|pasta|noodle|bread|tortilla|couscous|granola|flour|barley/i],
  ["Pantry", /oil|vinegar|sauce|soy|miso|honey|syrup|salt|pepper|spice|cumin|paprika|stock|broth|tahini|butter|nut|seed|bean|lentil|chickpea|tofu|tempeh|can|tin|sugar|powder/i],
];

function categorize(name: string) {
  for (const [cat, re] of CATEGORY_RULES) if (re.test(name)) return cat;
  return "Other";
}

function Grocery() {
  const items = useGroceryItems();
  const plan = useMealPlanRange(7);
  const recipes = useRecipes();
  const addItems = useAddGroceryItems();
  const toggle = useToggleGroceryItem();
  const remove = useDeleteGroceryItems();
  const [manual, setManual] = useState("");

  const rows = items.data ?? [];
  const grouped = useMemo(() => {
    const map = new Map<string, GroceryItem[]>();
    for (const r of rows) {
      const list = map.get(r.category) ?? [];
      list.push(r);
      map.set(r.category, list);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [rows]);

  const purchased = rows.filter((r) => r.purchased).length;

  const generate = () => {
    const planItems = plan.data ?? [];
    if (!planItems.length) {
      toast.error("Plan some meals first — your grocery list is built from your meal plan.");
      return;
    }
    const byId = new Map((recipes.data ?? []).map((r) => [r.id, r]));
    const ingredients = new Map<string, string>();
    for (const p of planItems) {
      const r = p.recipe_id ? byId.get(p.recipe_id) : undefined;
      if (!r) continue;
      for (const raw of r.ingredients) {
        const name = raw.trim();
        if (!name) continue;
        ingredients.set(name.toLowerCase(), name);
      }
    }
    if (!ingredients.size) {
      toast.error("Your planned meals have no recipe ingredients to pull in yet.");
      return;
    }
    const existing = new Set(rows.map((r) => r.name.toLowerCase()));
    const next = Array.from(ingredients.values())
      .filter((n) => !existing.has(n.toLowerCase()))
      .map((n) => ({ name: n, category: categorize(n) }));
    if (!next.length) {
      toast.success("Your list already covers every planned ingredient.");
      return;
    }
    addItems.mutate(next, { onSuccess: () => toast.success(`${next.length} item${next.length === 1 ? "" : "s"} added`) });
  };

  const addManual = () => {
    const name = manual.trim();
    if (!name) return;
    if (rows.some((r) => r.name.toLowerCase() === name.toLowerCase())) {
      toast.error("That item is already on your list.");
      return;
    }
    addItems.mutate([{ name, category: categorize(name) }], { onSuccess: () => setManual("") });
  };

  return (
    <div className="space-y-6 pb-24 lg:pb-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Grocery list</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Built from your next 7 days of planned meals · {purchased} of {rows.length} picked up
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {purchased > 0 && (
            <button
              onClick={() => remove.mutate(rows.filter((r) => r.purchased).map((r) => r.id))}
              className="inline-flex items-center gap-2 rounded-full glass px-4 py-2 text-sm hover:bg-white/5"
            >
              <Trash2 className="h-4 w-4" /> Clear picked up
            </button>
          )}
          <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-full glass px-4 py-2 text-sm hover:bg-white/5">
            <Printer className="h-4 w-4" /> Print
          </button>
          <button
            onClick={generate}
            disabled={addItems.isPending || plan.isLoading}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:brightness-110 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${addItems.isPending ? "animate-spin" : ""}`} /> Build from meal plan
          </button>
        </div>
      </div>

      <div className="flex gap-2 rounded-3xl glass p-3">
        <input
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addManual())}
          aria-label="Add grocery item"
          placeholder="Add your own item…"
          className="flex-1 rounded-2xl bg-white/[0.03] px-4 py-2 text-sm outline-none placeholder:text-muted-foreground/60"
        />
        <button
          onClick={addManual}
          disabled={addItems.isPending}
          className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:brightness-110 disabled:opacity-60"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      {items.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => <CardSkeleton key={i} />)}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart className="h-5 w-5" />}
          title="Your grocery list is empty."
          description="Build it from your planned meals, or add items yourself above."
          action={
            (plan.data ?? []).length ? (
              <button onClick={generate} className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:brightness-110">
                Build from meal plan
              </button>
            ) : (
              <Link to="/app/meal-plans" className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:brightness-110">
                <CalendarDays className="h-4 w-4" /> Plan meals first
              </Link>
            )
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {grouped.map(([cat, list]) => (
            <div key={cat} className="rounded-3xl glass p-6">
              <h3 className="text-sm font-medium uppercase tracking-wider text-primary">{cat}</h3>
              <ul className="mt-4 space-y-1">
                {list.map((it) => (
                  <li key={it.id} className="flex items-center gap-1">
                    <button
                      onClick={() => toggle.mutate({ id: it.id, purchased: !it.purchased })}
                      className="flex flex-1 items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm hover:bg-white/5"
                    >
                      <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border ${it.purchased ? "border-primary bg-primary/20" : "border-white/15"}`}>
                        {it.purchased && <span className="h-2 w-2 rounded-sm bg-primary" />}
                      </span>
                      <span className={it.purchased ? "text-muted-foreground line-through" : ""}>{it.name}</span>
                    </button>
                    <button
                      onClick={() => remove.mutate([it.id])}
                      aria-label={`Remove ${it.name}`}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-muted-foreground hover:bg-white/5 hover:text-foreground"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
