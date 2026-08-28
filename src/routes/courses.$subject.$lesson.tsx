import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
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
  const { subject, lesson: slug } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["lesson", slug],
    queryFn: () => fetchLessonBySlug(slug),
  });

  const chapter = (data as never as { chapters?: { title?: string } } | null)?.chapters;
  const quiz = (data as never as { quizzes?: { slug: string; title: string } } | null)?.quizzes;

  return (
    <ArenaShell>
      <div className="mx-auto w-full max-w-3xl space-y-8">
        <Breadcrumbs
          items={[
            { label: "Courses", to: "/courses" },
            { label: chapter?.title ?? "Chapter", to: "/courses/$subject", params: { subject } },
            { label: data?.title ?? "Class" },
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
              <h1 className="reveal text-3xl font-semibold sm:text-4xl">{data.title}</h1>
              <p className="reveal text-[16px] text-muted-foreground" style={{ animationDelay: "80ms" }}>
                {data.description}
              </p>
              {data.duration_minutes && (
                <span className="rounded-full bg-secondary/80 px-2.5 py-1 text-[11px] text-muted-foreground">
                  {data.duration_minutes} min class
                </span>
              )}
            </header>

            {data.video_url && (
              <div className="reveal-scale overflow-hidden rounded-[24px] bg-surface shadow-soft">
                <div className="aspect-video">
                  <iframe
                    src={data.video_url}
                    title={data.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                    className="size-full"
                  />
                </div>
              </div>
            )}

            {data.notes && (
              <Panel icon={NotebookPen} title="Class notes">
                <p className="whitespace-pre-line">{data.notes}</p>
              </Panel>
            )}

            {data.pdf_url && (
              <Panel icon={FileText} title="Reading material">
                <a
                  href={data.pdf_url}
                  target="_blank"
                  rel="noreferrer"
                  className="press inline-flex rounded-full bg-secondary px-4 py-2 text-sm font-medium text-foreground"
                >
                  Open PDF
                </a>
              </Panel>
            )}

            {data.assignment && (
              <Panel icon={ClipboardList} title="Assignment">
                <p className="whitespace-pre-line">{data.assignment}</p>
              </Panel>
            )}

            {quiz?.slug && (
              <Panel icon={Play} title="Associated quiz">
                <Link
                  to="/quizzes/$slug"
                  params={{ slug: quiz.slug }}
                  className="press inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  Take “{quiz.title}”
                </Link>
              </Panel>
            )}
          </>
        )}
      </div>
    </ArenaShell>
  );
}
