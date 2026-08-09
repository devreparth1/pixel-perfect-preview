/**
 * Nutrition math for RP Nutrition.
 *
 * All values produced here are ESTIMATES derived from published population
 * equations, not medical advice or measured data:
 *  - BMR: Mifflin–St Jeor (1990)
 *  - TDEE: BMR x activity multiplier
 *  - Calorie target: TDEE adjusted for the selected goal
 *  - Macros: protein set per kg bodyweight, fat as % of calories, carbs = remainder
 */

export type Gender = "female" | "male" | "other";
export type Activity = "sedentary" | "light" | "moderate" | "active" | "athlete";
export type Goal = "lose" | "maintain" | "gain";

export type NutritionProfile = {
  age: number | null;
  gender: string | null;
  heightCm: number | null;
  weightKg: number | null;
  targetWeightKg: number | null;
  activity: string;
  goal: string;
  diet: string;
  waterGoalMl: number;
};

export const ACTIVITY_FACTOR: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  athlete: 1.9,
};

export const ACTIVITY_LABEL: Record<Activity, string> = {
  sedentary: "Sedentary",
  light: "Lightly active",
  moderate: "Moderately active",
  active: "Very active",
  athlete: "Athlete",
};

export const GOAL_LABEL: Record<Goal, string> = {
  lose: "Weight loss",
  maintain: "Maintenance",
  gain: "Muscle gain",
};

export const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export type Targets = {
  complete: boolean;
  bmi: number | null;
  bmr: number | null;
  tdee: number | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  waterMl: number;
  goal: Goal;
  goalLabel: string;
  bmiLabel: string | null;
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export function asActivity(v: string | null | undefined): Activity {
  return (v && v in ACTIVITY_FACTOR ? v : "moderate") as Activity;
}

export function asGoal(v: string | null | undefined): Goal {
  return (v && v in GOAL_LABEL ? v : "maintain") as Goal;
}

function bmiLabel(bmi: number) {
  if (bmi < 18.5) return "Below typical range";
  if (bmi < 25) return "Typical range";
  if (bmi < 30) return "Above typical range";
  return "Well above typical range";
}

/** Fallback targets when a profile has no biometrics yet. */
const INCOMPLETE: Targets = {
  complete: false,
  bmi: null,
  bmr: null,
  tdee: null,
  calories: 2000,
  protein: 120,
  carbs: 220,
  fat: 65,
  fiber: 28,
  waterMl: 2500,
  goal: "maintain",
  goalLabel: GOAL_LABEL.maintain,
  bmiLabel: null,
};

export function computeTargets(p: NutritionProfile | null | undefined): Targets {
  if (!p || !p.age || !p.heightCm || !p.weightKg) {
    return { ...INCOMPLETE, waterMl: p?.waterGoalMl || INCOMPLETE.waterMl };
  }

  const heightCm = clamp(Number(p.heightCm), 120, 230);
  const weightKg = clamp(Number(p.weightKg), 35, 300);
  const age = clamp(Number(p.age), 14, 95);
  const activity = asActivity(p.activity);
  const goal = asGoal(p.goal);

  const sexOffset = p.gender === "male" ? 5 : p.gender === "female" ? -161 : -78;
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + sexOffset;
  const tdee = bmr * ACTIVITY_FACTOR[activity];

  const adjust = goal === "lose" ? -0.18 : goal === "gain" ? 0.12 : 0;
  const calories = Math.round((tdee * (1 + adjust)) / 10) * 10;

  const proteinPerKg = goal === "lose" ? 2.2 : goal === "gain" ? 2.0 : 1.8;
  const protein = Math.round(weightKg * proteinPerKg);
  const fatRatio = p.diet === "keto" ? 0.6 : 0.28;
  const fat = Math.round((calories * fatRatio) / 9);
  const carbs = Math.max(30, Math.round((calories - protein * 4 - fat * 9) / 4));
  const fiber = Math.round((calories / 1000) * 14);
  const bmi = weightKg / Math.pow(heightCm / 100, 2);

  return {
    complete: true,
    bmi: Math.round(bmi * 10) / 10,
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    calories,
    protein,
    carbs,
    fat,
    fiber,
    waterMl: p.waterGoalMl || 2500,
    goal,
    goalLabel: GOAL_LABEL[goal],
    bmiLabel: bmiLabel(bmi),
  };
}

// ─── date helpers (local calendar days, ISO yyyy-mm-dd keys) ─────────────────

export function dateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function daysAgoKey(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return dateKey(d);
}

export function shortDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export const num = (v: unknown) => (typeof v === "number" ? v : Number(v ?? 0)) || 0;
