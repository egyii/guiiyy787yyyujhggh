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
      <div className="mx-auto w-full max-w-3xl space-y-8">
        <header className="space-y-2">
          <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-primary">
            Player dossier
          </span>
          <h1 className="font-display text-3xl font-extrabold sm:text-5xl">
            {profile.data?.username ?? "Player"}
          </h1>
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
              className="rise-in space-y-1 rounded-[20px] bg-surface p-4 ring-1 ring-border"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <span className="text-[10px] font-semibold uppercase tracking-tight text-muted-foreground">
                {label}
              </span>
              <div className="font-display text-2xl font-bold text-accent">{value}</div>
            </div>
          ))}
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-xl font-bold">Run history</h2>
          {rows.length === 0 ? (
            <div className="space-y-3 rounded-[24px] bg-surface p-6 text-center ring-1 ring-border">
              <p className="text-sm text-muted-foreground">No runs yet.</p>
              <Link to="/quizzes" className="text-sm font-bold text-primary">
                Enter an arena
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border rounded-[24px] bg-surface ring-1 ring-border">
              {rows.map((r) => (
                <div key={r.id} className="flex items-center gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">
                      {r.quizzes?.title ?? "Quiz"}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {new Date(r.created_at).toLocaleString()}
                    </div>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">
                    {r.score}/{r.total}
                  </span>
                  <span className="text-xs font-bold text-primary">+{r.xp_earned} XP</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </ArenaShell>
  );
}
