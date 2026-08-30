import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen } from "lucide-react";
import { ArenaShell, Breadcrumbs } from "@/components/arena-shell";
import { fetchCourseBySlug, fetchCourseStats } from "@/lib/course-api";

export const Route = createFileRoute("/courses/$course/")({
  head: () => ({
    meta: [
      { title: "Course subjects — QuizPulse" },
      {
        name: "description",
        content:
          "Subjects inside this course, each with chapters, sub-chapters and classes carrying video, notes and assignments.",
      },
      { property: "og:title", content: "Course subjects — QuizPulse" },
      {
        property: "og:description",
        content: "Subjects, chapters and classes inside this QuizPulse course.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CoursePage,
});

function CoursePage() {
  const { course: slug } = Route.useParams();
  const course = useQuery({ queryKey: ["course", slug], queryFn: () => fetchCourseBySlug(slug) });
  const stats = useQuery({
    queryKey: ["course-stats", course.data?.id],
    queryFn: () => fetchCourseStats(course.data!.id),
    enabled: !!course.data?.id,
  });

  const subjects = stats.data?.subjects ?? [];
  const chapters = stats.data?.chapters ?? [];
  const lessonCount = stats.data?.lessonCount ?? {};

  return (
    <ArenaShell>
      <div className="mx-auto w-full max-w-5xl space-y-10">
        <Breadcrumbs
          items={[{ label: "Courses", to: "/courses" }, { label: course.data?.title ?? "Course" }]}
        />

        <header className="max-w-xl space-y-3">
          <h1 className="reveal text-3xl font-semibold sm:text-5xl">{course.data?.title ?? "Course"}</h1>
          <p className="reveal text-[17px] text-muted-foreground" style={{ animationDelay: "80ms" }}>
            {course.data?.description}
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          {stats.isLoading || course.isLoading
            ? [0, 1].map((i) => <div key={i} className="h-36 animate-pulse rounded-[24px] bg-surface" />)
            : subjects.map((subject, i) => (
                <Link
                  key={subject.id}
                  to="/courses/$course/$subject"
                  params={{ course: slug, subject: subject.slug }}
                  className="press card-soft sheen reveal group flex flex-col gap-3 rounded-[24px] p-6"
                  style={{ animationDelay: `${i * 70}ms` }}
                >
                  <span className="grid size-10 place-items-center rounded-2xl bg-secondary/70 text-foreground/80">
                    <BookOpen className="size-[18px]" />
                  </span>
                  <h2 className="text-lg font-medium">{subject.title}</h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">{subject.description}</p>
                  <span className="text-[12px] text-muted-foreground">
                    {chapters.filter((c) => c.subject_id === subject.id && !c.parent_id).length} chapters ·{" "}
                    {lessonCount[subject.id] ?? 0} classes
                  </span>
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
