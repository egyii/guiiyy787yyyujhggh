import { Link } from "@tanstack/react-router";
import { DifficultyTag } from "@/components/arena-shell";
import type { Quiz } from "@/lib/quiz-api";

export function QuizCard({ quiz, index = 0 }: { quiz: Quiz; index?: number }) {
  const featured = index % 3 === 0;
  return (
    <Link
      to="/quizzes/$slug"
      params={{ slug: quiz.slug }}
      className="rise-in press group relative block rounded-[28px] p-1"
      style={{
        animationDelay: `${index * 70}ms`,
        background: featured
          ? "linear-gradient(135deg, color-mix(in oklab, var(--primary) 30%, transparent), transparent)"
          : "color-mix(in oklab, var(--surface-2) 60%, transparent)",
      }}
    >
      <div className="space-y-4 rounded-[27px] bg-surface p-5">
        <div className="flex items-start justify-between">
          <div className="grid size-10 place-items-center rounded-xl bg-secondary font-mono text-primary ring-1 ring-border">
            {quiz.icon}
          </div>
          <DifficultyTag value={quiz.difficulty} />
        </div>
        <div>
          <h4 className="font-display text-lg font-bold">{quiz.title}</h4>
          <p className="text-xs text-pretty text-muted-foreground">{quiz.description}</p>
        </div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
          {quiz.category} — Play now
        </div>
      </div>
    </Link>
  );
}
