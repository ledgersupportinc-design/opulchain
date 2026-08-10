import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ASSETS = ["BTC", "USDT"] as const;
type Asset = (typeof ASSETS)[number];

/**
 * Returns the platform deposit address for a single asset.
 * Requires a valid signed-in session. The admin_wallets table itself stays
 * admin-only under RLS, so users cannot enumerate every configured address.
 */
export const getDepositAddress = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => {
    const asset = (data as { asset?: string } | undefined)?.asset;
    if (!asset || !ASSETS.includes(asset as Asset)) {
      throw new Response("Invalid asset", { status: 400 });
    }
    return { asset: asset as Asset };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("admin_wallets")
      .select("address")
      .eq("asset", data.asset)
      .maybeSingle();
    if (error) throw new Response("Unable to load deposit address", { status: 500 });
    return { address: row?.address ?? "" };
  });
