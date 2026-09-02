import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  BookOpen,
  ChevronRight,
  Home,
  LayoutGrid,
  Menu,
  Moon,
  Sun,
  Trophy,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { useIsAdmin } from "@/hooks/use-admin";
import { useTheme } from "@/hooks/use-theme";

const NAV = [
  { to: "/courses", label: "Courses" },
  { to: "/quizzes", label: "Quizzes" },
  { to: "/leaderboard", label: "Leaderboard" },
] as const;


function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label="Toggle color theme"
      className="press grid size-9 place-items-center rounded-full bg-secondary/70 text-foreground/80 hover:bg-secondary"
    >
      {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}

export function Breadcrumbs({
  items,
}: {
  items: { label: string; to?: string; params?: Record<string, string> }[];
}) {
  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 flex-wrap items-center gap-1 text-[13px] text-muted-foreground">
        <li className="flex shrink-0 items-center gap-1">
          <Link to="/" className="press rounded-md px-1 py-0.5 hover:text-foreground">
            Home
          </Link>
        </li>
        {items.map((item, i) => (
          <li key={item.label} className="flex min-w-0 items-center gap-1">
            <ChevronRight className="size-3.5 shrink-0 opacity-50" aria-hidden />
            {item.to && i < items.length - 1 ? (
              <Link
                to={item.to}
                params={item.params as never}
                className="press rounded-md px-1 py-0.5 hover:text-foreground"
              >
                {item.label}
              </Link>
            ) : (
              <span className="truncate px-1 py-0.5 font-medium text-foreground" aria-current="page">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function BottomTabs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const tabs = [
    { to: "/", label: "Home", icon: Home, exact: true },
    { to: "/courses", label: "Courses", icon: BookOpen },
    { to: "/quizzes", label: "Quizzes", icon: LayoutGrid },
    { to: "/leaderboard", label: "Ranks", icon: Trophy },
  ] as const;


  return (
    <nav
      aria-label="Primary"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 6px)" }}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border/60 bg-background/90 backdrop-blur-xl sm:hidden"
    >
      <ul className="grid grid-cols-4">
        {tabs.map(({ to, label, icon: Icon, ...rest }) => {
          const exact = "exact" in rest && rest.exact;
          const active = exact ? pathname === to : pathname.startsWith(to);
          return (
            <li key={to}>
              <Link
                to={to}
                className={`press flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${
                  active ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                <span
                  className={`grid h-7 w-12 place-items-center rounded-full transition-colors ${
                    active ? "bg-secondary" : "bg-transparent"
                  }`}
                >
                  <Icon className="size-[18px]" />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function ArenaShell({ children }: { children: ReactNode }) {
  const { user } = useSession();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  async function signOut() {
    await supabase.auth.signOut();
    setOpen(false);
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-accent/25">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[60] focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-5">
          <Link to="/" className="text-[15px] font-semibold tracking-tight">
            QuizPulse
          </Link>

          <nav className="hidden items-center gap-1 text-sm sm:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`press rounded-full px-3 py-1.5 ${
                  pathname.startsWith(item.to)
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
            {user && (
              <Link
                to="/stats"
                className={`press rounded-full px-3 py-1.5 ${
                  pathname.startsWith("/stats")
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Stats
              </Link>
            )}
            {isAdmin && (
              <Link
                to="/admin"
                className={`press rounded-full px-3 py-1.5 ${
                  pathname.startsWith("/admin")
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Admin
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <button
                onClick={signOut}
                className="press hidden rounded-full bg-secondary px-4 py-2 text-sm font-medium sm:block"
              >
                Sign out
              </button>
            ) : (
              <Link
                to="/auth"
                className="press hidden rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 sm:block"
              >
                Sign in
              </Link>
            )}
            <button
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle menu"
              aria-expanded={open}
              className="press grid size-9 place-items-center rounded-full bg-secondary/70 sm:hidden"
            >
              {open ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>
        </div>

        {open && (
          <div className="reveal-scale origin-top border-b border-border/60 bg-background/95 px-5 pb-5 backdrop-blur-xl sm:hidden">
            <nav className="flex flex-col gap-1 pt-2 text-[15px]">
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="press rounded-2xl px-3 py-3 text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
              {user && (
                <Link
                  to="/stats"
                  className="press rounded-2xl px-3 py-3 text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                >
                  Stats
                </Link>
              )}
              {isAdmin && (
                <Link
                  to="/admin"
                  className="press rounded-2xl px-3 py-3 text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                >
                  Admin
                </Link>
              )}
              {user ? (
                <button
                  onClick={signOut}
                  className="press mt-2 rounded-2xl bg-secondary py-3 text-center font-medium"
                >
                  Sign out
                </button>
              ) : (
                <Link
                  to="/auth"
                  className="press mt-2 rounded-2xl bg-primary py-3 text-center font-medium text-primary-foreground"
                >
                  Sign in
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

      <main id="main" className="px-5 pt-8 pb-28 sm:pt-16 sm:pb-20">
        {children}
      </main>

      <footer className="border-t border-border/60 px-5 py-10 pb-28 sm:pb-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span className="font-medium text-foreground">QuizPulse</span>
          <span>Fast, quiet trivia. Built for focus.</span>
        </div>
      </footer>

      <BottomTabs />
    </div>
  );
}

export function DifficultyTag({ value }: { value: string }) {
  return (
    <span className="rounded-full bg-secondary/80 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
      {value.toLowerCase()}
    </span>
  );
}
