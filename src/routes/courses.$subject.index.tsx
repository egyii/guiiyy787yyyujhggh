import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, FileText, ListChecks, PlayCircle } from "lucide-react";
import { useState } from "react";
import { ArenaShell, Breadcrumbs } from "@/components/arena-shell";
import { fetchSubjectBySlug, fetchSubjectOutline, type Chapter, type Lesson } from "@/lib/course-api";

export const Route = createFileRoute("/courses/$subject/")({
  head: () => ({
    meta: [
      { title: "Syllabus — QuizPulse Courses" },
      {
        name: "description",
        content:
          "Chapters, sub-chapters and classes for this subject, each with video, notes, assignment and quiz.",
      },
      { property: "og:title", content: "Syllabus — QuizPulse Courses" },
      {
        property: "og:description",
        content: "Chapters, sub-chapters and classes for this subject.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SubjectPage,
});

function LessonRow({ lesson }: { lesson: Lesson }) {
  return (
    <Link
      to="/courses/$subject/$lesson"
      params={{ subject: Route.useParams().subject, lesson: lesson.slug }}
      className="press flex items-center gap-3 rounded-2xl px-3 py-3 text-sm hover:bg-secondary/50"
    >
      <PlayCircle className="size-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate font-medium">{lesson.title}</span>
      <span className="flex shrink-0 items-center gap-2 text-[12px] text-muted-foreground">
        {lesson.pdf_url && <FileText className="size-3.5" />}
        {lesson.quiz_id && <ListChecks className="size-3.5" />}
        {lesson.duration_minutes ? `${lesson.duration_minutes}m` : null}
      </span>
    </Link>
  );
}

function ChapterBlock({
  chapter,
  children,
  lessons,
  depth,
}: {
  chapter: Chapter;
  children: Chapter[];
  lessons: (id: string) => Lesson[];
  depth: number;
}) {
  const [open, setOpen] = useState(depth === 0);
  const own = lessons(chapter.id);

  return (
    <div className={depth === 0 ? "card-soft rounded-[24px] p-2" : "pl-3"}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="press flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left hover:bg-secondary/40"
      >
        <span className="min-w-0 flex-1">
          <span className={depth === 0 ? "font-medium" : "text-sm font-medium"}>{chapter.title}</span>
          {chapter.summary && (
            <span className="mt-0.5 block truncate text-[13px] text-muted-foreground">
              {chapter.summary}
            </span>
          )}
        </span>
        <ChevronDown
          className={`size-4 shrink-0 text-muted-foreground transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="reveal space-y-1 pb-2">
          {own.map((lesson) => (
            <LessonRow key={lesson.id} lesson={lesson} />
          ))}
          {children.map((child) => (
            <ChapterBlock
              key={child.id}
              chapter={child}
              children={[]}
              lessons={lessons}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SubjectPage() {
  const { subject: slug } = Route.useParams();
  const subject = useQuery({ queryKey: ["subject", slug], queryFn: () => fetchSubjectBySlug(slug) });
  const outline = useQuery({
    queryKey: ["subject-outline", subject.data?.id],
    queryFn: () => fetchSubjectOutline(subject.data!.id),
    enabled: !!subject.data?.id,
  });

  const chapters = outline.data?.chapters ?? [];
  const lessons = outline.data?.lessons ?? [];
  const roots = chapters.filter((c) => !c.parent_id);
  const lessonsFor = (id: string) => lessons.filter((l) => l.chapter_id === id);

  return (
    <ArenaShell>
      <div className="mx-auto w-full max-w-3xl space-y-8">
        <Breadcrumbs
          items={[
            { label: "Courses", to: "/courses" },
            { label: subject.data?.title ?? "Subject" },
          ]}
        />

        <header className="space-y-3">
          <h1 className="reveal text-3xl font-semibold sm:text-4xl">
            {subject.data?.title ?? "Subject"}
          </h1>
          <p className="reveal text-[16px] text-muted-foreground" style={{ animationDelay: "80ms" }}>
            {subject.data?.description}
          </p>
        </header>

        <div className="space-y-3">
          {outline.isLoading
            ? [0, 1].map((i) => <div key={i} className="h-24 animate-pulse rounded-[24px] bg-surface" />)
            : roots.map((root) => (
                <ChapterBlock
                  key={root.id}
                  chapter={root}
                  children={chapters.filter((c) => c.parent_id === root.id)}
                  lessons={lessonsFor}
                  depth={0}
                />
              ))}
        </div>
      </div>
    </ArenaShell>
  );
}
