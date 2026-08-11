import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const Input = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(2000) }))
    .min(1)
    .max(20),
});

export const askCoach = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data, context }): Promise<{ reply: string }> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("The AI coach isn't configured yet.");

    const { supabase, userId } = context;
    const today = new Date().toISOString().slice(0, 10);

    const [profileRes, mealsRes, waterRes, weightRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase
        .from("meal_logs")
        .select("log_date,meal_type,name,calories,protein,carbs,fat,fiber")
        .eq("user_id", userId)
        .gte("log_date", new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10))
        .order("log_date", { ascending: false })
        .limit(60),
      supabase.from("water_logs").select("amount_ml").eq("user_id", userId).eq("log_date", today),
      supabase
        .from("weight_logs")
        .select("log_date,weight_kg")
        .eq("user_id", userId)
        .order("log_date", { ascending: false })
        .limit(10),
    ]);

    const p = profileRes.data as Record<string, unknown> | null;
    const meals = (mealsRes.data ?? []) as {
      log_date: string; meal_type: string; name: string;
      calories: number; protein: number; carbs: number; fat: number; fiber: number;
    }[];
    const todayMeals = meals.filter((m) => m.log_date === today);
    const sum = todayMeals.reduce(
      (a, m) => ({
        calories: a.calories + Number(m.calories || 0),
        protein: a.protein + Number(m.protein || 0),
        carbs: a.carbs + Number(m.carbs || 0),
        fat: a.fat + Number(m.fat || 0),
        fiber: a.fiber + Number(m.fiber || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
    );
    const waterMl = (waterRes.data ?? []).reduce((a, r) => a + Number((r as { amount_ml: number }).amount_ml || 0), 0);
    const weights = (weightRes.data ?? []) as { log_date: string; weight_kg: number }[];

    const ctx = [
      p
        ? `Profile: name ${p["full_name"] || "unknown"}, age ${p["age"] ?? "unknown"}, gender ${p["gender"] ?? "unknown"}, height ${p["height_cm"] ?? "unknown"} cm, weight ${p["weight_kg"] ?? "unknown"} kg, target weight ${p["target_weight_kg"] ?? "unset"} kg, activity ${p["activity_level"]}, goal ${p["goal"]}, diet ${p["diet"]}, allergies ${(p["allergies"] as string[] | null)?.join(", ") || "none"}, water goal ${p["water_goal_ml"]} ml.`
        : "Profile: not completed yet.",
      `Today (${today}) logged: ${Math.round(sum.calories)} kcal, ${Math.round(sum.protein)} g protein, ${Math.round(sum.carbs)} g carbs, ${Math.round(sum.fat)} g fat, ${Math.round(sum.fiber)} g fiber, water ${waterMl} ml.`,
      todayMeals.length
        ? `Today's meals: ${todayMeals.map((m) => `${m.meal_type} — ${m.name} (${Math.round(Number(m.calories))} kcal, ${Math.round(Number(m.protein))} g protein)`).join("; ")}.`
        : "No meals logged today.",
      meals.length ? `Last 7 days meal count: ${meals.length}.` : "No meals logged in the last 7 days.",
      weights.length
        ? `Recent weights: ${weights.map((w) => `${w.log_date} ${Number(w.weight_kg).toFixed(1)} kg`).join(", ")}.`
        : "No weight entries yet.",
    ].join("\n");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: [
              "You are RP Nutrition's AI nutrition coach. Be concise, warm and practical (max ~180 words).",
              "Ground every answer in the user's real data below. If data is missing, say so and ask for it instead of inventing numbers.",
              "All nutrition numbers are estimates — never claim medical or lab accuracy, and refer users to a professional for medical concerns.",
              "Respect the user's diet and allergies. Use grams and kcal. Plain text, short lines or dashes, no markdown headings.",
              "",
              "USER DATA:",
              ctx,
            ].join("\n"),
          },
          ...data.messages,
        ],
      }),
    });

    if (res.status === 429) throw new Error("The AI coach is busy right now — try again in a moment.");
    if (res.status === 402) throw new Error("AI credits are exhausted for this workspace.");
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[coach-ai] gateway error", res.status, detail.slice(0, 500));
      throw new Error("The AI coach couldn't answer right now.");
    }

    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const reply = json.choices?.[0]?.message?.content?.trim();
    if (!reply) throw new Error("The AI coach returned an empty response.");
    return { reply };
  });
