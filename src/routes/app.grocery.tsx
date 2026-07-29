import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Printer, Download } from "lucide-react";

export const Route = createFileRoute("/app/grocery")({
  component: Grocery,
});

const CATEGORIES: Record<string, string[]> = {
  Vegetables: ["Spinach 200g", "Cherry tomatoes 200g", "Avocado x2", "Edamame 200g", "Broccoli 300g"],
  Fruits: ["Apples x4", "Mixed berries 500g", "Bananas x6"],
  Dairy: ["Greek yogurt 1kg", "Feta 200g"],
  Meat: ["Chicken breast 800g", "Salmon fillet 400g"],
  Grains: ["Quinoa 500g", "Brown rice 500g", "Granola 300g"],
  Pantry: ["Almond butter", "Honey", "Miso paste", "Olive oil"],
};

function Grocery() {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const toggle = (k: string) => setDone((d) => ({ ...d, [k]: !d[k] }));
  return (
    <div className="space-y-6 pb-24 lg:pb-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Grocery list</h1>
          <p className="mt-1 text-sm text-muted-foreground">Auto-generated from this week's meal plan.</p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 rounded-full glass px-4 py-2 text-sm hover:bg-white/5"><Printer className="h-4 w-4" /> Print</button>
          <button className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:brightness-110"><Download className="h-4 w-4" /> Export</button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(CATEGORIES).map(([cat, items]) => (
          <div key={cat} className="rounded-3xl glass p-6">
            <h3 className="text-sm font-medium uppercase tracking-wider text-primary">{cat}</h3>
            <ul className="mt-4 space-y-2">
              {items.map((it) => {
                const key = `${cat}-${it}`;
                const isDone = done[key];
                return (
                  <li key={it}>
                    <button onClick={() => toggle(key)}
                      className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm hover:bg-white/5">
                      <span className={`grid h-5 w-5 place-items-center rounded-md border ${isDone ? "border-primary bg-primary/20" : "border-white/15"}`}>
                        {isDone && <span className="h-2 w-2 rounded-sm bg-primary" />}
                      </span>
                      <span className={isDone ? "text-muted-foreground line-through" : ""}>{it}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}