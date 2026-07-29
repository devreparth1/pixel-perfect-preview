import { createFileRoute } from "@tanstack/react-router";
import { Upload, ScanLine, Sparkles } from "lucide-react";

export const Route = createFileRoute("/app/scanner")({
  component: Scanner,
});

function Scanner() {
  return (
    <div className="space-y-6 pb-24 lg:pb-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Food scanner</h1>
        <p className="mt-1 text-sm text-muted-foreground">Snap a plate. Get calories, macros, and healthier swaps.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl glass p-8 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/15 text-primary anim-pulse-glow">
            <ScanLine className="h-7 w-7" />
          </div>
          <h3 className="mt-5 text-lg font-medium">Upload a photo of your meal</h3>
          <p className="mt-2 text-sm text-muted-foreground">PNG or JPG · Best on well-lit, top-down shots.</p>
          <label className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:brightness-110">
            <Upload className="h-4 w-4" /> Upload image
            <input type="file" accept="image/*" className="hidden" />
          </label>
          <p className="mt-3 text-xs text-muted-foreground">AI estimates. Verify serving sizes for accuracy.</p>
        </div>

        <div className="rounded-3xl glass p-6">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-4 w-4" /><span className="text-xs uppercase tracking-wider">Last scan</span>
          </div>
          <h3 className="mt-3 text-lg font-medium">Chicken · Rice · Vegetables</h3>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[
              { l: "Calories", v: "540", u: "kcal" },
              { l: "Protein", v: "42", u: "g" },
              { l: "Carbs", v: "58", u: "g" },
              { l: "Fat", v: "12", u: "g" },
            ].map((s) => (
              <div key={s.l} className="rounded-2xl bg-white/[0.03] p-4">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.l}</div>
                <div className="mt-1 font-num text-2xl font-semibold">{s.v}<span className="text-sm text-muted-foreground"> {s.u}</span></div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl bg-primary/10 p-4 text-sm">
            <div className="font-medium text-primary">Suggestion</div>
            <p className="mt-1 text-muted-foreground">Swap white rice for cauliflower rice to save ~180 kcal without losing satiety.</p>
          </div>
        </div>
      </div>
    </div>
  );
}