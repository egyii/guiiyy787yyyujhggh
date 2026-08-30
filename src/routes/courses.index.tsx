import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen } from "lucide-react";
import { ArenaShell, Breadcrumbs } from "@/components/arena-shell";
import { fetchSubjects } from "@/lib/course-api";

export const Route = createFileRoute("/courses/")({
  head: () => ({
    meta: [
      { title: "Courses — QuizPulse" },
      {
        name: "description",
        content:
          "Structured QuizPulse courses: subjects broken into chapters and classes with video, notes, PDFs, assignments and quizzes.",
      },
      { property: "og:title", content: "Courses — QuizPulse" },
      {
        property: "og:description",
        content: "Subjects, chapters and classes with video, notes and assignments.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CoursesPage,
});

function CoursesPage() {
  const { data, isLoading } = useQuery({ queryKey: ["subjects"], queryFn: fetchSubjects });
  const subjects = data ?? [];

  return (
    <ArenaShell>
      <div className="mx-auto w-full max-w-6xl space-y-10">
        <Breadcrumbs items={[{ label: "Courses" }]} />

        <header className="max-w-xl space-y-3">
          <h1 className="reveal text-3xl font-semibold sm:text-5xl">Courses</h1>
          <p
            className="reveal text-[17px] text-muted-foreground"
            style={{ animationDelay: "80ms" }}
          >
            Every subject is split into chapters and sub-chapters, and every class carries its video,
            notes, PDF, assignment and quiz.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          {isLoading
            ? [0, 1].map((i) => <div key={i} className="h-40 animate-pulse rounded-[24px] bg-surface" />)
            : subjects.map((subject, i) => (
                <Link
                  key={subject.id}
                  to="/courses/$subject"
                  params={{ subject: subject.slug }}
                  className="press card-soft sheen reveal group flex flex-col gap-3 rounded-[24px] p-6"
                  style={{ animationDelay: `${i * 70}ms` }}
                >
                  <span className="grid size-10 place-items-center rounded-2xl bg-secondary/70 text-foreground/80">
                    <BookOpen className="size-[18px]" />
                  </span>
                  <h2 className="text-lg font-medium">{subject.title}</h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {subject.description}
                  </p>
                  <span className="mt-auto inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors group-hover:text-foreground">
                    Open syllabus
                    <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
        </div>
      </div>
    </ArenaShell>
  );
}
