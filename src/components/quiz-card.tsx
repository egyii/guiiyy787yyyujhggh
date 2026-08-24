import { Link } from "@tanstack/react-router";
import { DifficultyTag } from "@/components/arena-shell";
import type { Quiz } from "@/lib/quiz-api";

export function QuizCard({ quiz, index = 0 }: { quiz: Quiz; index?: number }) {
  return (
    <Link
      to="/quizzes/$slug"
      params={{ slug: quiz.slug }}
      className="rise-in card-surface card-lift group block rounded-xl p-5"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="grid size-9 place-items-center rounded-lg border border-border bg-secondary font-mono text-sm">
          {quiz.icon}
        </div>
        <DifficultyTag value={quiz.difficulty} />
      </div>

      <h3 className="mt-4 text-base font-semibold tracking-tight">{quiz.title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-pretty text-muted-foreground">
        {quiz.description}
      </p>

      <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
        <span className="font-mono tracking-tight uppercase">{quiz.category}</span>
        <span className="font-medium text-foreground transition-transform group-hover:translate-x-0.5">
          Play →
        </span>
      </div>
    </Link>
  );
}
