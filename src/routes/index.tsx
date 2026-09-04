import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, GraduationCap, Layers, LineChart, Sparkles } from "lucide-react";
import { ArenaShell } from "@/components/arena-shell";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "QuizPulse — Learn Fast, Remember Longer" },
      {
        name: "description",
        content:
          "QuizPulse turns structured courses and quick quizzes into one calm learning flow: chapters, classes, videos, assignments and progress.",
      },
      { property: "og:title", content: "QuizPulse — Learn Fast, Remember Longer" },
      {
        property: "og:description",
        content: "Structured courses, focused classes and quick quizzes in one quiet interface.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: Layers,
    title: "Structured by design",
    body: "Subjects break into chapters and sub-chapters, so you always know where you are.",
  },
  {
    icon: GraduationCap,
    title: "Classes with everything",
    body: "Each class carries its video, notes, PDF, assignment and a quiz to close the loop.",
  },
  {
    icon: LineChart,
    title: "Progress that means something",
    body: "Accuracy, XP and streaks tracked quietly in the background — no noise, no clutter.",
  },
];

const STEPS = [
  ["Choose a subject", "Start from a syllabus, not a random feed."],
  ["Work through a class", "Watch, read, then do the assignment."],
  ["Prove it with a quiz", "Short, timed and honest about what stuck."],
];

function Landing() {
  const { user } = useSession();

  return (
    <ArenaShell>
      <div className="mx-auto w-full max-w-6xl space-y-28">
        <section>
          <div className="mx-auto max-w-2xl space-y-6 text-center">
            <span className="reveal inline-flex items-center gap-2 rounded-full bg-secondary/70 px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="size-3.5" />
              Courses, classes and quizzes in one place
            </span>
            <h1
              className="reveal text-4xl leading-[1.05] font-semibold text-balance sm:text-6xl"
              style={{ animationDelay: "60ms" }}
            >
              Learning, refined.
            </h1>
            <p
              className="reveal mx-auto max-w-lg text-[17px] leading-relaxed text-pretty text-muted-foreground"
              style={{ animationDelay: "140ms" }}
            >
              A quiet place to actually finish what you start. Follow a syllabus, sit a class, then
              test yourself — without the usual visual noise.
            </p>
            <div
              className="reveal flex flex-col items-center justify-center gap-3 sm:flex-row"
              style={{ animationDelay: "220ms" }}
            >
              <Link
                to="/courses"
                className="press group inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 sm:w-auto"
              >
                Browse courses
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
              <Link
                to={user ? "/stats" : "/auth"}
                className="press inline-flex w-full items-center justify-center rounded-full bg-secondary px-6 py-3 text-sm font-medium sm:w-auto"
              >
                {user ? "Your progress" : "Create account"}
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }, i) => (
            <div
              key={title}
              className="card-soft sheen reveal space-y-3 rounded-[24px] p-6"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <span className="grid size-10 place-items-center rounded-2xl bg-secondary/70 text-foreground/80">
                <Icon className="size-[18px]" />
              </span>
              <h2 className="text-lg font-medium">{title}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-10 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] sm:items-start">
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold sm:text-3xl">How it works</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Three steps, repeated until it sticks. Nothing else to configure.
            </p>
          </div>
          <ol className="divide-y divide-border/60">
            {STEPS.map(([title, body], i) => (
              <li
                key={title}
                className="reveal flex gap-5 py-5 first:pt-0 last:pb-0"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-[13px] font-medium tabular-nums">
                  {i + 1}
                </span>
                <span className="space-y-1">
                  <span className="block font-medium">{title}</span>
                  <span className="block text-sm text-muted-foreground">{body}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section className="card-soft reveal mx-auto max-w-2xl space-y-5 rounded-[28px] p-10 text-center">
          <h2 className="text-2xl font-semibold sm:text-3xl">Start with one class today</h2>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
            Pick a subject, finish a single class, and let the quiz tell you what to revisit.
          </p>
          <Link
            to="/courses"
            className="press inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Open the course library
            <ArrowRight className="size-4" />
          </Link>
        </section>
      </div>
    </ArenaShell>
  );
}
