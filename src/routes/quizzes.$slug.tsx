import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ArenaShell, DifficultyTag } from "@/components/arena-shell";
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

  function choose(i: number) {
    if (picked !== null) return;
    setPicked(i);
    if (i === current?.correct_index) setScore((s) => s + 1);
  }

  function next() {
    if (index + 1 >= list.length) {
      setDone(true);
      return;
    }
    setIndex((i) => i + 1);
    setPicked(null);
    setSeconds(QUESTION_SECONDS);
  }

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
          <h1 className="font-display text-2xl font-bold">Arena not found</h1>
          <Link to="/quizzes" className="text-sm font-semibold text-primary">
            Back to all quizzes
          </Link>
        </div>
      </ArenaShell>
    );
  }

  if (done) {
    const pct = list.length ? Math.round((score / list.length) * 100) : 0;
    return (
      <ArenaShell>
        <div className="pop-in mx-auto max-w-md space-y-6 rounded-[28px] bg-surface p-8 text-center ring-1 ring-primary/30 glow-ring">
          <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-muted-foreground">
            Run complete
          </span>
          <div className="font-display text-6xl font-extrabold text-primary">{pct}%</div>
          <p className="text-sm text-muted-foreground">
            {score} of {list.length} correct in {quiz.data.title}
          </p>
          <div className="rounded-2xl bg-secondary/60 p-4 text-sm font-semibold">
            {user
              ? `+${saved ?? score * 100} XP banked to your profile`
              : "Sign up to bank XP and enter the leaderboard"}
          </div>
          <div className="flex gap-3">
            <button
              onClick={restart}
              className="press flex-1 rounded-2xl bg-primary py-3 text-sm font-bold text-primary-foreground"
            >
              Play again
            </button>
            <Link
              to={user ? "/leaderboard" : "/auth"}
              className="press flex-1 rounded-2xl bg-secondary py-3 text-sm font-bold text-secondary-foreground ring-1 ring-border"
            >
              {user ? "Ranks" : "Sign up"}
            </Link>
          </div>
        </div>
      </ArenaShell>
    );
  }

  return (
    <ArenaShell>
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-extrabold">{quiz.data.title}</h1>
            <p className="text-xs text-muted-foreground">{quiz.data.category}</p>
          </div>
          <DifficultyTag value={quiz.data.difficulty} />
        </div>

        <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${((index + (picked !== null ? 1 : 0)) / list.length) * 100}%` }}
          />
        </div>

        <div
          key={current?.id}
          className="pop-in relative overflow-hidden rounded-[24px] bg-surface p-5 ring-1 ring-border"
        >
          <div className="absolute top-0 right-0 p-4">
            <div className="relative grid size-10 place-items-center rounded-full border-2 border-primary/20">
              <div className="absolute inset-0 animate-spin rounded-full border-2 border-primary border-t-transparent [animation-duration:2s]" />
              <span className="font-mono text-xs font-bold">
                {String(seconds).padStart(2, "0")}
              </span>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
              Question {index + 1} of {list.length}
            </span>
            <h3 className="pr-12 text-xl leading-snug font-medium">{current?.prompt}</h3>

            <div className="space-y-2">
              {(current?.options ?? []).map((opt, i) => {
                const isCorrect = i === current?.correct_index;
                const revealed = picked !== null;
                return (
                  <button
                    key={opt}
                    onClick={() => choose(i)}
                    className={`press w-full rounded-xl p-3 text-left text-sm font-medium ring-1 ${
                      revealed && isCorrect
                        ? "bg-primary text-primary-foreground ring-2 ring-primary"
                        : revealed && picked === i
                          ? "bg-destructive/20 ring-destructive/40"
                          : "bg-secondary/50 ring-border hover:bg-secondary"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-muted-foreground">
            SCORE {score}/{list.length}
          </span>
          <button
            onClick={next}
            disabled={picked === null}
            className="press rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground disabled:opacity-40"
          >
            {index + 1 >= list.length ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    </ArenaShell>
  );
}
