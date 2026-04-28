import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { ArrowDownToLine, ArrowUpFromLine, Wallet, Loader2, Inbox } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BtcLogo, UsdtLogo } from "@/components/CryptoLogos";
import { TransactionModal } from "@/components/TransactionModal";
import { LiveActivityFeed } from "@/components/LiveActivityFeed";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { formatCrypto, formatDate, formatUsd, toUsd } from "@/lib/format";
import { useCryptoPrices } from "@/hooks/useCryptoPrices";
import { TrendingUp, TrendingDown } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — OpulChain" },
      { name: "description", content: "Your OpulChain portfolio: BTC, USDT, deposits, withdrawals." },
    ],
  }),
  component: Dashboard,
});

interface Wallet { btc_balance: number; usdt_balance: number }
interface Tx {
  id: string; type: "deposit" | "withdrawal"; asset: "BTC" | "USDT";
  amount: number; status: "pending" | "completed" | "rejected";
  created_at: string; wallet_address: string | null; admin_note: string | null;
}

const PAGE_SIZE = 8;

function Dashboard() {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [page, setPage] = useState(0);
  const [modal, setModal] = useState<"deposit" | "withdrawal" | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/login" });
    else if (isAdmin) navigate({ to: "/admin" });
  }, [loading, user, isAdmin, navigate]);

  const load = useCallback(async () => {
    if (!user) return;
    setFetching(true);
    const [w, t] = await Promise.all([
      supabase.from("wallets").select("btc_balance,usdt_balance").eq("user_id", user.id).maybeSingle(),
      supabase.from("transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);
    if (w.data) setWallet({ btc_balance: Number(w.data.btc_balance), usdt_balance: Number(w.data.usdt_balance) });
    if (t.data) setTxs(t.data.map((r) => ({ ...r, amount: Number(r.amount) })) as Tx[]);
    setFetching(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // Realtime: refresh wallet + transactions on changes
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`dashboard:${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "wallets", filter: `user_id=eq.${user.id}` }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions", filter: `user_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, load]);

  // Live prices for portfolio cards (with sane fallbacks to reference rates)
  const { prices } = useCryptoPrices();

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const btc = wallet?.btc_balance ?? 0;
  const usdt = wallet?.usdt_balance ?? 0;
  const btcPrice = prices?.BTC.usd;
  const usdtPrice = prices?.USDT.usd ?? 1;
  const btcUsd = btcPrice ? btc * btcPrice : toUsd(btc, "BTC");
  const usdtUsd = usdtPrice ? usdt * usdtPrice : toUsd(usdt, "USDT");
  const total = btcUsd + usdtUsd;

  const totalPages = Math.max(1, Math.ceil(txs.length / PAGE_SIZE));
  const pagedTxs = txs.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="relative min-h-screen">
      <Navbar />
      <div className="relative">
        <div className="mesh-bg opacity-50" />
        <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
          <header className="mb-6 fade-in sm:mb-8">
            <h1 className="font-display text-2xl font-bold sm:text-3xl md:text-4xl">
              Welcome back{user.user_metadata?.full_name ? `, ${user.user_metadata.full_name.split(" ")[0]}` : ""}.
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">Here's your portfolio overview.</p>
          </header>

          {/* Portfolio cards */}
          <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            <div className="rounded-2xl glass p-6 fade-in">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Balance</span>
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <p className="font-display text-3xl font-bold">{formatUsd(total)}</p>
              <p className="mt-1 text-xs text-muted-foreground">Combined USD value</p>
            </div>

            <AssetCard
              icon={<BtcLogo className="h-9 w-9" />}
              name="Bitcoin"
              symbol="BTC"
              amount={btc}
              usd={btcUsd}
              price={btcPrice}
              change={prices?.BTC.change24h}
            />
            <AssetCard
              icon={<UsdtLogo className="h-9 w-9" />}
              name="Tether"
              symbol="USDT"
              amount={usdt}
              usd={usdtUsd}
              price={usdtPrice}
              change={prices?.USDT.change24h}
              stable
            />
          </section>

          {/* Action buttons */}
          <section className="mt-6 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
            <button
              onClick={() => setModal("deposit")}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-success px-6 text-sm font-semibold text-success-foreground shadow-[0_8px_24px_-8px_oklch(0.70_0.18_155_/_0.55)] transition hover:-translate-y-0.5 hover:brightness-110"
            >
              <ArrowDownToLine className="h-4 w-4" /> Deposit
            </button>
            <button
              onClick={() => setModal("withdrawal")}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-destructive px-6 text-sm font-semibold text-destructive-foreground shadow-[0_8px_24px_-8px_oklch(0.62_0.22_22_/_0.55)] transition hover:-translate-y-0.5 hover:brightness-110"
            >
              <ArrowUpFromLine className="h-4 w-4" /> Withdraw
            </button>
          </section>

          {/* Transaction history */}
          <section className="mt-10">
            <h2 className="mb-4 font-display text-2xl font-bold">Transaction History</h2>
            <div className="overflow-hidden rounded-2xl glass">
              {fetching ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : txs.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Inbox className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold">No transactions yet</p>
                    <p className="text-sm text-muted-foreground">Make your first deposit to get started.</p>
                  </div>
                  <button onClick={() => setModal("deposit")} className="rounded-lg btn-primary px-4 py-2 text-sm font-medium">
                    Deposit Now
                  </button>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-white/5 text-xs uppercase tracking-wider text-muted-foreground">
                        <tr>
                          <th className="px-5 py-3 text-left font-medium">Date</th>
                          <th className="px-5 py-3 text-left font-medium">Type</th>
                          <th className="px-5 py-3 text-left font-medium">Asset</th>
                          <th className="px-5 py-3 text-right font-medium">Amount</th>
                          <th className="px-5 py-3 text-right font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {pagedTxs.map((t) => (
                          <tr key={t.id} className="hover:bg-white/[0.03]">
                            <td className="px-5 py-3 text-muted-foreground">{formatDate(t.created_at)}</td>
                            <td className="px-5 py-3 capitalize">
                              <span className={`inline-flex items-center gap-1 ${t.type === "deposit" ? "text-success" : "text-warning"}`}>
                                {t.type === "deposit" ? <ArrowDownToLine className="h-3.5 w-3.5" /> : <ArrowUpFromLine className="h-3.5 w-3.5" />}
                                {t.type}
                              </span>
                            </td>
                            <td className="px-5 py-3">
                              <span className="inline-flex items-center gap-1.5">
                                {t.asset === "BTC" ? <BtcLogo className="h-4 w-4" /> : <UsdtLogo className="h-4 w-4" />}
                                {t.asset}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-right font-mono">{formatCrypto(t.amount, t.asset)}</td>
                            <td className="px-5 py-3 text-right"><StatusBadge status={t.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-white/5 px-5 py-3 text-xs text-muted-foreground">
                      <span>Page {page + 1} of {totalPages}</span>
                      <div className="flex gap-2">
                        <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="rounded-md border border-white/10 px-3 py-1.5 disabled:opacity-40 hover:bg-white/5">Prev</button>
                        <button disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)} className="rounded-md border border-white/10 px-3 py-1.5 disabled:opacity-40 hover:bg-white/5">Next</button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>

          {/* Live Activity */}
          <section className="mt-10">
            <LiveActivityFeed variant="sidebar" title="Live Activity" />
          </section>
        </main>
      </div>
      <Footer />
      <TransactionModal mode={modal ?? "deposit"} open={modal !== null} onOpenChange={(o) => !o && setModal(null)} />
    </div>
  );
}

function AssetCard({
  icon, name, symbol, amount, usd, price, change, stable,
}: {
  icon: React.ReactNode; name: string; symbol: string; amount: number; usd: number;
  price?: number; change?: number; stable?: boolean;
}) {
  const positive = (change ?? 0) >= 0;
  return (
    <div className="rounded-2xl glass p-6 fade-in">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <p className="text-sm font-semibold">{name}</p>
            <p className="text-xs text-muted-foreground">{symbol}</p>
          </div>
        </div>
        {price !== undefined && (
          <div className="text-right">
            <p className="font-mono text-xs font-semibold">
              ${price.toLocaleString("en-US", { maximumFractionDigits: symbol === "BTC" ? 0 : 2, minimumFractionDigits: symbol === "BTC" ? 0 : 2 })}
            </p>
            {stable ? (
              <p className="text-[10px] text-success">● Stable</p>
            ) : change !== undefined ? (
              <p className={`inline-flex items-center gap-0.5 text-[10px] font-medium ${positive ? "text-success" : "text-destructive"}`}>
                {positive ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                {positive ? "+" : ""}{change.toFixed(2)}%
              </p>
            ) : null}
          </div>
        )}
      </div>
      <p className="font-display text-2xl font-bold font-mono">{formatCrypto(amount, symbol as "BTC" | "USDT")}</p>
      <p className="mt-1 text-sm text-muted-foreground">≈ {formatUsd(usd)}</p>
    </div>
  );
}

export function StatusBadge({ status }: { status: "pending" | "completed" | "rejected" }) {
  const styles =
    status === "completed" ? "bg-success/15 text-success ring-success/30"
      : status === "pending" ? "bg-warning/15 text-warning ring-warning/30"
      : "bg-destructive/15 text-destructive ring-destructive/30";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ${styles}`}>
      {status}
    </span>
  );
}
