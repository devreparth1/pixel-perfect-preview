import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Utensils, Bot, ScanLine, LineChart, ShoppingCart,
  Settings, Salad, Bell, Search, ChefHat,
} from "lucide-react";

export const Route = createFileRoute("/app")({
  head: () => ({ meta: [
    { title: "Dashboard — RP Nutrition" },
    { name: "description", content: "Your daily nutrition dashboard: calories, macros, water, and AI coaching." },
    { property: "og:title", content: "Dashboard — RP Nutrition" },
    { property: "og:description", content: "Track meals, macros, and progress with your AI nutrition coach." },
  ]}),
  component: AppShell,
});

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };
const NAV: NavItem[] = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/app/meal-plans", label: "Meal Plans", icon: Utensils },
  { to: "/app/coach", label: "AI Coach", icon: Bot },
  { to: "/app/scanner", label: "Food Scanner", icon: ScanLine },
  { to: "/app/recipes", label: "Recipes", icon: ChefHat },
  { to: "/app/progress", label: "Progress", icon: LineChart },
  { to: "/app/grocery", label: "Grocery", icon: ShoppingCart },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="min-h-screen">
      <div className="mx-auto flex max-w-[1400px] gap-6 px-4 py-6">
        {/* Sidebar */}
        <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-60 shrink-0 flex-col rounded-3xl glass p-4 lg:flex">
          <Link to="/" className="flex items-center gap-2 px-2 py-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/15 text-primary">
              <Salad className="h-4 w-4" />
            </span>
            <span className="font-display text-base font-semibold">RP Nutrition</span>
          </Link>
          <nav className="mt-4 space-y-1">
            {NAV.map((n) => {
              const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
              return (
                <Link key={n.to} to={n.to as any}
                  className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition ${active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"}`}>
                  <n.icon className="h-4 w-4" />
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto rounded-2xl glass-strong p-4">
            <div className="text-xs text-muted-foreground">Premium trial</div>
            <div className="mt-1 text-sm">6 days left</div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
              <div className="h-full w-[85%] rounded-full" style={{ background: "var(--gradient-primary)" }} />
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1">
          <TopBar />
          <div className="mt-6">
            <Outlet />
          </div>
          {/* Mobile nav */}
          <MobileNav pathname={pathname} />
        </main>
      </div>
    </div>
  );
}

function TopBar() {
  return (
    <header className="flex items-center gap-3 rounded-3xl glass p-3">
      <div className="flex flex-1 items-center gap-2 rounded-2xl bg-white/[0.03] px-3 py-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input placeholder="Search meals, foods, recipes…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60" />
      </div>
      <button className="grid h-10 w-10 place-items-center rounded-2xl glass hover:bg-white/5">
        <Bell className="h-4 w-4" />
      </button>
      <div className="hidden items-center gap-3 rounded-2xl glass px-3 py-1.5 md:flex">
        <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/20 text-primary font-medium text-sm">J</div>
        <div className="text-sm leading-tight">
          <div className="font-medium">John</div>
          <div className="text-xs text-muted-foreground">Premium</div>
        </div>
      </div>
    </header>
  );
}

function MobileNav({ pathname }: { pathname: string }) {
  const items = NAV.slice(0, 5);
  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-3xl glass-strong p-2 lg:hidden">
      {items.map((n) => {
        const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
        return (
          <Link key={n.to} to={n.to as any}
            className={`flex flex-col items-center gap-0.5 rounded-2xl px-3 py-2 text-[10px] ${active ? "text-primary" : "text-muted-foreground"}`}>
            <n.icon className="h-4 w-4" />
            {n.label.split(" ")[0]}
          </Link>
        );
      })}
    </nav>
  );
}