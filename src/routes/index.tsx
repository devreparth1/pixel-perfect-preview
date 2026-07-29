import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles,
  Apple,
  Salad,
  Dumbbell,
  Target,
  Flame,
  Droplet,
  LineChart,
  ScanLine,
  Bot,
  ArrowRight,
  Check,
  Star,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RP Nutrition — AI Nutrition Coach for Weight Loss & Muscle" },
      { name: "description", content: "Personalized AI meal plans, macro & calorie tracking, and a 24/7 nutrition coach that adapts to your goals." },
      { property: "og:title", content: "RP Nutrition — Your AI Nutrition Coach" },
      { property: "og:description", content: "Eat better. Lose weight. Build muscle. Powered by AI." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen">
      <Nav />
      <Hero />
      <TrustBar />
      <Features />
      <DashboardPreview />
      <Testimonials />
      <Pricing />
      <CTA />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-40">
      <div className="mx-auto mt-4 flex max-w-6xl items-center justify-between rounded-2xl glass px-4 py-3 md:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/15 text-primary">
            <Salad className="h-4 w-4" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">RP Nutrition</span>
        </Link>
        <nav className="hidden gap-8 text-sm text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#pricing" className="hover:text-foreground">Pricing</a>
          <a href="#testimonials" className="hover:text-foreground">Reviews</a>
          <Link to="/app" className="hover:text-foreground">Dashboard</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/login" className="hidden text-sm text-muted-foreground hover:text-foreground md:inline">Login</Link>
          <Link to="/register" className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-glow transition hover:brightness-110">
            Start free <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative mx-auto max-w-6xl px-4 pt-20 pb-24 md:pt-28 md:pb-32">
      <div className="text-center anim-fade-up">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          AI-powered nutrition, built on science
        </div>
        <h1 className="mx-auto mt-6 max-w-3xl text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl">
          Your AI <span className="gradient-text">Nutrition Coach</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground md:text-xl">
          Eat better. Lose weight. Build muscle. Personalized meal plans, macro tracking,
          and daily coaching — adapted to your body and your goals.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to="/register" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-glow anim-pulse-glow transition hover:brightness-110">
            Start free <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/app" className="inline-flex items-center gap-2 rounded-full glass px-6 py-3 text-sm font-medium hover:bg-white/5">
            View live demo
          </Link>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">No credit card · 7-day premium trial</p>
      </div>

      <div className="mt-16 anim-fade-up" style={{ animationDelay: "120ms" }}>
        <HeroPreview />
      </div>
    </section>
  );
}

function HeroPreview() {
  return (
    <div className="relative mx-auto max-w-5xl">
      <div className="absolute inset-x-16 -top-8 h-40 rounded-full bg-primary/25 blur-3xl" />
      <div className="relative rounded-3xl glass p-3 gradient-border">
        <div className="rounded-2xl bg-secondary/60 p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <StatRing label="Calories" value="1,850" sub="/ 2,200 kcal" pct={84} />
            <StatBar label="Protein" value="112" unit="/ 140 g" pct={80} />
            <WaterCard />
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <MealCard title="Breakfast" name="Greek Yogurt Bowl" kcal={420} p={32} />
            <MealCard title="Lunch" name="Chicken & Quinoa" kcal={640} p={48} />
            <MealCard title="Dinner" name="Salmon Poke" kcal={580} p={44} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRing({ label, value, sub, pct }: { label: string; value: string; sub: string; pct: number }) {
  const r = 34, c = 2 * Math.PI * r;
  return (
    <div className="rounded-2xl glass p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        <Flame className="h-4 w-4 text-primary" />
      </div>
      <div className="mt-4 flex items-center gap-4">
        <svg width="88" height="88" viewBox="0 0 88 88" className="-rotate-90">
          <circle cx="44" cy="44" r={r} stroke="oklch(1 0 0 / 0.08)" strokeWidth="8" fill="none" />
          <circle cx="44" cy="44" r={r} stroke="url(#g1)" strokeWidth="8" fill="none"
            strokeDasharray={c} strokeDashoffset={c - (c * pct) / 100} strokeLinecap="round" />
          <defs>
            <linearGradient id="g1" x1="0" x2="1">
              <stop offset="0" stopColor="#2EE6A6" />
              <stop offset="1" stopColor="#74F3C5" />
            </linearGradient>
          </defs>
        </svg>
        <div>
          <div className="font-num text-3xl font-semibold">{value}</div>
          <div className="text-xs text-muted-foreground">{sub}</div>
        </div>
      </div>
    </div>
  );
}

function StatBar({ label, value, unit, pct }: { label: string; value: string; unit: string; pct: number }) {
  return (
    <div className="rounded-2xl glass p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        <Dumbbell className="h-4 w-4 text-primary" />
      </div>
      <div className="mt-4">
        <div className="font-num text-3xl font-semibold">
          {value} <span className="text-base text-muted-foreground">{unit}</span>
        </div>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/5">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--gradient-primary)" }} />
        </div>
      </div>
    </div>
  );
}

function WaterCard() {
  return (
    <div className="rounded-2xl glass p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">Water</span>
        <Droplet className="h-4 w-4 text-primary" />
      </div>
      <div className="mt-4 flex items-end justify-between">
        <div>
          <div className="font-num text-3xl font-semibold">2.5<span className="text-base text-muted-foreground"> L</span></div>
          <div className="text-xs text-muted-foreground">Goal 3.5 L</div>
        </div>
        <div className="relative h-16 w-14 overflow-hidden rounded-lg border border-white/10">
          <div className="absolute bottom-0 left-0 right-0 h-[70%] anim-float"
            style={{ background: "linear-gradient(180deg,#2EE6A6,#0B1F16)" }} />
        </div>
      </div>
    </div>
  );
}

function MealCard({ title, name, kcal, p }: { title: string; name: string; kcal: number; p: number }) {
  return (
    <div className="rounded-2xl glass p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{title}</div>
      <div className="mt-2 text-base font-medium">{name}</div>
      <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="font-num text-primary">{kcal} kcal</span>
        <span className="font-num">{p}g protein</span>
      </div>
    </div>
  );
}

function TrustBar() {
  return (
    <section className="border-y border-white/5 py-8">
      <div className="mx-auto max-w-6xl px-4">
        <p className="text-center text-xs uppercase tracking-widest text-muted-foreground">Trusted by athletes, coaches & everyday people</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-muted-foreground/60">
          {["FitLab", "MacroCo", "LeanKit", "PulseFit", "Nourish", "PeakPro"].map((n) => (
            <span key={n} className="font-display text-lg font-semibold tracking-wide">{n}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

const FEATURES = [
  { icon: Bot, title: "AI Nutritionist", desc: "Ask anything: meals, macros, cravings. Answers use your profile & progress." },
  { icon: Salad, title: "AI Meal Planner", desc: "Weekly plans tailored to your goal, allergies, cuisine, and cooking time." },
  { icon: ScanLine, title: "Food Scanner", desc: "Snap a plate — get calorie & macro estimates, plus healthier swaps." },
  { icon: LineChart, title: "Progress Tracking", desc: "Weight, calories, protein, and streaks. Weekly reports that keep you honest." },
  { icon: Target, title: "Goal Coaching", desc: "Adaptive targets for weight loss, lean bulk, or maintenance — updated as you go." },
  { icon: Apple, title: "Smart Grocery", desc: "Auto shopping lists grouped by category, exportable to your notes app." },
];

function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">Everything you need. Nothing you don't.</h2>
        <p className="mt-3 text-muted-foreground">An AI-first nutrition platform that adapts to your body, not the other way around.</p>
      </div>
      <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="group rounded-3xl glass p-6 transition hover:bg-white/[0.04]">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
              <f.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-5 text-lg font-medium">{f.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function DashboardPreview() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <div className="grid gap-10 rounded-3xl glass p-8 md:grid-cols-2 md:p-12">
        <div className="flex flex-col justify-center">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
            <Sparkles className="h-3 w-3" /> Live coaching
          </div>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">Your coach. In your pocket.</h2>
          <p className="mt-3 text-muted-foreground">Log meals, ask questions, and let the AI adjust your plan in real time. Every answer is personalized to your profile, allergies, and progress.</p>
          <ul className="mt-6 space-y-3 text-sm">
            {["Personalized calorie & macro targets", "Adaptive meal plans that regenerate on demand", "Weekly reports with honest feedback"].map((s) => (
              <li key={s} className="flex items-center gap-2 text-muted-foreground">
                <Check className="h-4 w-4 text-primary" /> {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl glass-strong p-4">
          <div className="flex items-start gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/20 text-primary">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-white/5 px-4 py-3 text-sm">
              Hey John 👋 you're at <span className="text-primary font-num">1,850 kcal</span>. Want a high-protein dinner under 500?
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <div className="rounded-2xl rounded-tr-sm bg-primary/15 px-4 py-3 text-sm text-primary">
              Yes, something with salmon.
            </div>
          </div>
          <div className="mt-3 flex items-start gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/20 text-primary">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-white/5 px-4 py-3 text-sm">
              Try miso-glazed salmon with edamame & brown rice — ~480 kcal, 42g protein. Add to plan?
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {["Create today's meal plan", "Analyze my lunch", "Healthy snack ideas", "Grocery list"].map((s) => (
              <button key={s} className="rounded-full glass px-3 py-1.5 text-xs text-muted-foreground hover:bg-white/5">{s}</button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const REVIEWS = [
  { name: "Aisha K.", role: "Lost 8 kg in 12 weeks", quote: "The coach genuinely feels like it knows me. Meals I actually want to eat." },
  { name: "Marco R.", role: "Lean bulk, +4 kg muscle", quote: "Finally cracked my protein target without weighing everything obsessively." },
  { name: "Priya S.", role: "Busy parent", quote: "Grocery lists write themselves. I open the app 30 seconds a day." },
];

function Testimonials() {
  return (
    <section id="testimonials" className="mx-auto max-w-6xl px-4 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">Results people can feel.</h2>
      </div>
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {REVIEWS.map((r) => (
          <div key={r.name} className="rounded-3xl glass p-6">
            <div className="flex gap-1 text-primary">{[0,1,2,3,4].map(i => <Star key={i} className="h-4 w-4 fill-current" />)}</div>
            <p className="mt-4 text-base leading-relaxed">"{r.quote}"</p>
            <div className="mt-6">
              <div className="text-sm font-medium">{r.name}</div>
              <div className="text-xs text-muted-foreground">{r.role}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Pricing() {
  const plans = [
    { name: "Free", price: "$0", period: "forever", cta: "Get started", features: ["AI coach (25 msgs/mo)", "Basic meal plans", "Calorie & macro targets", "Water & weight tracking"] },
    { name: "Premium", price: "$12", period: "/month", cta: "Start 7-day trial", featured: true, features: ["Unlimited AI coach", "Adaptive weekly meal plans", "Food scanner", "Grocery planner", "Weekly reports"] },
    { name: "Yearly", price: "$96", period: "/year", cta: "Save 33%", features: ["Everything in Premium", "Priority AI responses", "Early access to new features"] },
  ];
  return (
    <section id="pricing" className="mx-auto max-w-6xl px-4 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">Simple pricing.</h2>
        <p className="mt-3 text-muted-foreground">Start free. Upgrade whenever you're ready.</p>
      </div>
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {plans.map((p) => (
          <div key={p.name} className={`relative rounded-3xl p-8 ${p.featured ? "glass-strong gradient-border glow" : "glass"}`}>
            {p.featured && <div className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">Most popular</div>}
            <div className="text-sm text-muted-foreground">{p.name}</div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-display text-5xl font-semibold">{p.price}</span>
              <span className="text-sm text-muted-foreground">{p.period}</span>
            </div>
            <ul className="mt-6 space-y-2 text-sm">
              {p.features.map(f => (
                <li key={f} className="flex items-start gap-2 text-muted-foreground">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {f}
                </li>
              ))}
            </ul>
            <Link to="/register" className={`mt-8 flex items-center justify-center gap-1 rounded-full px-4 py-3 text-sm font-medium ${p.featured ? "bg-primary text-primary-foreground hover:brightness-110" : "glass hover:bg-white/5"}`}>
              {p.cta} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-24">
      <div className="relative overflow-hidden rounded-3xl glass-strong p-12 text-center">
        <div className="absolute inset-x-0 -top-16 mx-auto h-40 w-1/2 rounded-full bg-primary/25 blur-3xl" />
        <h2 className="relative text-4xl font-semibold tracking-tight md:text-5xl">Start eating like it matters.</h2>
        <p className="relative mt-3 text-muted-foreground">7 days of premium, on us. No card needed.</p>
        <div className="relative mt-6 flex justify-center">
          <Link to="/register" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-glow hover:brightness-110">
            Start free <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/5 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 md:flex-row">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/15 text-primary">
            <Salad className="h-3.5 w-3.5" />
          </span>
          <span className="text-sm text-muted-foreground">© {new Date().getFullYear()} RP Nutrition. Informational guidance — not medical advice.</span>
        </div>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#pricing" className="hover:text-foreground">Pricing</a>
          <Link to="/login" className="hover:text-foreground">Login</Link>
        </div>
      </div>
    </footer>
  );
}