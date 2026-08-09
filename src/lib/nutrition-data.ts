import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "./supabase";
import { useAuth } from "./auth-context";
import {
  computeTargets, dateKey, daysAgoKey, num,
  type MealType, type NutritionProfile, type Targets,
} from "./nutrition";

// ─── shared types ────────────────────────────────────────────────────────────

export type ProfileRow = {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  age: number | null;
  gender: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  target_weight_kg: number | null;
  activity_level: string;
  goal: string;
  diet: string;
  allergies: string[];
  water_goal_ml: number;
  onboarded: boolean;
};

export type MealLog = {
  id: string;
  log_date: string;
  meal_type: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  recipe_id: string | null;
  source: string;
  created_at: string;
};

export type WeightLog = { id: string; log_date: string; weight_kg: number };

export type Recipe = {
  id: string;
  user_id: string | null;
  name: string;
  description: string;
  image_url: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  ingredients: string[];
  instructions: string[];
  prep_minutes: number;
  cook_minutes: number;
  servings: number;
  difficulty: string;
  dietary_tags: string[];
  cuisine: string;
  meal_type: string;
  is_ai_generated: boolean;
  created_at: string;
};

export type MacroTotals = { calories: number; protein: number; carbs: number; fat: number; fiber: number };

export const ZERO_TOTALS: MacroTotals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };

export function sumMacros(rows: Pick<MealLog, "calories" | "protein" | "carbs" | "fat" | "fiber">[]): MacroTotals {
  return rows.reduce<MacroTotals>(
    (a, r) => ({
      calories: a.calories + num(r.calories),
      protein: a.protein + num(r.protein),
      carbs: a.carbs + num(r.carbs),
      fat: a.fat + num(r.fat),
      fiber: a.fiber + num(r.fiber),
    }),
    { ...ZERO_TOTALS },
  );
}

/** Never surface raw database errors to users. */
export function friendlyError(e: unknown, fallback = "Something went wrong. Please try again.") {
  if (typeof e === "object" && e && "message" in e) {
    const msg = String((e as { message: string }).message);
    if (/duplicate key/i.test(msg)) return "That entry already exists.";
    if (/row-level security|permission/i.test(msg)) return "You don't have access to that data.";
    if (/violates check constraint/i.test(msg)) return "That value doesn't look right.";
    if (/failed to fetch|network/i.test(msg)) return "Network problem — check your connection.";
    if (/jwt|token|expired/i.test(msg)) return "Your session expired. Please sign in again.";
  }
  return fallback;
}

const HISTORY_DAYS = 90;

// ─── keys ────────────────────────────────────────────────────────────────────

export const qk = {
  profile: (u: string) => ["profile", u] as const,
  mealsToday: (u: string, d: string) => ["meal-logs", u, d] as const,
  mealsRange: (u: string) => ["meal-logs-range", u] as const,
  water: (u: string, d: string) => ["water", u, d] as const,
  waterRange: (u: string) => ["water-range", u] as const,
  weights: (u: string) => ["weight-logs", u] as const,
  recipes: () => ["recipes"] as const,
  favorites: (u: string) => ["favorites", u] as const,
  plan: (u: string, d: string) => ["meal-plan", u, d] as const,
};

function invalidateNutrition(qc: QueryClient, uid: string) {
  qc.invalidateQueries({ queryKey: ["meal-logs", uid] });
  qc.invalidateQueries({ queryKey: qk.mealsRange(uid) });
  qc.invalidateQueries({ queryKey: ["water", uid] });
  qc.invalidateQueries({ queryKey: qk.waterRange(uid) });
}

function useUid() {
  const { user } = useAuth();
  return user?.id ?? null;
}

// ─── profile ─────────────────────────────────────────────────────────────────

export function useProfile() {
  const uid = useUid();
  return useQuery({
    queryKey: qk.profile(uid ?? "anon"),
    enabled: !!uid,
    staleTime: 60_000,
    queryFn: async (): Promise<ProfileRow | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", uid!)
        .maybeSingle();
      if (error) throw error;
      return (data as ProfileRow | null) ?? null;
    },
  });
}

export function toNutritionProfile(p: ProfileRow | null | undefined): NutritionProfile | null {
  if (!p) return null;
  return {
    age: p.age,
    gender: p.gender,
    heightCm: p.height_cm === null ? null : num(p.height_cm),
    weightKg: p.weight_kg === null ? null : num(p.weight_kg),
    targetWeightKg: p.target_weight_kg === null ? null : num(p.target_weight_kg),
    activity: p.activity_level,
    goal: p.goal,
    diet: p.diet,
    waterGoalMl: p.water_goal_ml,
  };
}

/** Calculated (estimated) daily targets derived from the stored profile. */
export function useTargets(): { targets: Targets; profile: ProfileRow | null; isLoading: boolean } {
  const { data, isLoading } = useProfile();
  const profile = data ?? null;
  return { targets: computeTargets(toNutritionProfile(profile)), profile, isLoading };
}

export function useUpdateProfile() {
  const uid = useUid();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<ProfileRow>) => {
      const { error } = await supabase
        .from("profiles")
        .update(patch as never)
        .eq("user_id", uid!);
      if (error) throw error;
    },
    onSuccess: () => uid && qc.invalidateQueries({ queryKey: qk.profile(uid) }),
    onError: (e) => toast.error(friendlyError(e, "Couldn't save your profile.")),
  });
}

// ─── meal logs ───────────────────────────────────────────────────────────────

const MEAL_COLS = "id,log_date,meal_type,name,calories,protein,carbs,fat,fiber,recipe_id,source,created_at";

export function useMealsForDate(date = dateKey()) {
  const uid = useUid();
  return useQuery({
    queryKey: qk.mealsToday(uid ?? "anon", date),
    enabled: !!uid,
    queryFn: async (): Promise<MealLog[]> => {
      const { data, error } = await supabase
        .from("meal_logs")
        .select(MEAL_COLS)
        .eq("user_id", uid!)
        .eq("log_date", date)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as MealLog[];
    },
  });
}

/** Last 90 days only — enough for weekly/monthly trends without over-fetching. */
export function useMealHistory(days = HISTORY_DAYS) {
  const uid = useUid();
  const from = daysAgoKey(days);
  return useQuery({
    queryKey: [...qk.mealsRange(uid ?? "anon"), days],
    enabled: !!uid,
    queryFn: async (): Promise<MealLog[]> => {
      const { data, error } = await supabase
        .from("meal_logs")
        .select(MEAL_COLS)
        .eq("user_id", uid!)
        .gte("log_date", from)
        .order("log_date", { ascending: true });
      if (error) throw error;
      return (data ?? []) as MealLog[];
    },
  });
}

export type NewMeal = {
  name: string;
  meal_type: MealType | string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  recipe_id?: string | null;
  source?: string;
  log_date?: string;
};

export function useLogMeal() {
  const uid = useUid();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (meal: NewMeal) => {
      const row = {
        user_id: uid!,
        log_date: meal.log_date ?? dateKey(),
        meal_type: meal.meal_type,
        name: meal.name.trim(),
        calories: Math.round(meal.calories),
        protein: Math.round(meal.protein ?? 0),
        carbs: Math.round(meal.carbs ?? 0),
        fat: Math.round(meal.fat ?? 0),
        fiber: Math.round(meal.fiber ?? 0),
        recipe_id: meal.recipe_id ?? null,
        source: meal.source ?? "manual",
      };
      const { data, error } = await supabase
        .from("meal_logs")
        .insert(row as never)
        .select(MEAL_COLS)
        .single();
      if (error) throw error;
      return data as MealLog;
    },
    onSuccess: (m) => {
      if (uid) invalidateNutrition(qc, uid);
      toast.success(`${m.name} logged · ~${m.calories} kcal (estimated)`);
    },
    onError: (e) => toast.error(friendlyError(e, "Couldn't log that meal.")),
  });
}

export function useDeleteMeal() {
  const uid = useUid();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("meal_logs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      if (uid) invalidateNutrition(qc, uid);
      toast.success("Meal removed");
    },
    onError: (e) => toast.error(friendlyError(e, "Couldn't remove that meal.")),
  });
}

// ─── water ───────────────────────────────────────────────────────────────────

export function useWaterForDate(date = dateKey()) {
  const uid = useUid();
  return useQuery({
    queryKey: qk.water(uid ?? "anon", date),
    enabled: !!uid,
    queryFn: async (): Promise<number> => {
      const { data, error } = await supabase
        .from("water_logs")
        .select("amount_ml")
        .eq("user_id", uid!)
        .eq("log_date", date);
      if (error) throw error;
      return (data ?? []).reduce((a, r) => a + num((r as { amount_ml: number }).amount_ml), 0);
    },
  });
}

export function useWaterHistory(days = HISTORY_DAYS) {
  const uid = useUid();
  const from = daysAgoKey(days);
  return useQuery({
    queryKey: [...qk.waterRange(uid ?? "anon"), days],
    enabled: !!uid,
    queryFn: async (): Promise<{ log_date: string; amount_ml: number }[]> => {
      const { data, error } = await supabase
        .from("water_logs")
        .select("log_date,amount_ml")
        .eq("user_id", uid!)
        .gte("log_date", from);
      if (error) throw error;
      return (data ?? []) as { log_date: string; amount_ml: number }[];
    },
  });
}

export function useAddWater() {
  const uid = useUid();
  const qc = useQueryClient();
  const today = dateKey();
  return useMutation({
    mutationFn: async (amountMl: number) => {
      const { error } = await supabase
        .from("water_logs")
        .insert({ user_id: uid!, log_date: today, amount_ml: Math.round(amountMl) } as never);
      if (error) throw error;
      return amountMl;
    },
    // optimistic: the water card should move the instant it's tapped
    onMutate: async (amountMl) => {
      if (!uid) return;
      const key = qk.water(uid, today);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<number>(key) ?? 0;
      qc.setQueryData<number>(key, Math.max(0, prev + amountMl));
      return { prev, key };
    },
    onError: (e, _v, ctx) => {
      if (ctx) qc.setQueryData(ctx.key, ctx.prev);
      toast.error(friendlyError(e, "Couldn't save your water intake."));
    },
    onSuccess: () => {
      if (uid) invalidateNutrition(qc, uid);
    },
  });
}

// ─── weight ──────────────────────────────────────────────────────────────────

export function useWeightLogs() {
  const uid = useUid();
  return useQuery({
    queryKey: qk.weights(uid ?? "anon"),
    enabled: !!uid,
    queryFn: async (): Promise<WeightLog[]> => {
      const { data, error } = await supabase
        .from("weight_logs")
        .select("id,log_date,weight_kg")
        .eq("user_id", uid!)
        .order("log_date", { ascending: true });
      if (error) throw error;
      return ((data ?? []) as WeightLog[]).map((r) => ({ ...r, weight_kg: num(r.weight_kg) }));
    },
  });
}

export function useLogWeight() {
  const uid = useUid();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ weightKg, date }: { weightKg: number; date?: string }) => {
      if (!Number.isFinite(weightKg) || weightKg <= 20 || weightKg >= 400) {
        throw new Error("Enter a weight between 20 and 400 kg.");
      }
      const { error } = await supabase
        .from("weight_logs")
        .upsert(
          { user_id: uid!, log_date: date ?? dateKey(), weight_kg: Math.round(weightKg * 10) / 10 } as never,
          { onConflict: "user_id,log_date" },
        );
      if (error) throw error;
      // keep the profile's current weight in sync so targets stay accurate
      await supabase.from("profiles").update({ weight_kg: weightKg } as never).eq("user_id", uid!);
    },
    onSuccess: () => {
      if (!uid) return;
      qc.invalidateQueries({ queryKey: qk.weights(uid) });
      qc.invalidateQueries({ queryKey: qk.profile(uid) });
      toast.success("Weight saved");
    },
    onError: (e) => toast.error(friendlyError(e, "Couldn't save that weight.")),
  });
}

export function useDeleteWeight() {
  const uid = useUid();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("weight_logs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      if (uid) qc.invalidateQueries({ queryKey: qk.weights(uid) });
      toast.success("Entry deleted");
    },
    onError: (e) => toast.error(friendlyError(e, "Couldn't delete that entry.")),
  });
}

// ─── recipes ─────────────────────────────────────────────────────────────────

const RECIPE_COLS =
  "id,user_id,name,description,image_url,calories,protein,carbs,fat,fiber,ingredients,instructions,prep_minutes,cook_minutes,servings,difficulty,dietary_tags,cuisine,meal_type,is_ai_generated,created_at";

function normalizeRecipe(r: Record<string, unknown>): Recipe {
  const list = (v: unknown): string[] =>
    Array.isArray(v) ? v.map((x) => String(x)) : typeof v === "string" ? [v] : [];
  return {
    ...(r as unknown as Recipe),
    calories: num(r.calories),
    protein: num(r.protein),
    carbs: num(r.carbs),
    fat: num(r.fat),
    fiber: num(r.fiber),
    ingredients: list(r.ingredients),
    instructions: list(r.instructions),
    dietary_tags: list(r.dietary_tags),
  };
}

export function useRecipes() {
  const uid = useUid();
  return useQuery({
    queryKey: qk.recipes(),
    enabled: !!uid,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<Recipe[]> => {
      const { data, error } = await supabase
        .from("recipes")
        .select(RECIPE_COLS)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []).map((r) => normalizeRecipe(r as Record<string, unknown>));
    },
  });
}

export function useFavorites() {
  const uid = useUid();
  return useQuery({
    queryKey: qk.favorites(uid ?? "anon"),
    enabled: !!uid,
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from("recipe_favorites")
        .select("recipe_id")
        .eq("user_id", uid!);
      if (error) throw error;
      return (data ?? []).map((r) => (r as { recipe_id: string }).recipe_id);
    },
  });
}

export function useToggleFavorite() {
  const uid = useUid();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ recipeId, isFavorite }: { recipeId: string; isFavorite: boolean }) => {
      if (isFavorite) {
        const { error } = await supabase
          .from("recipe_favorites")
          .delete()
          .eq("user_id", uid!)
          .eq("recipe_id", recipeId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("recipe_favorites")
          .insert({ user_id: uid!, recipe_id: recipeId } as never);
        if (error && !/duplicate key/i.test(error.message)) throw error;
      }
      return !isFavorite;
    },
    onMutate: async ({ recipeId, isFavorite }) => {
      if (!uid) return;
      const key = qk.favorites(uid);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<string[]>(key) ?? [];
      qc.setQueryData<string[]>(key, isFavorite ? prev.filter((id) => id !== recipeId) : [...prev, recipeId]);
      return { prev, key };
    },
    onError: (e, _v, ctx) => {
      if (ctx) qc.setQueryData(ctx.key, ctx.prev);
      toast.error(friendlyError(e, "Couldn't update your favorites."));
    },
  });
}

export type NewRecipe = Omit<Recipe, "id" | "user_id" | "created_at">;

export function useSaveRecipe() {
  const uid = useUid();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (recipe: NewRecipe) => {
      const { data, error } = await supabase
        .from("recipes")
        .insert({ ...recipe, user_id: uid! } as never)
        .select(RECIPE_COLS)
        .single();
      if (error) throw error;
      return normalizeRecipe(data as Record<string, unknown>);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.recipes() }),
    onError: (e) => toast.error(friendlyError(e, "Couldn't save that recipe.")),
  });
}

// ─── meal plan ───────────────────────────────────────────────────────────────

export function useAddToMealPlan() {
  const uid = useUid();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ recipe, date, mealType }: { recipe: Recipe; date?: string; mealType?: string }) => {
      const plan_date = date ?? dateKey();
      const { error } = await supabase.from("meal_plan_items").insert({
        user_id: uid!,
        plan_date,
        meal_type: mealType ?? recipe.meal_type,
        recipe_id: recipe.id,
        name: recipe.name,
        calories: Math.round(recipe.calories),
        protein: Math.round(recipe.protein),
        carbs: Math.round(recipe.carbs),
        fat: Math.round(recipe.fat),
      } as never);
      if (error) throw error;
      return plan_date;
    },
    onSuccess: (plan_date) => {
      if (uid) qc.invalidateQueries({ queryKey: qk.plan(uid, plan_date) });
      toast.success("Added to your meal plan");
    },
    onError: (e) => toast.error(friendlyError(e, "Couldn't add that to your plan.")),
  });
}

export function useMealPlan(date = dateKey()) {
  const uid = useUid();
  return useQuery({
    queryKey: qk.plan(uid ?? "anon", date),
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meal_plan_items")
        .select("id,plan_date,meal_type,name,calories,protein,carbs,fat,recipe_id")
        .eq("user_id", uid!)
        .eq("plan_date", date);
      if (error) throw error;
      return data ?? [];
    },
  });
}
