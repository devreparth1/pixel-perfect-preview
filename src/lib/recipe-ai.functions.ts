import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const Input = z.object({
  goal: z.enum(["lose", "maintain", "gain"]),
  preference: z.enum(["vegetarian", "vegan", "non-vegetarian"]),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  calories: z.number().min(100).max(1500),
  protein: z.number().min(5).max(120),
  ingredients: z.string().max(400).optional(),
});

export type GeneratedRecipe = {
  name: string; description: string; ingredients: string[]; instructions: string[];
  calories: number; protein: number; carbs: number; fat: number; fiber: number;
  prep_minutes: number; cook_minutes: number; servings: number;
  difficulty: string; dietary_tags: string[]; cuisine: string;
};

const SCHEMA = {
  type: "object",
  properties: {
    name: { type: "string" }, description: { type: "string" },
    ingredients: { type: "array", items: { type: "string" } },
    instructions: { type: "array", items: { type: "string" } },
    calories: { type: "number" }, protein: { type: "number" }, carbs: { type: "number" },
    fat: { type: "number" }, fiber: { type: "number" },
    prep_minutes: { type: "number" }, cook_minutes: { type: "number" }, servings: { type: "number" },
    difficulty: { type: "string" }, cuisine: { type: "string" },
    dietary_tags: { type: "array", items: { type: "string" } },
  },
  required: ["name", "description", "ingredients", "instructions", "calories", "protein", "carbs", "fat", "fiber", "prep_minutes", "cook_minutes", "servings", "difficulty", "cuisine", "dietary_tags"],
  additionalProperties: false,
} as const;

export const generateRecipe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }): Promise<GeneratedRecipe> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI is not configured yet.");

    const prompt = [
      `Create one realistic single-serving-friendly recipe for a ${data.mealType}.`,
      `Goal: ${data.goal === "lose" ? "weight loss" : data.goal === "gain" ? "muscle gain" : "maintenance"}.`,
      `Dietary preference: ${data.preference}.`,
      `Aim for roughly ${data.calories} kcal and ${data.protein} g protein per serving.`,
      data.ingredients ? `Prefer using: ${data.ingredients}.` : "",
      "Ingredients must include quantities. Instructions must be short numbered steps (no numbering prefix).",
      "Nutrition values are approximate estimates.",
    ].filter(Boolean).join(" ");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a nutrition-aware recipe developer. Always return estimated nutrition, never claim lab accuracy." },
          { role: "user", content: prompt },
        ],
        tools: [{ type: "function", function: { name: "emit_recipe", description: "Return the recipe", parameters: SCHEMA } }],
        tool_choice: { type: "function", function: { name: "emit_recipe" } },
      }),
    });

    if (res.status === 429) throw new Error("The AI is busy right now — try again in a moment.");
    if (res.status === 402) throw new Error("AI credits are exhausted for this workspace.");
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[recipe-ai] gateway error", res.status, detail.slice(0, 500));
      throw new Error("The AI couldn't generate a recipe right now.");
    }

    const json = (await res.json()) as {
      choices?: { message?: { tool_calls?: { function?: { arguments?: string } }[] } }[];
    };
    const raw = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!raw) throw new Error("The AI returned an unexpected response.");
    return JSON.parse(raw) as GeneratedRecipe;
  });
