import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArenaShell } from "@/components/arena-shell";
import { QuizCard } from "@/components/quiz-card";
import { fetchQuizzes } from "@/lib/quiz-api";

export const Route = createFileRoute("/quizzes/")({
  head: () => ({
    meta: [
      { title: "All Quizzes — QuizPulse" },
      {
        name: "description",
        content:
          "Browse every QuizPulse quiz: frontend, systems, science, culture and world trivia, filtered by difficulty.",
      },
      { property: "og:title", content: "All Quizzes — QuizPulse" },
      {
        property: "og:description",
        content: "Browse every QuizPulse quiz and pick your difficulty.",
      },
    ],
  }),
  component: QuizzesPage,
});

function QuizzesPage() {
  const { data, isLoading } = useQuery({ queryKey: ["quizzes"], queryFn: fetchQuizzes });
  const [filter, setFilter] = useState("ALL");

  const difficulties = ["ALL", "NOVICE", "ADEPT", "EXPERT"];
  const list = (data ?? []).filter((q) => filter === "ALL" || q.difficulty === filter);

  return (
    <ArenaShell>
      <div className="mx-auto w-full max-w-6xl">
        <header className="max-w-2xl">
          <h1 className="text-4xl font-medium tracking-tight sm:text-5xl">
            Every <span className="font-display italic">quiz</span>.
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            Pick a subject and start the clock. Each correct answer is worth 100 XP.
          </p>
        </header>

        <div className="mt-8 flex flex-wrap gap-2">
          {difficulties.map((d) => (
            <button
              key={d}
              onClick={() => setFilter(d)}
              className={`press rounded-lg border px-3.5 py-1.5 text-xs font-medium tracking-tight transition-colors ${
                filter === d
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-surface text-muted-foreground hover:bg-secondary"
              }`}
            >
              {d.charAt(0) + d.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? [0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-48 animate-pulse rounded-xl border border-border bg-surface-2" />
              ))
            : list.map((quiz, i) => <QuizCard key={quiz.id} quiz={quiz} index={i} />)}
        </div>
      </div>
    </ArenaShell>
  );
}
