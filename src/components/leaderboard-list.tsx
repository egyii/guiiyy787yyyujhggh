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
      <div className="card-surface rounded-xl p-10 text-center">
        <p className="text-sm font-medium">No ranked players yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Finish a quiz to claim the first spot on the board.
        </p>
      </div>
    );
  }

  return (
    <div className="card-surface divide-y divide-border overflow-hidden rounded-xl">
      {rows.map((row, i) => (
        <div
          key={row.id}
          className={`rise-in flex items-center gap-4 px-5 py-4 ${
            row.id === highlightId ? "bg-secondary" : ""
          }`}
          style={{ animationDelay: `${i * 40}ms` }}
        >
          <span className="w-6 font-mono text-xs text-muted-foreground">
            {String(i + 1).padStart(2, "0")}
          </span>
          <img
            src={AVATARS[i % AVATARS.length]}
            alt={`${row.username} avatar`}
            width={512}
            height={512}
            loading="lazy"
            className="size-9 shrink-0 rounded-full border border-border object-cover"
          />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{row.username}</div>
            <div className="text-xs text-muted-foreground">{row.xp.toLocaleString()} XP</div>
          </div>
          {i === 0 && (
            <span className="rounded-full border border-accent/30 bg-accent/8 px-2.5 py-1 text-[10px] font-medium tracking-[0.12em] text-accent uppercase">
              Leader
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
