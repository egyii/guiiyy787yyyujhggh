import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Menu, Moon, Sun, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { useTheme } from "@/hooks/use-theme";

const NAV = [
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

export function ArenaShell({ children }: { children: ReactNode }) {
  const { user } = useSession();
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

      <main className="px-5 pt-10 pb-20 sm:pt-16">{children}</main>

      <footer className="border-t border-border/60 px-5 py-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span className="font-medium text-foreground">QuizPulse</span>
          <span>Fast, quiet trivia. Built for focus.</span>
        </div>
      </footer>
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
