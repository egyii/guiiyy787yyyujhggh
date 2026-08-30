import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, ExternalLink, FileText, ListChecks, NotebookPen, Play } from "lucide-react";
import { useMemo, useState } from "react";
import { ArenaShell, Breadcrumbs } from "@/components/arena-shell";
import { fetchLessonBySlug } from "@/lib/course-api";

export const Route = createFileRoute("/courses/$course/$subject/$lesson")({
  head: () => ({
    meta: [
      { title: "Class — QuizPulse Courses" },
      {
        name: "description",
        content:
          "Watch the class video, open the class notes link, download the PDF, take the linked quiz and submit the assignment.",
      },
      { property: "og:title", content: "Class — QuizPulse Courses" },
      {
        property: "og:description",
        content: "Video, class notes, PDF, quiz and assignment for this class.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LessonPage,
});

const URL_RE = /(https?:\/\/[^\s]+)/g;

/** Renders text with any URLs turned into real, clickable links. */
function RichText({ text }: { text: string }) {
  const chunks = text.split(URL_RE);
  return (
    <div className="space-y-2">
      {chunks.map((chunk, i) =>
        URL_RE.test(chunk) ? (
          <a
            key={i}
            href={chunk}
            target="_blank"
            rel="noreferrer"
            className="press inline-flex max-w-full items-center gap-1.5 rounded-full bg-secondary px-4 py-2 text-sm font-medium text-foreground hover:opacity-90"
          >
            <ExternalLink className="size-3.5 shrink-0" />
            <span className="truncate">{chunk.replace(/^https?:\/\//, "")}</span>
          </a>
        ) : chunk.trim() ? (
          <p key={i} className="whitespace-pre-line">
            {chunk.trim()}
          </p>
        ) : null,
      )}
    </div>
  );
}

function Panel({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Play;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card-soft reveal space-y-3 rounded-[24px] p-6">
      <h2 className="flex items-center gap-2 text-sm font-medium">
        <Icon className="size-4 text-muted-foreground" />
        {title}
      </h2>
      <div className="text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

function LessonPage() {
  const { course, subject, lesson: slug } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["lesson", slug],
    queryFn: () => fetchLessonBySlug(slug),
  });
  const [partIndex, setPartIndex] = useState(0);

  const views = useMemo(() => {
    if (!data) return [];
    if (data.parts.length > 0) {
      return data.parts.map((p) => ({
        key: p.id,
        title: p.title,
        video_url: p.video_url,
        notes: p.notes,
        pdf_url: p.pdf_url,
        assignment: p.assignment,
        duration_minutes: p.duration_minutes,
      }));
    }
    const l = data.lesson;
    return [
      {
        key: l.id,
        title: "Full class",
        video_url: l.video_url,
        notes: l.notes,
        pdf_url: l.pdf_url,
        assignment: l.assignment,
        duration_minutes: l.duration_minutes,
      },
    ];
  }, [data]);

  const active = views[Math.min(partIndex, Math.max(views.length - 1, 0))];

  return (
    <ArenaShell>
      <div className="mx-auto w-full max-w-3xl space-y-8">
        <Breadcrumbs
          items={[
            { label: "Courses", to: "/courses" },
            { label: data?.subject?.title ?? "Subject", to: "/courses/$course", params: { course } },
            {
              label: data?.chapter?.title ?? "Chapter",
              to: "/courses/$course/$subject",
              params: { course, subject },
            },
            { label: data?.lesson.title ?? "Class" },
          ]}
        />

        {isLoading ? (
          <div className="h-64 animate-pulse rounded-[24px] bg-surface" />
        ) : !data ? (
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
              <h1 className="reveal text-3xl font-semibold sm:text-4xl">{data.lesson.title}</h1>
              <p className="reveal text-[16px] text-muted-foreground" style={{ animationDelay: "80ms" }}>
                {data.lesson.description}
              </p>
              {active?.duration_minutes ? (
                <span className="rounded-full bg-secondary/80 px-2.5 py-1 text-[11px] text-muted-foreground">
                  {active.duration_minutes} min class
                </span>
              ) : null}
            </header>

            {views.length > 1 && (
              <div className="reveal flex flex-wrap gap-2">
                {views.map((v, i) => (
                  <button
                    key={v.key}
                    onClick={() => setPartIndex(i)}
                    aria-pressed={i === partIndex}
                    className={`press rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      i === partIndex
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {v.title}
                  </button>
                ))}
              </div>
            )}

            {active?.video_url && (
              <div key={active.key} className="reveal-scale overflow-hidden rounded-[24px] bg-surface shadow-soft">
                <div className="aspect-video">
                  <iframe
                    src={active.video_url}
                    title={`${data.lesson.title} — ${active.title}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                    className="size-full"
                  />
                </div>
              </div>
            )}

            {active?.notes && (
              <Panel icon={NotebookPen} title="Class notes">
                <RichText text={active.notes} />
              </Panel>
            )}

            {active?.pdf_url && (
              <Panel icon={FileText} title="Reading material">
                <a
                  href={active.pdf_url}
                  target="_blank"
                  rel="noreferrer"
                  className="press inline-flex items-center gap-1.5 rounded-full bg-secondary px-4 py-2 text-sm font-medium text-foreground"
                >
                  <ExternalLink className="size-3.5" />
                  Open PDF
                </a>
              </Panel>
            )}

            {active?.assignment && (
              <Panel icon={ClipboardList} title="Assignment">
                <RichText text={active.assignment} />
              </Panel>
            )}

            {data.quiz?.slug && (
              <Panel icon={ListChecks} title="Associated quiz">
                <Link
                  to="/quizzes/$slug"
                  params={{ slug: data.quiz.slug }}
                  className="press inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  Take “{data.quiz.title}”
                </Link>
              </Panel>
            )}
          </>
        )}
      </div>
    </ArenaShell>
  );
}
