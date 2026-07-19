import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Server-side admin verification. Runs under RLS as the caller and
 * checks the caller's own admin role. Throws 403 if not admin.
 */
export const verifyAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (error) throw new Response("Forbidden", { status: 403 });
    if (!data) throw new Response("Forbidden", { status: 403 });
    return { ok: true as const };
  });
