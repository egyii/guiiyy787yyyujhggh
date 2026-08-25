import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { ArenaShell } from "@/components/arena-shell";
import { QuizCard } from "@/components/quiz-card";
import { LeaderboardList } from "@/components/leaderboard-list";
import { fetchLeaderboard, fetchQuizzes } from "@/lib/quiz-api";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "QuizPulse — Fast, Beautiful Trivia" },
      {
        name: "description",
        content:
          "Play fast, elegantly designed trivia quizzes, earn XP and climb the global QuizPulse leaderboard.",
      },
      { property: "og:title", content: "QuizPulse — Fast, Beautiful Trivia" },
      {
        property: "og:description",
        content: "Minimal, quick quizzes with XP, streaks and a global leaderboard.",
      },
    ],
  }),
  component: Landing,
});

const DEMO = {
  prompt: "Which architecture is synonymous with Apple's M-series chips?",
  options: ["x86-64 instruction set", "ARM architecture", "RISC-V open standard"],
  answer: 1,
};

function Landing() {
  const { user } = useSession();
  const quizzes = useQuery({ queryKey: ["quizzes"], queryFn: fetchQuizzes });
  const leaders = useQuery({ queryKey: ["leaderboard", 5], queryFn: () => fetchLeaderboard(5) });

  const [pick, setPick] = useState<number | null>(null);

  useEffect(() => {
    if (pick === null) return;
    const id = setTimeout(() => setPick(null), 2200);
    return () => clearTimeout(id);
  }, [pick]);

  return (
    <ArenaShell>
      <div className="mx-auto w-full max-w-6xl space-y-24">
        <section className="relative">
          <div
            className="float-slow pointer-events-none absolute -top-32 left-1/2 -z-10 size-[520px] -translate-x-1/2 rounded-full bg-accent/12 blur-[120px]"
            aria-hidden
          />
          <div className="mx-auto max-w-2xl space-y-6 text-center">
            <span className="reveal inline-flex items-center gap-2 rounded-full bg-secondary/70 px-3 py-1 text-xs text-muted-foreground">
              <span className="size-1.5 rounded-full bg-success" />
              {quizzes.data?.length ?? 0} quizzes live
            </span>
            <h1
              className="reveal text-4xl leading-[1.05] font-semibold text-balance sm:text-6xl"
              style={{ animationDelay: "60ms" }}
            >
              Trivia, refined.
            </h1>
            <p
              className="reveal mx-auto max-w-lg text-[17px] leading-relaxed text-pretty text-muted-foreground"
              style={{ animationDelay: "140ms" }}
            >
              Beautifully quiet quizzes that move fast. Answer, learn, earn XP, and climb a
              leaderboard worth caring about.
            </p>
            <div
              className="reveal flex flex-col items-center justify-center gap-3 sm:flex-row"
              style={{ animationDelay: "220ms" }}
            >
              <Link
                to="/quizzes"
                className="press group inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 sm:w-auto"
              >
                Start playing
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
              <Link
                to={user ? "/stats" : "/auth"}
                className="press inline-flex w-full items-center justify-center rounded-full bg-secondary px-6 py-3 text-sm font-medium sm:w-auto"
              >
                {user ? "Your stats" : "Create account"}
              </Link>
            </div>
          </div>

          <div
            className="reveal card-soft mx-auto mt-14 max-w-xl rounded-[24px] p-6"
            style={{ animationDelay: "300ms" }}
          >
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Question 4 of 10</span>
              <span className="tabular-nums">00:08</span>
            </div>
            <div className="mt-3 h-[3px] w-full overflow-hidden rounded-full bg-secondary">
              <div className="h-full w-2/5 rounded-full bg-accent transition-all duration-700" />
            </div>
            <h2 className="mt-5 text-lg leading-snug font-medium">{DEMO.prompt}</h2>
            <div className="mt-4 space-y-2">
              {DEMO.options.map((opt, i) => {
                const selected = pick === i;
                const correct = selected && i === DEMO.answer;
                return (
                  <button
                    key={opt}
                    onClick={() => setPick(i)}
                    className={`press w-full rounded-2xl px-4 py-3 text-left text-sm transition-colors ${
                      correct
                        ? "bg-success/15 text-foreground ring-1 ring-success/40"
                        : selected
                          ? "bg-destructive/10 text-foreground ring-1 ring-destructive/30"
                          : "bg-secondary/60 hover:bg-secondary"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
          {[
            ["Quizzes live", String(quizzes.data?.length ?? 0)],
            ["Players ranked", String(leaders.data?.length ?? 0)],
            ["Accuracy record", "94.2%"],
            ["Longest streak", "12 days"],
          ].map(([label, value], i) => (
            <div key={label} className="reveal space-y-1" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="text-2xl font-semibold tracking-tight sm:text-3xl">{value}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </div>
          ))}
        </section>

        <section className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">Featured quizzes</h2>
              <p className="mt-1 text-sm text-muted-foreground">Pick a topic and start the clock.</p>
            </div>
            <Link
              to="/quizzes"
              className="shrink-0 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              View all
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(quizzes.data ?? []).slice(0, 6).map((quiz, i) => (
              <QuizCard key={quiz.id} quiz={quiz} index={i} />
            ))}
          </div>
        </section>

        <section className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">Top players</h2>
              <p className="mt-1 text-sm text-muted-foreground">Ranked by lifetime XP.</p>
            </div>
            <Link
              to="/leaderboard"
              className="shrink-0 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Full board
            </Link>
          </div>
          <LeaderboardList rows={leaders.data ?? []} highlightId={user?.id} />
        </section>
      </div>
    </ArenaShell>
  );
}
