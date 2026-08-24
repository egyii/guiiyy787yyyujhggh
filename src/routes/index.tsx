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
      { title: "QuizPulse — Timed Trivia Quizzes & Global Leaderboard" },
      {
        name: "description",
        content:
          "Play fast, timed trivia quizzes, earn XP for every correct answer and climb the global QuizPulse leaderboard.",
      },
      { property: "og:title", content: "QuizPulse — Timed Trivia Quizzes" },
      {
        property: "og:description",
        content: "Timed quizzes, XP, streaks and a global leaderboard.",
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

const FEATURES = [
  {
    title: "Timed rounds",
    body: "Every question runs on a countdown, so speed is part of the score.",
  },
  {
    title: "XP that compounds",
    body: "100 XP per correct answer, banked to your profile the moment you finish.",
  },
  {
    title: "Global ranks",
    body: "One leaderboard for everyone, updated as fast as games are played.",
  },
];

function Landing() {
  const { user } = useSession();
  const quizzes = useQuery({ queryKey: ["quizzes"], queryFn: fetchQuizzes });
  const leaders = useQuery({ queryKey: ["leaderboard", 5], queryFn: () => fetchLeaderboard(5) });

  const [pick, setPick] = useState<number | null>(null);
  const [timer, setTimer] = useState(8);

  useEffect(() => {
    const id = setInterval(() => setTimer((t) => (t <= 1 ? 8 : t - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <ArenaShell>
      <div className="mx-auto w-full max-w-6xl">
        {/* Hero */}
        <section className="relative">
          <div className="grid-canvas pointer-events-none absolute -top-24 right-0 left-0 h-[420px]" />
          <div className="relative mx-auto max-w-3xl text-center">
            <span className="rise-in inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted-foreground">
              <span className="size-1.5 rounded-full bg-success" />
              {quizzes.data?.length ?? 6} quizzes live right now
            </span>
            <h1 className="rise-in mt-6 text-5xl leading-[1.05] font-medium tracking-tight text-balance sm:text-[4.25rem]">
              <span className="text-gradient-ink">Trivia that keeps</span>
              <br />
              <span className="font-display italic">score properly.</span>
            </h1>
            <p className="rise-in mx-auto mt-5 max-w-xl text-base leading-relaxed text-pretty text-muted-foreground">
              Timed questions, honest scoring and a single global leaderboard. Sign up with email,
              verify once, and every point you earn is yours forever.
            </p>
            <div className="rise-in mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/quizzes"
                className="press rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Start a quiz
              </Link>
              <Link
                to={user ? "/stats" : "/auth"}
                className="press rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-medium transition-colors hover:bg-secondary"
              >
                {user ? "My stats" : "Create account"}
              </Link>
            </div>
          </div>

          {/* Live question preview */}
          <div className="pop-in card-surface relative mx-auto mt-14 max-w-2xl rounded-2xl p-2">
            <div className="rounded-xl border border-border bg-surface-2 p-6">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs tracking-tight text-muted-foreground uppercase">
                  Question 4 / 10
                </span>
                <span className="flex items-center gap-2 font-mono text-xs">
                  <span className="relative grid size-5 place-items-center">
                    <span className="absolute inset-0 animate-spin rounded-full border border-border border-t-foreground [animation-duration:3s]" />
                  </span>
                  0:0{timer}
                </span>
              </div>
              <h2 className="mt-4 text-lg font-medium tracking-tight">{DEMO.prompt}</h2>
              <div className="mt-4 space-y-2">
                {DEMO.options.map((opt, i) => {
                  const selected = pick === i;
                  const right = selected && i === DEMO.answer;
                  return (
                    <button
                      key={opt}
                      onClick={() => setPick(i)}
                      className={`press w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                        right
                          ? "border-success/40 bg-success/8 text-foreground"
                          : selected
                            ? "border-destructive/40 bg-destructive/8"
                            : "border-border bg-surface hover:bg-secondary"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mt-24 grid gap-6 sm:grid-cols-3">
          {FEATURES.map((f, i) => (
            <div key={f.title} className="rise-in" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="font-mono text-xs text-muted-foreground">0{i + 1}</div>
              <h3 className="mt-3 text-base font-semibold tracking-tight">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </section>

        {/* Quizzes */}
        <section className="mt-24">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-medium tracking-tight">Pick your subject</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Six arenas, thirty questions, one ranking.
              </p>
            </div>
            <Link
              to="/quizzes"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              View all →
            </Link>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(quizzes.data ?? []).slice(0, 6).map((quiz, i) => (
              <QuizCard key={quiz.id} quiz={quiz} index={i} />
            ))}
          </div>
        </section>

        {/* Leaderboard */}
        <section className="mt-24">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-medium tracking-tight">Global leaderboard</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">Top players by lifetime XP.</p>
            </div>
            <Link
              to="/leaderboard"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Full ranks →
            </Link>
          </div>
          <div className="mt-6">
            <LeaderboardList rows={leaders.data ?? []} highlightId={user?.id} />
          </div>
        </section>

        {/* CTA */}
        {!user && (
          <section className="card-surface mt-24 rounded-2xl px-8 py-14 text-center">
            <h2 className="text-3xl font-medium tracking-tight">
              Your XP needs somewhere to live.
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              Create an account with email verification and start banking points on every run.
            </p>
            <Link
              to="/auth"
              className="press mt-7 inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Create free account
            </Link>
          </section>
        )}
      </div>
    </ArenaShell>
  );
}
