import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";

export function useRoles() {
  const { user, loading } = useSession();
  const query = useQuery({
    queryKey: ["my-roles", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []).map((r) => String(r.role));
    },
  });

  const roles = query.data ?? [];
  return {
    roles,
    isAdmin: roles.includes("admin"),
    isModerator: roles.includes("moderator"),
    canEditContent: roles.includes("admin") || roles.includes("moderator"),
    loading: loading || (Boolean(user?.id) && query.isLoading),
    user,
  };
}

/** Back-compat: admin-only check. */
export function useIsAdmin() {
  const { isAdmin, loading, user } = useRoles();
  return { isAdmin, loading, user };
}
