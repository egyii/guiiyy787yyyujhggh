import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArenaShell } from "@/components/arena-shell";
import { QuizCard } from "@/components/quiz-card";
import { fetchQuizzes } from "@/lib/quiz-api";

export const Route = createFileRoute("/quizzes/")({
  head: () => ({
    meta: [
      { title: "All Quizzes — QuizPulse Arenas" },
      {
        name: "description",
        content:
          "Browse every QuizPulse arena: frontend, systems, science, culture and world trivia quizzes by difficulty.",
      },
      { property: "og:title", content: "All Quizzes — QuizPulse Arenas" },
      {
        property: "og:description",
        content: "Browse every QuizPulse arena and pick your difficulty.",
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
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <header className="space-y-2">
          <h1 className="font-display text-3xl font-extrabold sm:text-5xl">All Arenas</h1>
          <p className="text-sm text-muted-foreground">
            Pick a battleground. Every correct answer is worth 100 XP.
          </p>
        </header>

        <div className="flex flex-wrap gap-2">
          {difficulties.map((d) => (
            <button
              key={d}
              onClick={() => setFilter(d)}
              className={`press rounded-full px-4 py-2 text-[10px] font-bold tracking-widest uppercase ring-1 ${
                filter === d
                  ? "bg-primary text-primary-foreground ring-primary"
                  : "bg-surface text-muted-foreground ring-border"
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-44 animate-pulse rounded-[28px] bg-surface" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {list.map((quiz, i) => (
              <QuizCard key={quiz.id} quiz={quiz} index={i} />
            ))}
          </div>
        )}
      </div>
    </ArenaShell>
  );
}
