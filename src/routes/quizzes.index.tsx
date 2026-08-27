import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { ArenaShell, Breadcrumbs } from "@/components/arena-shell";
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

const DIFFICULTIES = ["ALL", "NOVICE", "ADEPT", "EXPERT"] as const;

function label(value: string) {
  return value === "ALL" ? "All" : value.charAt(0) + value.slice(1).toLowerCase();
}

function QuizzesPage() {
  const { data, isLoading } = useQuery({ queryKey: ["quizzes"], queryFn: fetchQuizzes });
  const [difficulty, setDifficulty] = useState<string>("ALL");
  const [category, setCategory] = useState<string>("ALL");
  const [query, setQuery] = useState("");

  const quizzes = data ?? [];
  const categories = useMemo(
    () => ["ALL", ...Array.from(new Set(quizzes.map((q) => q.category))).sort()],
    [quizzes],
  );

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return quizzes.filter((quiz) => {
      if (difficulty !== "ALL" && quiz.difficulty !== difficulty) return false;
      if (category !== "ALL" && quiz.category !== category) return false;
      if (!q) return true;
      return `${quiz.title} ${quiz.description} ${quiz.category}`.toLowerCase().includes(q);
    });
  }, [quizzes, difficulty, category, query]);

  const filtered = difficulty !== "ALL" || category !== "ALL" || query.trim() !== "";

  function reset() {
    setDifficulty("ALL");
    setCategory("ALL");
    setQuery("");
  }

  return (
    <ArenaShell>
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <Breadcrumbs items={[{ label: "Quizzes" }]} />

        <header className="max-w-xl space-y-3">
          <h1 className="reveal text-3xl font-semibold sm:text-5xl">All quizzes</h1>
          <p
            className="reveal text-[17px] text-muted-foreground"
            style={{ animationDelay: "80ms" }}
          >
            Every correct answer is worth 100 XP. Search a topic or pick your difficulty.
          </p>
        </header>

        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="search"
              placeholder="Search quizzes"
              aria-label="Search quizzes"
              className="press w-full rounded-full bg-surface py-3 pr-10 pl-11 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/40"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="press absolute top-1/2 right-3 grid size-7 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-secondary"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`press shrink-0 rounded-full px-4 py-2 text-sm ${
                  difficulty === d
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/70 text-muted-foreground hover:text-foreground"
                }`}
              >
                {label(d)}
              </button>
            ))}
          </div>

          {categories.length > 1 && (
            <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`press shrink-0 rounded-full px-3.5 py-1.5 text-[13px] ${
                    category === c
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {c === "ALL" ? "All topics" : c}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 text-[13px] text-muted-foreground">
            <span>
              {isLoading
                ? "Loading quizzes…"
                : `${list.length} quiz${list.length === 1 ? "" : "zes"}`}
            </span>
            {filtered && (
              <button onClick={reset} className="press font-medium text-foreground underline">
                Clear filters
              </button>
            )}
          </div>
        </div>

        {!isLoading && list.length === 0 ? (
          <div className="card-soft mx-auto max-w-md space-y-3 rounded-[24px] p-8 text-center">
            <h2 className="text-lg font-semibold">No quizzes match</h2>
            <p className="text-sm text-muted-foreground">
              Try a different topic, difficulty, or search term.
            </p>
            <button
              onClick={reset}
              className="press rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading
              ? [0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-44 animate-pulse rounded-[22px] bg-surface" />
                ))
              : list.map((quiz, i) => <QuizCard key={quiz.id} quiz={quiz} index={i} />)}
          </div>
        )}
      </div>
    </ArenaShell>
  );
}
