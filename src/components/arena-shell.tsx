import { Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";

const TICKER =
  "Live Tournament: Tech Giants • 4,209 Playing Now • Prize Pool: 5k XP • Verify your email for +500 XP";

export function Marquee() {
  return (
    <div className="overflow-hidden border-b border-border bg-surface py-2">
      <div className="marquee-track gap-8 whitespace-nowrap">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
          {TICKER}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
          {TICKER}
        </span>
      </div>
    </div>
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
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      <Marquee />

      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/85 px-5 py-3 backdrop-blur-xl">
        <Link to="/" className="font-display text-lg font-extrabold tracking-tight">
          QUIZ<span className="text-primary">PULSE</span>
        </Link>
        <nav className="flex items-center gap-4 text-xs font-semibold">
          <Link to="/quizzes" className="text-muted-foreground transition-colors hover:text-foreground">
            Arenas
          </Link>
          <Link
            to="/leaderboard"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Ranks
          </Link>
          {user ? (
            <>
              <Link to="/stats" className="text-muted-foreground transition-colors hover:text-foreground">
                Stats
              </Link>
              <button
                onClick={signOut}
                className="press rounded-xl bg-secondary px-3 py-1.5 text-xs font-bold text-secondary-foreground ring-1 ring-border"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="press rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
            >
              Sign in
            </Link>
          )}
        </nav>
      </header>

      <main className="px-5 py-8">{children}</main>

      <footer className="border-t border-border px-5 py-8 text-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        QuizPulse — the trivia arena
      </footer>
    </div>
  );
}

export function DifficultyTag({ value }: { value: string }) {
  return (
    <span className="rounded-full border border-border bg-secondary px-2 py-1 text-[10px] font-bold tracking-wide text-muted-foreground">
      {value}
    </span>
  );
}
