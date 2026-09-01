import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ClipboardList, FileText, NotebookPen, Play } from "lucide-react";
import { ArenaShell, Breadcrumbs } from "@/components/arena-shell";
import { fetchLessonBySlug } from "@/lib/course-api";

export const Route = createFileRoute("/courses/$subject/$lesson")({
  head: () => ({
    meta: [
      { title: "Class — QuizPulse Courses" },
      {
        name: "description",
        content:
          "Watch the class video, read the notes, download the PDF, take the linked quiz and submit the assignment.",
      },
      { property: "og:title", content: "Class — QuizPulse Courses" },
      {
        property: "og:description",
        content: "Video, notes, PDF, quiz and assignment for this class.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LessonPage,
});

type TabKey = "notes" | "pdf" | "assignment" | "quiz";

function LessonPage() {
  const { subject, lesson: slug } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["lesson", slug],
    queryFn: () => fetchLessonBySlug(slug),
  });

  const [partIndex, setPartIndex] = useState(0);
  const [tab, setTab] = useState<TabKey | null>(null);

  const lesson = data?.lesson;
  const parts = data?.parts ?? [];
  // The class itself is "Part 1" when extra parts exist.
  const segments = lesson
    ? [
        {
          key: lesson.id,
          title: parts.length ? `Part 1 — ${lesson.title}` : lesson.title,
          video_url: lesson.video_url,
          pdf_url: lesson.pdf_url,
          notes: lesson.notes,
          assignment: lesson.assignment,
          duration_minutes: lesson.duration_minutes,
          description: lesson.description,
        },
        ...parts.map((p, i) => ({
          key: p.id,
          title: `Part ${i + 2} — ${p.title}`,
          video_url: p.video_url,
          pdf_url: p.pdf_url,
          notes: p.notes,
          assignment: p.assignment,
          duration_minutes: p.duration_minutes,
          description: p.description,
        })),
      ]
    : [];

  const active = segments[Math.min(partIndex, Math.max(segments.length - 1, 0))];
  const quiz = data?.quiz ?? null;

  const tabs: { key: TabKey; label: string; icon: typeof Play; available: boolean }[] = [
    { key: "notes", label: "Class notes", icon: NotebookPen, available: Boolean(active?.notes) },
    { key: "pdf", label: "Reading material", icon: FileText, available: Boolean(active?.pdf_url) },
    {
      key: "assignment",
      label: "Assignment",
      icon: ClipboardList,
      available: Boolean(active?.assignment),
    },
    { key: "quiz", label: "Quiz", icon: Play, available: Boolean(quiz?.slug) },
  ];
  const openTab = tab ?? tabs.find((t) => t.available)?.key ?? null;

  return (
    <ArenaShell>
      <div className="mx-auto w-full max-w-3xl space-y-8">
        <Breadcrumbs
          items={[
            { label: "Courses", to: "/courses" },
            {
              label: data?.subject?.title ?? "Subject",
              to: "/courses/$subject",
              params: { subject },
            },
            { label: lesson?.title ?? "Class" },
          ]}
        />

        {isLoading ? (
          <div className="h-64 animate-pulse rounded-[24px] bg-surface" />
        ) : !lesson ? (
          <div className="card-soft space-y-3 rounded-[24px] p-8 text-center">
            <h1 className="text-lg font-semibold">Class not found</h1>
            <Link
              to="/courses"
              className="press inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
            >
              Back to courses
            </Link>
          </div>
        ) : (
          <>
            <header className="space-y-3">
              <h1 className="reveal text-3xl font-semibold sm:text-4xl">{lesson.title}</h1>
              <p
                className="reveal text-[16px] text-muted-foreground"
                style={{ animationDelay: "80ms" }}
              >
                {active?.description || lesson.description}
              </p>
              {active?.duration_minutes ? (
                <span className="inline-block rounded-full bg-secondary/80 px-2.5 py-1 text-[11px] text-muted-foreground">
                  {active.duration_minutes} min
                </span>
              ) : null}
            </header>

            {segments.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {segments.map((s, i) => (
                  <button
                    key={s.key}
                    onClick={() => {
                      setPartIndex(i);
                      setTab(null);
                    }}
                    className={`press rounded-full px-4 py-2 text-sm transition-colors ${
                      i === partIndex
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary/60 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {s.title}
                  </button>
                ))}
              </div>
            )}

            {active?.video_url && (
              <div className="reveal-scale overflow-hidden rounded-[24px] bg-surface shadow-soft">
                <div className="aspect-video">
                  <iframe
                    key={active.key}
                    src={active.video_url}
                    title={active.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                    className="size-full"
                  />
                </div>
              </div>
            )}

            <div className="card-soft space-y-4 rounded-[24px] p-2 sm:p-4">
              <div className="flex flex-wrap gap-1.5">
                {tabs
                  .filter((t) => t.available)
                  .map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setTab(key)}
                      aria-pressed={openTab === key}
                      className={`press inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm transition-colors ${
                        openTab === key
                          ? "bg-secondary text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon className="size-4" />
                      {label}
                    </button>
                  ))}
              </div>

              <div key={openTab ?? "empty"} className="reveal px-3 pb-3 text-sm leading-relaxed text-muted-foreground">
                {openTab === "notes" && <p className="whitespace-pre-line">{active?.notes}</p>}
                {openTab === "pdf" && (
                  <a
                    href={active?.pdf_url ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="press inline-flex rounded-full bg-secondary px-4 py-2 text-sm font-medium text-foreground"
                  >
                    Open PDF
                  </a>
                )}
                {openTab === "assignment" && (
                  <p className="whitespace-pre-line">{active?.assignment}</p>
                )}
                {openTab === "quiz" && quiz && (
                  <Link
                    to="/quizzes/$slug"
                    params={{ slug: quiz.slug }}
                    className="press inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
                  >
                    Take “{quiz.title}”
                  </Link>
                )}
                {!openTab && <p>No extra material for this part yet.</p>}
              </div>
            </div>
          </>
        )}
      </div>
    </ArenaShell>
  );
}
