import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import { ArenaShell, Breadcrumbs, DifficultyTag } from "@/components/arena-shell";
import { fetchQuestions, fetchQuizBySlug, saveAttempt } from "@/lib/quiz-api";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/quizzes/$slug")({
  head: () => ({
    meta: [
      { title: "Play a Quiz — QuizPulse Arena" },
      {
        name: "description",
        content:
          "Answer against the clock, chain correct answers and bank XP in this QuizPulse arena.",
      },
      { property: "og:title", content: "Play a Quiz — QuizPulse Arena" },
      { property: "og:description", content: "Answer against the clock and bank XP." },
    ],
  }),
  component: PlayPage,
});

const QUESTION_SECONDS = 15;

function PlayPage() {
  const { slug } = useParams({ from: "/quizzes/$slug" });
  const { user } = useSession();

  const quiz = useQuery({ queryKey: ["quiz", slug], queryFn: () => fetchQuizBySlug(slug) });
  const questions = useQuery({
    queryKey: ["questions", quiz.data?.id],
    queryFn: () => fetchQuestions(quiz.data!.id),
    enabled: Boolean(quiz.data?.id),
  });

  const list = useMemo(() => questions.data ?? [], [questions.data]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [seconds, setSeconds] = useState(QUESTION_SECONDS);
  const [saved, setSaved] = useState<number | null>(null);

  const current = list[index];

  useEffect(() => {
    if (!current || picked !== null || done) return;
    if (seconds === 0) {
      setPicked(-1);
      return;
    }
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds, picked, current, done]);

  useEffect(() => {
    if (!done || !user || !quiz.data || saved !== null) return;
    saveAttempt({ userId: user.id, quizId: quiz.data.id, score, total: list.length })
      .then((xp) => setSaved(xp))
      .catch(() => setSaved(0));
  }, [done, user, quiz.data, score, list.length, saved]);

  const choose = useCallback(
    (i: number) => {
      setPicked((prev) => {
        if (prev !== null) return prev;
        if (i === current?.correct_index) setScore((s) => s + 1);
        return i;
      });
    },
    [current],
  );

  const next = useCallback(() => {
    if (index + 1 >= list.length) {
      setDone(true);
      return;
    }
    setIndex((i) => i + 1);
    setPicked(null);
    setSeconds(QUESTION_SECONDS);
  }, [index, list.length]);

  useEffect(() => {
    if (done) return;
    function onKey(e: KeyboardEvent) {
      const n = Number(e.key);
      if (n >= 1 && n <= (current?.options.length ?? 0)) choose(n - 1);
      if (e.key === "Enter" && picked !== null) next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [choose, next, picked, current, done]);

  function restart() {
    setIndex(0);
    setPicked(null);
    setScore(0);
    setDone(false);
    setSaved(null);
    setSeconds(QUESTION_SECONDS);
  }

  if (quiz.isLoading || questions.isLoading) {
    return (
      <ArenaShell>
        <div className="mx-auto h-96 w-full max-w-2xl animate-pulse rounded-[24px] bg-surface" />
      </ArenaShell>
    );
  }

  if (!quiz.data) {
    return (
      <ArenaShell>
        <div className="mx-auto max-w-md space-y-4 text-center">
          <h1 className="text-2xl font-semibold">Quiz not found</h1>
          <p className="text-sm text-muted-foreground">
            That quiz may have been renamed or removed.
          </p>
          <Link
            to="/quizzes"
            className="press inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
          >
            Browse all quizzes
          </Link>
        </div>
      </ArenaShell>
    );
  }

  if (done) {
    const pct = list.length ? Math.round((score / list.length) * 100) : 0;
    return (
      <ArenaShell>
        <div className="mx-auto w-full max-w-md space-y-6">
          <Breadcrumbs
            items={[
              { label: "Quizzes", to: "/quizzes" },
              { label: quiz.data.title },
            ]}
          />
          <div className="reveal card-soft space-y-6 rounded-[28px] p-8 text-center">
            <span className="text-xs font-medium tracking-wide text-muted-foreground">
              Quiz complete
            </span>
            <div className="text-6xl font-semibold tracking-tight">{pct}%</div>
            <p className="text-sm text-muted-foreground">
              {score} of {list.length} correct in {quiz.data.title}
            </p>
            <div className="rounded-2xl bg-secondary/60 p-4 text-sm">
              {user
                ? `+${saved ?? score * 100} XP added to your profile`
                : "Create a free account to save XP and join the leaderboard"}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                onClick={restart}
                className="press flex-1 rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground"
              >
                Play again
              </button>
              <Link
                to={user ? "/leaderboard" : "/auth"}
                className="press flex-1 rounded-full bg-secondary py-3 text-sm font-medium"
              >
                {user ? "See leaderboard" : "Create account"}
              </Link>
            </div>
            <Link
              to="/quizzes"
              className="press inline-block text-sm text-muted-foreground hover:text-foreground"
            >
              Back to all quizzes
            </Link>
          </div>
        </div>
      </ArenaShell>
    );
  }

  const answered = index + (picked !== null ? 1 : 0);

  return (
    <ArenaShell>
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <Breadcrumbs
          items={[{ label: "Quizzes", to: "/quizzes" }, { label: quiz.data.title }]}
        />

        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold sm:text-2xl">{quiz.data.title}</h1>
            <p className="text-sm text-muted-foreground">{quiz.data.category}</p>
          </div>
          <DifficultyTag value={quiz.data.difficulty} />
        </div>

        <div className="space-y-2">
          <div className="h-1 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-foreground/80 transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ width: `${(answered / Math.max(list.length, 1)) * 100}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[13px] text-muted-foreground">
            <span>
              Question {index + 1} of {list.length}
            </span>
            <span>
              Score {score}/{list.length}
            </span>
          </div>
        </div>

        <div key={current?.id} className="reveal card-soft rounded-[24px] p-6">
          <div className="mb-5 h-0.5 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-1000 ease-linear"
              style={{ width: `${(seconds / QUESTION_SECONDS) * 100}%` }}
            />
          </div>

          <h2 className="text-xl leading-snug font-medium text-pretty">{current?.prompt}</h2>

          <div className="mt-5 space-y-2">
            {(current?.options ?? []).map((opt, i) => {
              const isCorrect = i === current?.correct_index;
              const revealed = picked !== null;
              const wrongPick = revealed && picked === i && !isCorrect;
              return (
                <button
                  key={opt}
                  onClick={() => choose(i)}
                  disabled={revealed}
                  className={`press flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left text-[15px] transition-colors ${
                    revealed && isCorrect
                      ? "bg-success/15 text-foreground"
                      : wrongPick
                        ? "bg-destructive/12 text-foreground"
                        : "bg-secondary/50 hover:bg-secondary"
                  } ${revealed && !isCorrect && !wrongPick ? "opacity-55" : ""}`}
                >
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-background/70 text-[11px] font-medium text-muted-foreground">
                    {revealed && isCorrect ? (
                      <Check className="size-3.5 text-success" />
                    ) : wrongPick ? (
                      <X className="size-3.5 text-destructive" />
                    ) : (
                      i + 1
                    )}
                  </span>
                  <span className="min-w-0 flex-1">{opt}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <Link
            to="/quizzes"
            className="press text-sm text-muted-foreground hover:text-foreground"
          >
            Exit quiz
          </Link>
          <button
            onClick={next}
            disabled={picked === null}
            className="press rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground disabled:opacity-40"
          >
            {index + 1 >= list.length ? "Finish" : "Next question"}
          </button>
        </div>

        <p className="hidden text-center text-xs text-muted-foreground sm:block">
          Tip: press 1–4 to answer, Enter to continue.
        </p>
      </div>
    </ArenaShell>
  );
}
