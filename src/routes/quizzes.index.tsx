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
        content: "Browse every quiz and pick your difficulty.",
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
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <header className="max-w-xl space-y-3">
          <h1 className="reveal text-3xl font-semibold sm:text-5xl">All quizzes</h1>
          <p className="reveal text-[17px] text-muted-foreground" style={{ animationDelay: "80ms" }}>
            Every correct answer is worth 100 XP. Choose your difficulty.
          </p>
        </header>

        <div className="flex flex-wrap gap-2">
          {difficulties.map((d) => (
            <button
              key={d}
              onClick={() => setFilter(d)}
              className={`press rounded-full px-4 py-2 text-sm ${
                filter === d
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/70 text-muted-foreground hover:text-foreground"
              }`}
            >
              {d === "ALL" ? "All" : d.charAt(0) + d.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? [0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-44 animate-pulse rounded-[22px] bg-surface" />
              ))
            : list.map((quiz, i) => <QuizCard key={quiz.id} quiz={quiz} index={i} />)}
        </div>
      </div>
    </ArenaShell>
  );
}
