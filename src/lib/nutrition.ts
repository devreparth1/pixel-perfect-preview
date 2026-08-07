export type Profile = {
  age: number;
  gender: "female" | "male" | "other";
  heightCm: number;
  weightKg: number;
  activity: "sedentary" | "light" | "moderate" | "active" | "athlete";
  goal: "lose" | "maintain" | "gain";
  diet: string;
  allergies: string[];
};

export const DEFAULT_PROFILE: Profile = {
  age: 28,
  gender: "female",
  heightCm: 170,
  weightKg: 72,
  activity: "moderate",
  goal: "gain",
  diet: "omnivore",
  allergies: [],
};

const ACTIVITY_FACTOR: Record<Profile["activity"], number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  athlete: 1.9,
};

export type Targets = {
  bmi: number;
  bmr: number;
  tdee: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  goalLabel: string;
};

/** Mifflin–St Jeor BMR, activity-scaled TDEE, goal-adjusted calories & macros. */
export function computeTargets(p: Profile): Targets {
  const heightCm = Math.max(120, Math.min(230, p.heightCm));
  const weightKg = Math.max(35, Math.min(250, p.weightKg));
  const age = Math.max(14, Math.min(90, p.age));

  const sexOffset = p.gender === "male" ? 5 : p.gender === "female" ? -161 : -78;
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + sexOffset;
  const tdee = bmr * ACTIVITY_FACTOR[p.activity];

  const adjust = p.goal === "lose" ? -0.18 : p.goal === "gain" ? 0.12 : 0;
  const calories = Math.round((tdee * (1 + adjust)) / 10) * 10;

  const proteinPerKg = p.goal === "lose" ? 2.2 : p.goal === "gain" ? 2.0 : 1.8;
  const protein = Math.round(weightKg * proteinPerKg);
  const fat = Math.round((calories * (p.diet === "keto" ? 0.6 : 0.28)) / 9);
  const carbs = Math.max(30, Math.round((calories - protein * 4 - fat * 9) / 4));

  const bmi = weightKg / Math.pow(heightCm / 100, 2);

  return {
    bmi: Math.round(bmi * 10) / 10,
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    calories,
    protein,
    carbs,
    fat,
    goalLabel: p.goal === "lose" ? "fat loss" : p.goal === "gain" ? "lean bulk" : "maintenance",
  };
}

export type Meal = {
  slot: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  time: string;
  ingredients: string[];
};

export type MealPlan = {
  targets: Targets;
  meals: Meal[];
  generatedAt: string;
  source: "ai" | "fallback";
  note?: string;
};

const PROFILE_KEY = "rp-nutrition:profile";

export function saveProfile(p: Profile) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
}

export function loadProfile(): Profile {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    return { ...DEFAULT_PROFILE, ...(JSON.parse(raw) as Partial<Profile>) };
  } catch {
    return DEFAULT_PROFILE;
  }
}
