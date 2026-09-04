import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronRight, Search, ShieldCheck, UserCog } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { listAdminUsers, type AdminUser } from "@/lib/admin-users.functions";

type RoleLevel = "admin" | "moderator" | "user";

function levelOf(u: AdminUser): RoleLevel {
  if (u.roles.includes("admin")) return "admin";
  if (u.roles.includes("moderator")) return "moderator";
  return "user";
}

function fmt(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

const LEVELS: { key: RoleLevel; label: string; hint: string }[] = [
  { key: "user", label: "Member", hint: "Can take quizzes and courses" },
  { key: "moderator", label: "Semi-admin", hint: "Can edit courses & quizzes only" },
  { key: "admin", label: "Admin", hint: "Full access, including users & stats" },
];

export function AdminUsers({ currentUserId }: { currentUserId: string | undefined }) {
  const fetchUsers = useServerFn(listAdminUsers);
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const users = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => fetchUsers(),
  });

  const setLevel = useMutation({
    mutationFn: async ({ userId, level }: { userId: string; level: RoleLevel }) => {
      const { error: delError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .in("role", ["admin", "moderator"]);
      if (delError) throw new Error(delError.message);
      if (level !== "user") {
        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: level });
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const filtered = useMemo(() => {
    const list = users.data ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((u) =>
      [u.email, u.username, u.id].some((v) => (v ?? "").toLowerCase().includes(q)),
    );
  }, [users.data, query]);

  if (users.isLoading) {
    return <div className="h-64 animate-pulse rounded-[24px] bg-surface" />;
  }

  if (users.error) {
    return (
      <p className="card-soft rounded-[24px] p-6 text-sm text-destructive">
        {(users.error as Error).message}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <label className="card-soft flex items-center gap-2 rounded-full px-4 py-2.5">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by email, username or id"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
        />
      </label>

      <p className="px-1 text-[12px] text-muted-foreground">
        {filtered.length} of {users.data?.length ?? 0} users
      </p>

      <div className="card-soft divide-y divide-border/60 rounded-[24px] px-3 py-1">
        {filtered.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">No users match that search.</p>
        ) : (
          filtered.map((u) => {
            const level = levelOf(u);
            const isOpen = openId === u.id;
            return (
              <div key={u.id}>
                <button
                  onClick={() => setOpenId(isOpen ? null : u.id)}
                  className="flex w-full items-center gap-2.5 py-3 text-left"
                >
                  <ChevronRight
                    className={`size-3.5 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-90" : ""}`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {u.username ?? u.email ?? u.id}
                    </span>
                    <span className="block truncate text-[12px] text-muted-foreground">
                      {u.email ?? "no email"} · {u.xp} XP · {u.attempts} attempts
                    </span>
                  </span>
                  {level !== "user" && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-secondary/70 px-2.5 py-1 text-[11px] font-medium">
                      {level === "admin" ? (
                        <ShieldCheck className="size-3" />
                      ) : (
                        <UserCog className="size-3" />
                      )}
                      {level === "admin" ? "Admin" : "Semi-admin"}
                    </span>
                  )}
                </button>

                {isOpen && (
                  <div className="space-y-4 pb-4 pl-6">
                    <dl className="grid grid-cols-2 gap-3 text-[13px] sm:grid-cols-3">
                      {(
                        [
                          ["Email", u.email ?? "—"],
                          ["Email verified", u.email_confirmed ? "Yes" : "No"],
                          ["Username", u.username ?? "—"],
                          ["Sign-in method", u.provider ?? "—"],
                          ["XP", String(u.xp)],
                          ["Streak", `${u.streak} days`],
                          ["Quiz attempts", String(u.attempts)],
                          ["Best score", u.best_score === null ? "—" : `${u.best_score}%`],
                          ["Average score", u.avg_percent === null ? "—" : `${u.avg_percent}%`],
                          ["Joined", fmt(u.created_at)],
                          ["Last sign-in", fmt(u.last_sign_in_at)],
                          ["Last attempt", fmt(u.last_attempt_at)],
                          ["User ID", u.id],
                        ] as [string, string][]
                      ).map(([label, value]) => (
                        <div key={label} className="min-w-0">
                          <dt className="text-[11px] tracking-wide text-muted-foreground uppercase">
                            {label}
                          </dt>
                          <dd className="truncate" title={value}>
                            {value}
                          </dd>
                        </div>
                      ))}
                    </dl>

                    <div className="space-y-2">
                      <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
                        Access level
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {LEVELS.map((l) => (
                          <button
                            key={l.key}
                            title={l.hint}
                            disabled={
                              setLevel.isPending || l.key === level || u.id === currentUserId
                            }
                            onClick={() => setLevel.mutate({ userId: u.id, level: l.key })}
                            className={`press rounded-full px-3.5 py-2 text-[13px] transition-colors disabled:opacity-60 ${
                              l.key === level
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary/60 hover:bg-secondary"
                            }`}
                          >
                            {l.label}
                          </button>
                        ))}
                      </div>
                      {u.id === currentUserId && (
                        <p className="text-[12px] text-muted-foreground">
                          You can’t change your own access level.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {setLevel.error && (
        <p className="text-sm text-destructive">{(setLevel.error as Error).message}</p>
      )}
    </div>
  );
}
