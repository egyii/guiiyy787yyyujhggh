import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArenaShell, Breadcrumbs } from "@/components/arena-shell";
import { fetchMyAttempts, fetchMyProfile } from "@/lib/quiz-api";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/_authenticated/stats")({
  head: () => ({
    meta: [
      { title: "Your Stats — QuizPulse" },
      {
        name: "description",
        content: "Track your QuizPulse accuracy, XP, streak and full quiz attempt history.",
      },
      { property: "og:title", content: "Your Stats — QuizPulse" },
      { property: "og:description", content: "Accuracy, XP, streaks and attempt history." },
    ],
  }),
  component: StatsPage,
});

function StatsPage() {
  const { user } = useSession();
  const profile = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => fetchMyProfile(user!.id),
    enabled: Boolean(user?.id),
  });
  const attempts = useQuery({
    queryKey: ["attempts", user?.id],
    queryFn: () => fetchMyAttempts(user!.id),
    enabled: Boolean(user?.id),
  });

  const rows = attempts.data ?? [];
  const totalQ = rows.reduce((a, r) => a + r.total, 0);
  const totalC = rows.reduce((a, r) => a + r.score, 0);
  const accuracy = totalQ ? ((totalC / totalQ) * 100).toFixed(1) : "0.0";

  return (
    <ArenaShell>
      <div className="mx-auto w-full max-w-3xl space-y-10">
        <Breadcrumbs items={[{ label: "Stats" }]} />

        <header className="space-y-3">
          <h1 className="reveal text-3xl font-semibold sm:text-5xl">
            {profile.data?.username ?? "Your progress"}
          </h1>
          <p
            className="reveal text-[17px] text-muted-foreground"
            style={{ animationDelay: "80ms" }}
          >
            Accuracy, XP and every run you have played.
          </p>
        </header>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Accuracy", `${accuracy}%`],
            ["Total XP", (profile.data?.xp ?? 0).toLocaleString()],
            ["Runs played", String(rows.length)],
            ["Correct answers", String(totalC)],
          ].map(([label, value], i) => (
            <div
              key={label}
              className="card-soft reveal space-y-1 rounded-[22px] p-4"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span className="text-[12px] text-muted-foreground">{label}</span>
              <div className="text-2xl font-semibold tracking-tight">{value}</div>
            </div>
          ))}
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Run history</h2>
          {rows.length === 0 ? (
            <div className="card-soft space-y-3 rounded-[24px] p-8 text-center">
              <p className="text-sm text-muted-foreground">No runs yet.</p>
              <Link
                to="/quizzes"
                className="press inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
              >
                Browse quizzes
              </Link>
            </div>
          ) : (
            <div className="card-soft divide-y divide-border/60 overflow-hidden rounded-[24px]">
              {rows.map((r) => (
                <div key={r.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {r.quizzes?.title ?? "Quiz"}
                    </div>
                    <div className="text-[12px] text-muted-foreground">
                      {new Date(r.created_at).toLocaleString()}
                    </div>
                  </div>
                  <span className="text-[13px] text-muted-foreground">
                    {r.score}/{r.total}
                  </span>
                  <span className="text-[13px] font-medium">+{r.xp_earned} XP</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </ArenaShell>
  );
}
