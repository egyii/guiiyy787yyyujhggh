import avatar1 from "@/assets/avatar-1.jpg";
import avatar2 from "@/assets/avatar-2.jpg";
import avatar3 from "@/assets/avatar-3.jpg";
import type { LeaderRow } from "@/lib/quiz-api";

const AVATARS = [avatar1, avatar2, avatar3];

export function LeaderboardList({
  rows,
  highlightId,
}: {
  rows: LeaderRow[];
  highlightId?: string | null | undefined;
}) {
  if (rows.length === 0) {
    return (
      <div className="card-soft rounded-[22px] p-8 text-center text-sm text-muted-foreground">
        No ranked players yet. Be the first on the board.
      </div>
    );
  }

  const top = rows[0]?.xp || 1;

  return (
    <div className="card-soft overflow-hidden rounded-[22px]">
      {rows.map((row, i) => (
        <div
          key={row.id}
          className={`reveal relative flex items-center gap-4 px-4 py-3.5 transition-colors duration-300 hover:bg-secondary/50 ${
            i > 0 ? "border-t border-border/60" : ""
          } ${row.id === highlightId ? "bg-accent/8" : ""}`}
          style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
        >
          <span className="w-6 text-sm tabular-nums text-muted-foreground">{i + 1}</span>
          <img
            src={AVATARS[i % AVATARS.length]}
            alt={`${row.username} avatar`}
            width={512}
            height={512}
            loading="lazy"
            className="size-9 shrink-0 rounded-full object-cover"
          />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{row.username}</div>
            <div className="mt-1.5 h-[3px] w-full max-w-40 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-700 ease-out"
                style={{ width: `${Math.max(6, (row.xp / top) * 100)}%` }}
              />
            </div>
          </div>
          <span className="text-sm tabular-nums text-muted-foreground">
            {row.xp.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}
