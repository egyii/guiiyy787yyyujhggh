import { Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";

export function DifficultyTag({ value }: { value: string }) {
  const tone =
    value === "EXPERT"
      ? "text-accent border-accent/30 bg-accent/8"
      : value === "ADEPT"
        ? "text-foreground border-border bg-secondary"
        : "text-success border-success/30 bg-success/8";
  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[10px] font-medium tracking-[0.12em] uppercase ${tone}`}
    >
      {value}
    </span>
  );
}

export function ArenaShell({ children }: { children: ReactNode }) {
  const { user } = useSession();
  const navigate = useNavigate();

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-3.5">
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
            <span className="grid size-6 place-items-center rounded-md bg-primary font-mono text-[11px] text-primary-foreground">
              Q
            </span>
            QuizPulse
          </Link>

          <nav className="flex items-center gap-1 text-sm">
            <Link
              to="/quizzes"
              className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              Quizzes
            </Link>
            <Link
              to="/leaderboard"
              className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              Leaderboard
            </Link>
            {user ? (
              <>
                <Link
                  to="/stats"
                  className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  Stats
                </Link>
                <button
                  onClick={signOut}
                  className="press ml-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium transition-colors hover:bg-secondary"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                className="press ml-1 rounded-lg bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 px-5 py-14">{children}</main>

      <footer className="border-t border-border/70">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-5 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>QuizPulse — knowledge, timed.</span>
          <div className="flex gap-5">
            <Link to="/quizzes" className="transition-colors hover:text-foreground">
              Quizzes
            </Link>
            <Link to="/leaderboard" className="transition-colors hover:text-foreground">
              Leaderboard
            </Link>
            <Link to="/auth" className="transition-colors hover:text-foreground">
              Account
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
