import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Send, Bot, Sparkles, AlertCircle } from "lucide-react";

import { askCoach } from "../lib/coach-ai.functions";
import { useProfile, useMealsForDate, useTargets, sumMacros, friendlyError } from "../lib/nutrition-data";
import { EstimateNote } from "../components/nutrition/primitives";

export const Route = createFileRoute("/app/coach")({
  head: () => ({
    meta: [
      { title: "AI Nutrition Coach — RP Nutrition" },
      { name: "description", content: "Ask your AI nutrition coach questions grounded in your real profile, meals and macros." },
      { property: "og:title", content: "AI Nutrition Coach — RP Nutrition" },
      { property: "og:description", content: "Personalized nutrition guidance based on your logged meals, macros and goals." },
    ],
  }),
  component: Coach,
});

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "What should I eat for my remaining calories today?",
  "How am I doing on protein?",
  "Suggest a high-protein dinner under 500 kcal",
  "Review my week so far",
  "Healthy snack ideas for my diet",
];

function Coach() {
  const { data: profile } = useProfile();
  const { targets } = useTargets();
  const meals = useMealsForDate();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const ask = useServerFn(askCoach);
  const chat = useMutation({
    mutationFn: (history: Msg[]) => ask({ data: { messages: history.slice(-12) } }),
    onSuccess: (r) => setMsgs((m) => [...m, { role: "assistant", content: r.reply }]),
    onError: (e) => setError(friendlyError(e, e instanceof Error ? e.message : "The AI coach couldn't answer right now.")),
  });

  const totals = sumMacros(meals.data ?? []);
  const firstName = profile?.full_name?.split(" ")[0] || "there";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs.length, chat.isPending]);

  const send = (text: string) => {
    const t = text.trim();
    if (!t || chat.isPending) return;
    setError(null);
    setInput("");
    const history: Msg[] = [...msgs, { role: "user", content: t }];
    setMsgs(history);
    chat.mutate(history);
  };

  return (
    <div className="flex h-[calc(100vh-10rem)] flex-col rounded-3xl glass pb-24 lg:pb-0">
      <div className="flex items-center gap-3 border-b border-white/5 p-6">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/15 text-primary">
          <Bot className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="font-medium">AI Nutrition Coach</div>
          <div className="truncate text-xs text-muted-foreground">
            Using your profile, today's {Math.round(totals.calories)} kcal logged and your {targets.goalLabel.toLowerCase()} targets
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-6">
        {msgs.length === 0 && (
          <div className="flex gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/20 text-primary">
              <Bot className="h-4 w-4" />
            </div>
            <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-white/5 px-4 py-3 text-sm">
              Hey {firstName} 👋 Ask me anything about your nutrition — I can see your profile, logged meals, macros, water and weight.
            </div>
          </div>
        )}

        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "gap-3"}`}>
            {m.role === "assistant" && (
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/20 text-primary">
                <Bot className="h-4 w-4" />
              </div>
            )}
            <div
              className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm ${
                m.role === "user" ? "rounded-tr-sm bg-primary/15 text-primary" : "rounded-tl-sm bg-white/5"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {chat.isPending && (
          <div className="flex gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/20 text-primary">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-white/5 px-4 py-3 text-sm text-muted-foreground">Thinking…</div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-2xl bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="flex-1">
              {error}
              <button
                onClick={() => msgs.length && (setError(null), chat.mutate(msgs))}
                className="ml-2 underline hover:no-underline"
              >
                Retry
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-white/5 p-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              disabled={chat.isPending}
              className="inline-flex items-center gap-1 rounded-full glass px-3 py-1.5 text-xs text-muted-foreground hover:bg-white/5 disabled:opacity-50"
            >
              <Sparkles className="h-3 w-3 text-primary" /> {s}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-center gap-2 rounded-2xl bg-white/[0.03] p-2 pl-4"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label="Message the AI coach"
            placeholder="Ask anything about nutrition, meals, or macros…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
          />
          <button
            disabled={chat.isPending || !input.trim()}
            aria-label="Send message"
            className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground hover:brightness-110 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
        <div className="mt-3"><EstimateNote>Guidance is generated from your logged estimates — not medical advice.</EstimateNote></div>
      </div>
    </div>
  );
}
