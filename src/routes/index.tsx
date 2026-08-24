import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArenaShell } from "@/components/arena-shell";
import { QuizCard } from "@/components/quiz-card";
import { LeaderboardList } from "@/components/leaderboard-list";
import { fetchLeaderboard, fetchQuizzes } from "@/lib/quiz-api";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "QuizPulse — Live Trivia Arena & Global Leaderboard" },
      {
        name: "description",
        content:
          "Play fast, animated trivia quizzes, earn XP and climb the global QuizPulse leaderboard.",
      },
      { property: "og:title", content: "QuizPulse — Live Trivia Arena" },
      {
        property: "og:description",
        content: "Fast animated quizzes, XP, streaks and a global leaderboard.",
      },
    ],
  }),
  component: Landing,
});

const DEMO = {
  prompt: "Which architecture is synonymous with Apple's M-series chips?",
  options: ["x86-64 Instruction Set", "ARM Architecture", "RISC-V Open Standard"],
  answer: 1,
};

function Landing() {
  const { user } = useSession();
  const quizzes = useQuery({ queryKey: ["quizzes"], queryFn: fetchQuizzes });
  const leaders = useQuery({ queryKey: ["leaderboard", 3], queryFn: () => fetchLeaderboard(3) });

  const [pick, setPick] = useState<number | null>(null);
  const [timer, setTimer] = useState(8);

  useEffect(() => {
    const id = setInterval(() => setTimer((t) => (t <= 1 ? 8 : t - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <ArenaShell>
      <div className="mx-auto w-full max-w-5xl space-y-12">
        <section className="space-y-6">
          <div className="rise-in space-y-3">
            <h1 className="font-display text-4xl leading-tight font-extrabold text-balance sm:text-6xl">
              Crush the <span className="text-primary">Competition.</span>
            </h1>
            <p className="max-w-[36ch] text-pretty text-muted-foreground">
              The high-stakes trivia arena for the sharpest minds.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-[24px] bg-surface p-5 ring-1 ring-border">
            <div className="absolute -inset-16 glow-breathe -z-0 bg-primary/10 blur-3xl" />
            <div className="absolute top-0 right-0 p-4">
              <div className="relative grid size-10 place-items-center rounded-full border-2 border-primary/20">
                <div className="absolute inset-0 animate-spin rounded-full border-2 border-primary border-t-transparent [animation-duration:3s]" />
                <span className="font-mono text-xs font-bold">
                  {String(timer).padStart(2, "0")}
                </span>
              </div>
            </div>

            <div className="relative space-y-4 pt-2">
              <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
                Question 4 of 10
              </span>
              <h3 className="text-xl leading-snug font-medium">{DEMO.prompt}</h3>
              <div className="space-y-2">
                {DEMO.options.map((opt, i) => {
                  const selected = pick === i;
                  const correct = selected && i === DEMO.answer;
                  return (
                    <button
                      key={opt}
                      onClick={() => setPick(i)}
                      className={`press w-full rounded-xl p-3 text-left text-sm font-medium ring-1 ${
                        correct
                          ? "bg-primary text-primary-foreground ring-2 ring-primary"
                          : selected
                            ? "bg-destructive/20 ring-destructive/40"
                            : "bg-secondary/50 ring-border"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              to="/quizzes"
              className="press flex-1 rounded-2xl bg-primary px-6 py-3 text-center text-sm font-bold text-primary-foreground glow-ring"
            >
              Start Playing
            </Link>
            <Link
              to={user ? "/stats" : "/auth"}
              className="press flex-none rounded-2xl bg-secondary px-5 py-3 text-sm font-bold text-secondary-foreground ring-1 ring-border"
            >
              Stats
            </Link>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Quizzes live", String(quizzes.data?.length ?? 0)],
            ["Players ranked", String(leaders.data?.length ?? 0)],
            ["Accuracy record", "94.2%"],
            ["Longest streak", "12 Days"],
          ].map(([label, value]) => (
            <div key={label} className="space-y-1 rounded-[20px] bg-surface p-4 ring-1 ring-border">
              <span className="text-[10px] font-semibold uppercase tracking-tight text-muted-foreground">
                {label}
              </span>
              <div className="font-display text-2xl font-bold text-accent">{value}</div>
            </div>
          ))}
        </section>

        <section className="space-y-4">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-xl font-bold">Global Top</h2>
            <Link to="/leaderboard" className="text-xs font-medium text-primary">
              View All Ranks
            </Link>
          </div>
          <LeaderboardList rows={leaders.data ?? []} highlightId={user?.id} />
        </section>

        <section className="space-y-4 pb-6">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-xl font-bold">Browse Arenas</h2>
            <Link to="/quizzes" className="text-xs font-medium text-primary">
              All quizzes
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {(quizzes.data ?? []).slice(0, 4).map((quiz, i) => (
              <QuizCard key={quiz.id} quiz={quiz} index={i} />
            ))}
          </div>
        </section>

        {!user && (
          <div className="fixed right-5 bottom-6 left-5 z-40 mx-auto max-w-md">
            <div className="flex items-center justify-between rounded-[20px] bg-surface/90 p-4 shadow-2xl ring-1 ring-primary/30 backdrop-blur-xl">
              <div className="space-y-0.5">
                <div className="text-xs font-semibold">Join the Arena</div>
                <div className="text-[10px] text-muted-foreground">
                  Verify email for +500 XP bonus
                </div>
              </div>
              <Link
                to="/auth"
                className="press rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
              >
                Sign Up
              </Link>
            </div>
          </div>
        )}
      </div>
    </ArenaShell>
  );
}
