import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Send, Bot, Sparkles } from "lucide-react";

export const Route = createFileRoute("/app/coach")({
  component: Coach,
});

type Msg = { role: "user" | "ai"; text: string };

const SUGGESTIONS = [
  "Create today's meal plan",
  "Analyze my lunch",
  "High protein dinner under 500 kcal",
  "Healthy snacks",
  "Generate grocery list",
];

function Coach() {
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "ai", text: "Hey John 👋 How are you feeling today? Want me to build a meal plan around your remaining 350 kcal?" },
  ]);
  const [input, setInput] = useState("");

  const send = (t: string) => {
    if (!t.trim()) return;
    setMsgs((m) => [...m, { role: "user", text: t }]);
    setInput("");
    setTimeout(() => {
      setMsgs((m) => [...m, {
        role: "ai",
        text: "Based on your remaining calories and 28g of protein still to hit, try miso-glazed salmon with edamame and brown rice — about 480 kcal, 42g protein. Want me to swap it into tonight's dinner?",
      }]);
    }, 700);
  };

  return (
    <div className="flex h-[calc(100vh-10rem)] flex-col rounded-3xl glass pb-24 lg:pb-0">
      <div className="flex items-center gap-3 border-b border-white/5 p-6">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/15 text-primary">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <div className="font-medium">AI Nutrition Coach</div>
          <div className="text-xs text-muted-foreground">Personalized to your profile & progress</div>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-6">
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "gap-3"}`}>
            {m.role === "ai" && (
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/20 text-primary">
                <Bot className="h-4 w-4" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${m.role === "user" ? "rounded-tr-sm bg-primary/15 text-primary" : "rounded-tl-sm bg-white/5"}`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-white/5 p-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => send(s)}
              className="inline-flex items-center gap-1 rounded-full glass px-3 py-1.5 text-xs text-muted-foreground hover:bg-white/5">
              <Sparkles className="h-3 w-3 text-primary" /> {s}
            </button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex items-center gap-2 rounded-2xl bg-white/[0.03] p-2 pl-4">
          <input value={input} onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about nutrition, meals, or macros…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60" />
          <button className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground hover:brightness-110">
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}