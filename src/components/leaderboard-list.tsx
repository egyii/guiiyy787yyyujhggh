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
      <div className="rounded-[24px] bg-surface p-6 text-center text-sm text-muted-foreground ring-1 ring-border">
        No ranked players yet. Be the first on the board.
      </div>
    );
  }

  return (
    <div className="divide-y divide-border rounded-[24px] bg-surface ring-1 ring-border">
      {rows.map((row, i) => (
        <div
          key={row.id}
          className={`rise-in flex items-center gap-4 p-4 ${
            row.id === highlightId ? "bg-primary/10" : i % 2 === 1 ? "bg-foreground/[0.02]" : ""
          }`}
          style={{ animationDelay: `${i * 45}ms` }}
        >
          <span className="w-5 font-mono text-xs font-bold text-muted-foreground">
            {String(i + 1).padStart(2, "0")}
          </span>
          <img
            src={AVATARS[i % AVATARS.length]}
            alt={`${row.username} avatar`}
            width={512}
            height={512}
            loading="lazy"
            className="size-10 shrink-0 rounded-full object-cover ring-1 ring-border"
          />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{row.username}</div>
            <div className="text-[10px] text-muted-foreground">
              {row.xp.toLocaleString()} XP
            </div>
          </div>
          {i === 0 && (
            <div className="grid size-6 place-items-center rounded-full border border-primary/25 bg-primary/10 text-[10px] font-bold text-primary">
              W
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
