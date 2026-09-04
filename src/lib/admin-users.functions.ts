import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AdminUser = {
  id: string;
  email: string | null;
  username: string | null;
  xp: number;
  streak: number;
  created_at: string | null;
  last_sign_in_at: string | null;
  email_confirmed: boolean;
  provider: string | null;
  roles: string[];
  attempts: number;
  best_score: number | null;
  avg_percent: number | null;
  last_attempt_at: string | null;
};

export const listAdminUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminUser[]> => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleError) throw new Error(roleError.message);
    if (!isAdmin) throw new Error("Admins only");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: authList, error: authError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (authError) throw new Error(authError.message);

    const [profiles, roles, attempts] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, username, xp, streak, created_at"),
      supabaseAdmin.from("user_roles").select("user_id, role"),
      supabaseAdmin.from("attempts").select("user_id, score, total, created_at"),
    ]);
    if (profiles.error) throw new Error(profiles.error.message);
    if (roles.error) throw new Error(roles.error.message);
    if (attempts.error) throw new Error(attempts.error.message);

    const profileById = new Map((profiles.data ?? []).map((p) => [p.id, p]));

    return authList.users.map((u) => {
      const profile = profileById.get(u.id);
      const mine = (attempts.data ?? []).filter((a) => a.user_id === u.id);
      const percents = mine.map((a) => (a.total > 0 ? (a.score / a.total) * 100 : 0));
      const times = mine
        .map((a) => a.created_at)
        .filter((t): t is string => Boolean(t))
        .sort();

      return {
        id: u.id,
        email: u.email ?? null,
        username: profile?.username ?? null,
        xp: profile?.xp ?? 0,
        streak: profile?.streak ?? 0,
        created_at: u.created_at ?? null,
        last_sign_in_at: u.last_sign_in_at ?? null,
        email_confirmed: Boolean(u.email_confirmed_at),
        provider: (u.app_metadata?.["provider"] as string | undefined) ?? null,
        roles: (roles.data ?? []).filter((r) => r.user_id === u.id).map((r) => String(r.role)),
        attempts: mine.length,
        best_score: percents.length ? Math.round(Math.max(...percents)) : null,
        avg_percent: percents.length
          ? Math.round(percents.reduce((a, b) => a + b, 0) / percents.length)
          : null,
        last_attempt_at: times.length ? times[times.length - 1]! : null,
      };
    });
  });
