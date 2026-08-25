import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { DifficultyTag } from "@/components/arena-shell";
import type { Quiz } from "@/lib/quiz-api";

export function QuizCard({ quiz, index = 0 }: { quiz: Quiz; index?: number }) {
  return (
    <Link
      to="/quizzes/$slug"
      params={{ slug: quiz.slug }}
      className="reveal lift card-soft sheen group relative block rounded-[22px] p-5"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-secondary/80 text-sm">
          {quiz.icon}
        </span>
        <DifficultyTag value={quiz.difficulty} />
      </div>

      <h3 className="mt-4 flex items-center gap-1.5 text-[17px] font-semibold">
        {quiz.title}
        <ArrowUpRight className="size-4 text-muted-foreground opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100" />
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-pretty text-muted-foreground">
        {quiz.description}
      </p>
      <div className="mt-4 text-xs text-muted-foreground">{quiz.category}</div>
    </Link>
  );
}
