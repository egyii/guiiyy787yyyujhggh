import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArenaShell } from "@/components/arena-shell";
import { LeaderboardList } from "@/components/leaderboard-list";
import { fetchLeaderboard } from "@/lib/quiz-api";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Global Leaderboard — QuizPulse Ranks" },
      {
        name: "description",
        content: "See the top QuizPulse players ranked by XP earned across every trivia arena.",
      },
      { property: "og:title", content: "Global Leaderboard — QuizPulse" },
      { property: "og:description", content: "The top trivia players ranked by XP." },
    ],
  }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const { user } = useSession();
  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard", 25],
    queryFn: () => fetchLeaderboard(25),
  });

  return (
    <ArenaShell>
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <header className="space-y-2">
          <h1 className="font-display text-3xl font-extrabold sm:text-5xl">Global Ranks</h1>
          <p className="text-sm text-muted-foreground">
            Top 25 players by lifetime XP. Refreshes as games are played.
          </p>
        </header>

        {isLoading ? (
          <div className="h-80 animate-pulse rounded-[24px] bg-surface" />
        ) : (
          <LeaderboardList rows={data ?? []} highlightId={user?.id} />
        )}
      </div>
    </ArenaShell>
  );
}
