import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PermissionsModal } from "@/components/PermissionsModal";
import { useEffect, useState, useCallback, useRef } from "react";
import { Loader2, Users, ArrowDownToLine, ArrowUpFromLine, MessageSquare, Pencil, Check, X, Send, ShieldAlert, ShieldCheck, Wallet as WalletIcon, Save, Megaphone, LayoutDashboard, TrendingUp, Activity, Clock } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { BtcLogo, UsdtLogo } from "@/components/CryptoLogos";
import { StatusBadge } from "./dashboard";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { formatCrypto, formatDate, formatUsd, toUsd } from "@/lib/format";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { sendEmail } from "@/lib/sendEmail";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Panel — OpulChain" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type Tab = "overview" | "users" | "deposits" | "withdrawals" | "chats" | "wallets" | "announcements";

interface UserRow {
  id: string; email: string; full_name: string | null; created_at: string;
  btc_balance: number; usdt_balance: number;
}
interface TxRow {
  id: string; user_id: string; type: "deposit" | "withdrawal"; asset: "BTC" | "USDT";
  amount: number; status: "pending" | "completed" | "rejected";
  wallet_address: string | null; admin_note: string | null; created_at: string;
  email?: string; full_name?: string | null;
}
interface ChatRow {
  id: string; user_id: string; sender: "user" | "admin"; message: string; read: boolean; created_at: string;
}
interface ChatThread {
  user_id: string; email: string; full_name: string | null; lastMessage: string; lastAt: string; unread: number;
}

function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");
  const [permsOpen, setPermsOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/login" });
    else if (!isAdmin) navigate({ to: "/dashboard" });
  }, [user, isAdmin, loading, navigate]);

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="rounded-2xl glass-strong p-8 text-center">
          <ShieldAlert className="mx-auto mb-3 h-10 w-10 text-destructive" />
          <p className="font-semibold">Admin access required.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <Navbar />
      <div className="mesh-bg opacity-40" />
      <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-gold/15 px-3 py-1 text-xs font-medium text-gold ring-1 ring-gold/30">
              <ShieldAlert className="h-3 w-3" /> Admin Panel
            </div>
            <h1 className="mt-3 font-display text-2xl font-bold sm:text-3xl md:text-4xl">Operations Console</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage users, approve transactions, reply to chats.</p>
          </div>
          <button
            type="button"
            onClick={() => setPermsOpen(true)}
            className="inline-flex items-center gap-2 self-start rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-foreground hover:bg-white/10"
          >
            <ShieldCheck className="h-4 w-4 text-gold" /> Verify permissions
          </button>
        </header>
        <PermissionsModal open={permsOpen} onClose={() => setPermsOpen(false)} />

        <div className="mb-6 -mx-4 overflow-x-auto px-4 sm:mx-0 sm:overflow-visible sm:px-0">
          <div className="flex min-w-max gap-2 rounded-xl glass p-1.5 sm:min-w-0 sm:flex-wrap">
            <TabBtn active={tab === "overview"} onClick={() => setTab("overview")} icon={<LayoutDashboard className="h-4 w-4" />}>Overview</TabBtn>
            <TabBtn active={tab === "users"} onClick={() => setTab("users")} icon={<Users className="h-4 w-4" />}>Users</TabBtn>
            <TabBtn active={tab === "deposits"} onClick={() => setTab("deposits")} icon={<ArrowDownToLine className="h-4 w-4" />}>Deposits</TabBtn>
            <TabBtn active={tab === "withdrawals"} onClick={() => setTab("withdrawals")} icon={<ArrowUpFromLine className="h-4 w-4" />}>Withdrawals</TabBtn>
            <TabBtn active={tab === "chats"} onClick={() => setTab("chats")} icon={<MessageSquare className="h-4 w-4" />}>Live Support</TabBtn>
            <TabBtn active={tab === "wallets"} onClick={() => setTab("wallets")} icon={<WalletIcon className="h-4 w-4" />}>Wallet Settings</TabBtn>
            <TabBtn active={tab === "announcements"} onClick={() => setTab("announcements")} icon={<Megaphone className="h-4 w-4" />}>Announcements</TabBtn>
          </div>
        </div>

        {tab === "overview" && <OverviewTab onJump={setTab} />}
        {tab === "users" && <UsersTab />}
        {tab === "deposits" && <TxTab type="deposit" />}
        {tab === "withdrawals" && <TxTab type="withdrawal" />}
        {tab === "chats" && <ChatsTab />}
        {tab === "wallets" && <WalletsTab />}
        {tab === "announcements" && <AnnouncementsTab />}
      </main>
    </div>
  );
}

function TabBtn({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${active ? "btn-primary" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"}`}
    >
      {icon}{children}
    </button>
  );
}

// ============ OVERVIEW TAB ============
interface OverviewStats {
  totalUsers: number;
  newUsers7d: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  completedDepositsUsd: number;
  completedWithdrawalsUsd: number;
  totalBtc: number;
  totalUsdt: number;
  unreadMessages: number;
  recentTxs: TxRow[];
  recentUsers: { id: string; email: string; full_name: string | null; created_at: string }[];
}

function OverviewTab({ onJump }: { onJump: (t: Tab) => void }) {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const [profilesRes, walletsRes, txsRes, chatsRes] = await Promise.all([
      supabase.from("profiles").select("id,email,full_name,created_at").order("created_at", { ascending: false }),
      supabase.from("wallets").select("btc_balance,usdt_balance"),
      supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("chat_messages").select("id,sender,read").eq("sender", "user").eq("read", false),
    ]);

    const profiles = profilesRes.data ?? [];
    const wallets = walletsRes.data ?? [];
    const txs = (txsRes.data ?? []).map((t) => ({ ...t, amount: Number(t.amount) })) as TxRow[];
    const profileMap = new Map(profiles.map((p) => [p.id, p]));

    const totalUsers = profiles.length;
    const newUsers7d = profiles.filter((p) => p.created_at >= sevenDaysAgo).length;
    const pendingDeposits = txs.filter((t) => t.type === "deposit" && t.status === "pending").length;
    const pendingWithdrawals = txs.filter((t) => t.type === "withdrawal" && t.status === "pending").length;
    const completedDepositsUsd = txs
      .filter((t) => t.type === "deposit" && t.status === "completed")
      .reduce((sum, t) => sum + toUsd(t.amount, t.asset), 0);
    const completedWithdrawalsUsd = txs
      .filter((t) => t.type === "withdrawal" && t.status === "completed")
      .reduce((sum, t) => sum + toUsd(t.amount, t.asset), 0);
    const totalBtc = wallets.reduce((s, w) => s + Number(w.btc_balance ?? 0), 0);
    const totalUsdt = wallets.reduce((s, w) => s + Number(w.usdt_balance ?? 0), 0);
    const unreadMessages = chatsRes.data?.length ?? 0;
    const recentTxs = txs.slice(0, 6).map((t) => {
      const p = profileMap.get(t.user_id);
      return { ...t, email: p?.email, full_name: p?.full_name ?? null };
    });
    const recentUsers = profiles.slice(0, 5);

    setStats({
      totalUsers, newUsers7d, pendingDeposits, pendingWithdrawals,
      completedDepositsUsd, completedWithdrawalsUsd, totalBtc, totalUsdt,
      unreadMessages, recentTxs, recentUsers,
    });
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Realtime updates
  useEffect(() => {
    const ch = supabase
      .channel("admin-overview")
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_messages" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  if (loading || !stats) return <Spinner />;

  const totalCustodyUsd = toUsd(stats.totalBtc, "BTC") + toUsd(stats.totalUsdt, "USDT");
  const netFlowUsd = stats.completedDepositsUsd - stats.completedWithdrawalsUsd;

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total Users"
          value={stats.totalUsers.toLocaleString()}
          sub={`+${stats.newUsers7d} new this week`}
          icon={<Users className="h-5 w-5" />}
          tone="primary"
          onClick={() => onJump("users")}
        />
        <KpiCard
          label="Pending Deposits"
          value={stats.pendingDeposits.toLocaleString()}
          sub="Awaiting approval"
          icon={<ArrowDownToLine className="h-5 w-5" />}
          tone={stats.pendingDeposits > 0 ? "warning" : "muted"}
          onClick={() => onJump("deposits")}
        />
        <KpiCard
          label="Pending Withdrawals"
          value={stats.pendingWithdrawals.toLocaleString()}
          sub="Awaiting processing"
          icon={<ArrowUpFromLine className="h-5 w-5" />}
          tone={stats.pendingWithdrawals > 0 ? "warning" : "muted"}
          onClick={() => onJump("withdrawals")}
        />
        <KpiCard
          label="Unread Messages"
          value={stats.unreadMessages.toLocaleString()}
          sub="From customers"
          icon={<MessageSquare className="h-5 w-5" />}
          tone={stats.unreadMessages > 0 ? "destructive" : "muted"}
          onClick={() => onJump("chats")}
        />
      </section>

      {/* Volume + custody */}
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl glass p-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Custody (USD)</span>
            <WalletIcon className="h-5 w-5 text-primary" />
          </div>
          <p className="font-display text-3xl font-bold">{formatUsd(totalCustodyUsd)}</p>
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg bg-white/5 p-2">
              <div className="flex items-center gap-1.5 text-muted-foreground"><BtcLogo className="h-3.5 w-3.5" /> BTC</div>
              <p className="mt-0.5 font-mono font-semibold">{formatCrypto(stats.totalBtc, "BTC")}</p>
            </div>
            <div className="rounded-lg bg-white/5 p-2">
              <div className="flex items-center gap-1.5 text-muted-foreground"><UsdtLogo className="h-3.5 w-3.5" /> USDT</div>
              <p className="mt-0.5 font-mono font-semibold">{formatCrypto(stats.totalUsdt, "USDT")}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl glass p-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Completed Volume</span>
            <TrendingUp className="h-5 w-5 text-success" />
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-muted-foreground">Deposits in</p>
              <p className="font-display text-xl font-bold text-success">{formatUsd(stats.completedDepositsUsd)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Withdrawals out</p>
              <p className="font-display text-xl font-bold text-warning">{formatUsd(stats.completedWithdrawalsUsd)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl glass p-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Net Flow</span>
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <p className={`font-display text-3xl font-bold ${netFlowUsd >= 0 ? "text-success" : "text-destructive"}`}>
            {netFlowUsd >= 0 ? "+" : ""}{formatUsd(netFlowUsd)}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">Deposits minus withdrawals (all-time, completed)</p>
        </div>
      </section>

      {/* Recent activity + new users */}
      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="overflow-hidden rounded-2xl glass">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold"><Clock className="h-4 w-4 text-primary" /> Recent Transactions</h3>
            <button onClick={() => onJump("deposits")} className="text-xs text-primary hover:underline">View all</button>
          </div>
          {stats.recentTxs.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">No transactions yet.</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {stats.recentTxs.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${t.type === "deposit" ? "text-success" : "text-warning"}`}>
                        {t.type === "deposit" ? <ArrowDownToLine className="h-3 w-3" /> : <ArrowUpFromLine className="h-3 w-3" />}
                        {t.type}
                      </span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="truncate text-xs text-muted-foreground">{t.full_name || t.email || "—"}</span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{formatDate(t.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-xs font-semibold">{formatCrypto(t.amount, t.asset)} {t.asset}</p>
                    <StatusBadge status={t.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl glass">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold"><Users className="h-4 w-4 text-primary" /> New Users</h3>
            <button onClick={() => onJump("users")} className="text-xs text-primary hover:underline">View all</button>
          </div>
          {stats.recentUsers.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">No users yet.</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {stats.recentUsers.map((u) => (
                <li key={u.id} className="px-5 py-3 text-sm">
                  <p className="truncate font-medium">{u.full_name || "—"}</p>
                  <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">Joined {formatDate(u.created_at)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function KpiCard({
  label, value, sub, icon, tone, onClick,
}: {
  label: string; value: string; sub: string; icon: React.ReactNode;
  tone: "primary" | "warning" | "destructive" | "muted"; onClick?: () => void;
}) {
  const toneClass =
    tone === "primary" ? "text-primary bg-primary/15 ring-primary/30"
    : tone === "warning" ? "text-warning bg-warning/15 ring-warning/30"
    : tone === "destructive" ? "text-destructive bg-destructive/15 ring-destructive/30"
    : "text-muted-foreground bg-white/5 ring-white/10";
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl glass p-5 text-left transition hover:-translate-y-0.5 hover:bg-white/[0.04]"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ring-1 ${toneClass}`}>{icon}</span>
      </div>
      <p className="font-display text-3xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
    </button>
  );
}

// ============ USERS TAB ============
function UsersTab() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<UserRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: profiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    const { data: wallets } = await supabase.from("wallets").select("*");
    if (profiles && wallets) {
      const merged: UserRow[] = profiles.map((p) => {
        const w = wallets.find((x) => x.user_id === p.id);
        return {
          id: p.id, email: p.email, full_name: p.full_name, created_at: p.created_at,
          btc_balance: Number(w?.btc_balance ?? 0), usdt_balance: Number(w?.usdt_balance ?? 0),
        };
      });
      setRows(merged);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Spinner />;

  return (
    <>
      <div className="overflow-hidden rounded-2xl glass">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3 text-left font-medium">User</th>
                <th className="px-5 py-3 text-left font-medium">Email</th>
                <th className="px-5 py-3 text-right font-medium">BTC</th>
                <th className="px-5 py-3 text-right font-medium">USDT</th>
                <th className="px-5 py-3 text-right font-medium">USD</th>
                <th className="px-5 py-3 text-left font-medium">Joined</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((u) => (
                <tr key={u.id} className="hover:bg-white/[0.03]">
                  <td className="px-5 py-3 font-medium">{u.full_name || "—"}</td>
                  <td className="px-5 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-5 py-3 text-right font-mono">{formatCrypto(u.btc_balance, "BTC")}</td>
                  <td className="px-5 py-3 text-right font-mono">{formatCrypto(u.usdt_balance, "USDT")}</td>
                  <td className="px-5 py-3 text-right text-muted-foreground">{formatUsd(toUsd(u.btc_balance, "BTC") + toUsd(u.usdt_balance, "USDT"))}</td>
                  <td className="px-5 py-3 text-muted-foreground">{formatDate(u.created_at)}</td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => setEditing(u)} className="inline-flex items-center gap-1 rounded-md border border-white/10 px-3 py-1.5 text-xs hover:bg-white/5">
                      <Pencil className="h-3 w-3" /> Edit
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">No users yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {editing && <BalanceEditorModal user={editing} onClose={() => { setEditing(null); load(); }} />}
    </>
  );
}

function BalanceEditorModal({ user, onClose }: { user: UserRow; onClose: () => void }) {
  const [btc, setBtc] = useState(user.btc_balance.toString());
  const [usdt, setUsdt] = useState(user.usdt_balance.toString());
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("wallets")
      .update({ btc_balance: Number(btc) || 0, usdt_balance: Number(usdt) || 0 })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Balance updated");
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="border-white/10 bg-card/90 backdrop-blur-xl sm:max-w-md">
        <DialogHeader><DialogTitle>Edit balances</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">{user.full_name || user.email}</p>
        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-xs font-medium text-muted-foreground"><BtcLogo className="h-4 w-4" /> BTC Balance</label>
            <input type="number" step="any" value={btc} onChange={(e) => setBtc(e.target.value)} className="input-glow w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 font-mono text-sm" />
          </div>
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-xs font-medium text-muted-foreground"><UsdtLogo className="h-4 w-4" /> USDT Balance</label>
            <input type="number" step="any" value={usdt} onChange={(e) => setUsdt(e.target.value)} className="input-glow w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 font-mono text-sm" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button variant="hero" className="flex-1" onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============ TX TAB (deposits/withdrawals) ============
function TxTab({ type }: { type: "deposit" | "withdrawal" }) {
  const [rows, setRows] = useState<TxRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const [acting, setActing] = useState<TxRow | null>(null);
  const [actionMode, setActionMode] = useState<"approve" | "reject">("approve");

  const load = useCallback(async () => {
    setLoading(true);
    const { data: txs } = await supabase
      .from("transactions").select("*").eq("type", type).order("created_at", { ascending: false });
    const { data: profiles } = await supabase.from("profiles").select("id,email,full_name");
    if (txs && profiles) {
      const merged = txs.map((t) => {
        const p = profiles.find((x) => x.id === t.user_id);
        return { ...t, amount: Number(t.amount), email: p?.email, full_name: p?.full_name } as TxRow;
      });
      setRows(filter === "pending" ? merged.filter((t) => t.status === "pending") : merged);
    }
    setLoading(false);
  }, [type, filter]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Spinner />;

  return (
    <>
      <div className="mb-3 flex gap-2">
        {(["pending", "all"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize ${filter === f ? "bg-primary/20 text-primary ring-1 ring-primary/30" : "bg-white/5 text-muted-foreground hover:bg-white/10"}`}>{f}</button>
        ))}
      </div>
      <div className="overflow-hidden rounded-2xl glass">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3 text-left font-medium">Date</th>
                <th className="px-5 py-3 text-left font-medium">User</th>
                <th className="px-5 py-3 text-left font-medium">Asset</th>
                <th className="px-5 py-3 text-right font-medium">Amount</th>
                {type === "withdrawal" && <th className="px-5 py-3 text-left font-medium">Address</th>}
                <th className="px-5 py-3 text-right font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((t) => (
                <tr key={t.id} className="hover:bg-white/[0.03]">
                  <td className="px-5 py-3 text-muted-foreground">{formatDate(t.created_at)}</td>
                  <td className="px-5 py-3"><div className="font-medium">{t.full_name || "—"}</div><div className="text-xs text-muted-foreground">{t.email}</div></td>
                  <td className="px-5 py-3"><span className="inline-flex items-center gap-1.5">{t.asset === "BTC" ? <BtcLogo className="h-4 w-4" /> : <UsdtLogo className="h-4 w-4" />}{t.asset}</span></td>
                  <td className="px-5 py-3 text-right font-mono">{formatCrypto(t.amount, t.asset)}</td>
                  {type === "withdrawal" && <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{t.wallet_address?.slice(0, 14)}…</td>}
                  <td className="px-5 py-3 text-right"><StatusBadge status={t.status} /></td>
                  <td className="px-5 py-3 text-right">
                    {t.status === "pending" ? (
                      <div className="flex justify-end gap-1">
                        <button onClick={() => { setActing(t); setActionMode("approve"); }} className="rounded-md border border-success/30 bg-success/10 px-2 py-1 text-xs text-success hover:bg-success/20"><Check className="inline h-3 w-3" /> {type === "deposit" ? "Approve" : "Complete"}</button>
                        <button onClick={() => { setActing(t); setActionMode("reject"); }} className="rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1 text-xs text-destructive hover:bg-destructive/20"><X className="inline h-3 w-3" /> Reject</button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">{t.admin_note || "—"}</span>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={type === "withdrawal" ? 7 : 6} className="py-12 text-center text-sm text-muted-foreground">No {type}s {filter === "pending" ? "pending" : ""}.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {acting && <ActionModal tx={acting} mode={actionMode} type={type} onClose={() => { setActing(null); load(); }} />}
    </>
  );
}

function ActionModal({ tx, mode, type, onClose }: { tx: TxRow; mode: "approve" | "reject"; type: "deposit" | "withdrawal"; onClose: () => void }) {
  const isApprove = mode === "approve";
  // For deposits being approved, admin can override the credited amount
  const [amount, setAmount] = useState(tx.amount.toString());
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    if (isApprove) {
      const newStatus = "completed";
      // Update wallet balance if deposit-approve or withdrawal-complete
      const { data: w } = await supabase.from("wallets").select("btc_balance,usdt_balance").eq("user_id", tx.user_id).maybeSingle();
      if (w) {
        const balCol = tx.asset === "BTC" ? "btc_balance" : "usdt_balance";
        const cur = Number(w[balCol as keyof typeof w]);
        const credited = type === "deposit" ? Number(amount) : -Number(tx.amount);
        const newBal = cur + credited;
        if (newBal < 0) {
          toast.error("Insufficient balance to complete withdrawal.");
          setSaving(false);
          return;
        }
        const walletUpdate = balCol === "btc_balance" ? { btc_balance: newBal } : { usdt_balance: newBal };
        await supabase.from("wallets").update(walletUpdate).eq("user_id", tx.user_id);
      }
      const update: { status: "completed"; admin_note: string | null; amount?: number } = { status: newStatus, admin_note: note || null };
      if (type === "deposit") update.amount = Number(amount);
      const { error } = await supabase.from("transactions").update(update).eq("id", tx.id);
      if (error) { toast.error(error.message); setSaving(false); return; }
      // Fire approval email (non-blocking)
      if (tx.email) {
        const firstName = tx.full_name ?? undefined;
        const tmpl = type === "deposit" ? "deposit_approved" : "withdrawal_approved";
        void sendEmail(tx.email, tmpl, {
          firstName,
          amount: type === "deposit" ? Number(amount) : tx.amount,
          asset: tx.asset,
          walletAddress: tx.wallet_address ?? undefined,
        });
      }
      toast.success(type === "deposit" ? "Deposit approved & balance credited" : "Withdrawal marked complete");
    } else {
      const { error } = await supabase.from("transactions").update({ status: "rejected", admin_note: note || null }).eq("id", tx.id);
      if (error) { toast.error(error.message); setSaving(false); return; }
      // Fire rejection email — only meaningful for withdrawals per requirements
      if (type === "withdrawal" && tx.email) {
        const firstName = tx.full_name ?? undefined;
        void sendEmail(tx.email, "withdrawal_rejected", {
          firstName, amount: tx.amount, asset: tx.asset, reason: note || undefined,
        });
      }
      toast.success("Marked as rejected");
    }
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="border-white/10 bg-card/90 backdrop-blur-xl sm:max-w-md">
        <DialogHeader><DialogTitle>{isApprove ? (type === "deposit" ? "Approve deposit" : "Mark complete") : "Reject request"}</DialogTitle></DialogHeader>
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">{tx.full_name || tx.email} requested <span className="font-mono text-foreground">{formatCrypto(tx.amount, tx.asset)} {tx.asset}</span></p>
          {isApprove && type === "deposit" && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Credit amount ({tx.asset})</label>
              <input type="number" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} className="input-glow w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 font-mono" />
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Note (optional)</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="input-glow w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button variant={isApprove ? "success" : "destructive"} className="flex-1" onClick={submit} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : isApprove ? "Confirm" : "Reject"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============ CHATS TAB ============
function ChatsTab() {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatRow[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadThreads = useCallback(async () => {
    setLoading(true);
    const { data: msgs } = await supabase.from("chat_messages").select("*").order("created_at", { ascending: false });
    const { data: profiles } = await supabase.from("profiles").select("id,email,full_name");
    if (msgs && profiles) {
      const map = new Map<string, ChatThread>();
      for (const m of msgs as ChatRow[]) {
        if (map.has(m.user_id)) continue;
        const p = profiles.find((x) => x.id === m.user_id);
        map.set(m.user_id, {
          user_id: m.user_id,
          email: p?.email ?? "(unknown)",
          full_name: p?.full_name ?? null,
          lastMessage: m.message,
          lastAt: m.created_at,
          unread: 0,
        });
      }
      // Compute unread counts (user-sent, unread)
      for (const m of msgs as ChatRow[]) {
        const t = map.get(m.user_id);
        if (t && m.sender === "user" && !m.read) t.unread += 1;
      }
      setThreads(Array.from(map.values()));
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadThreads(); }, [loadThreads]);

  // Realtime: any new chat_messages
  useEffect(() => {
    const ch = supabase
      .channel("admin-chats")
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_messages" }, () => {
        loadThreads();
        if (activeUserId) loadMessages(activeUserId);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeUserId]);

  const loadMessages = async (userId: string) => {
    const { data } = await supabase.from("chat_messages").select("*").eq("user_id", userId).order("created_at", { ascending: true });
    if (data) {
      setMessages(data as ChatRow[]);
      // Mark user-sent as read
      const unread = (data as ChatRow[]).filter((m) => m.sender === "user" && !m.read).map((m) => m.id);
      if (unread.length) {
        await supabase.from("chat_messages").update({ read: true }).in("id", unread);
      }
    }
  };

  useEffect(() => {
    if (activeUserId) loadMessages(activeUserId);
  }, [activeUserId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const send = async () => {
    if (!activeUserId || !input.trim()) return;
    const text = input.trim();
    setInput("");
    const { error } = await supabase.from("chat_messages").insert({
      user_id: activeUserId, sender: "admin", message: text,
    });
    if (error) toast.error(error.message);
  };

  if (loading) return <Spinner />;

  return (
    <div className="grid gap-4 md:grid-cols-[280px_1fr] md:h-[600px]">
      <div className={`overflow-hidden rounded-2xl glass md:overflow-y-auto ${activeUserId ? "hidden md:block" : ""}`}>
        {threads.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">No conversations yet.</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {threads.map((t) => (
              <li key={t.user_id}>
                <button
                  onClick={() => setActiveUserId(t.user_id)}
                  className={`flex w-full flex-col gap-1 px-4 py-3 text-left transition hover:bg-white/5 ${activeUserId === t.user_id ? "bg-white/[0.06]" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate text-sm font-medium">{t.full_name || t.email}</span>
                    {t.unread > 0 && <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[11px] font-semibold text-destructive-foreground">{t.unread}</span>}
                  </div>
                  <span className="truncate text-xs text-muted-foreground">{t.lastMessage}</span>
                  <span className="text-[10px] text-muted-foreground">{formatDate(t.lastAt)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className={`flex h-[70vh] flex-col overflow-hidden rounded-2xl glass md:h-auto ${!activeUserId ? "hidden md:flex" : ""}`}>
        {!activeUserId ? (
          <div className="flex flex-1 items-center justify-center p-10 text-center text-sm text-muted-foreground">
            Select a conversation to view messages.
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2 md:hidden">
              <button onClick={() => setActiveUserId(null)} className="rounded-md border border-white/10 px-2 py-1 text-xs hover:bg-white/5">← Back</button>
              <span className="truncate text-sm font-medium">{threads.find((t) => t.user_id === activeUserId)?.full_name || threads.find((t) => t.user_id === activeUserId)?.email}</span>
            </div>
            <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-4">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.sender === "admin" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${m.sender === "admin" ? "bg-primary text-primary-foreground" : "bg-white/10"}`}>
                    {m.message}
                    <div className="mt-1 text-[10px] opacity-60">{formatDate(m.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-center gap-2 border-t border-white/10 p-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Reply…"
                maxLength={2000}
                className="input-glow flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
              />
              <Button type="submit" size="icon" variant="hero" disabled={!input.trim()}><Send className="h-4 w-4" /></Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function Spinner() {
  return <div className="flex items-center justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
}

// ============ WALLETS TAB ============
function WalletsTab() {
  const [btc, setBtc] = useState("");
  const [usdt, setUsdt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("admin_wallets").select("asset,address");
      if (data) {
        for (const r of data) {
          if (r.asset === "BTC") setBtc(r.address ?? "");
          if (r.asset === "USDT") setUsdt(r.address ?? "");
        }
      }
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("admin_wallets")
      .upsert(
        [
          { asset: "BTC" as const, address: btc.trim() },
          { asset: "USDT" as const, address: usdt.trim() },
        ],
        { onConflict: "asset" },
      );
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Wallet addresses saved");
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl glass p-5 sm:p-6">
        <p className="text-sm text-muted-foreground">
          These addresses are shown to users in the deposit screen alongside a QR code. Only update them with verified, monitored wallets.
        </p>
      </div>

      <WalletField
        label="BTC Wallet Address"
        placeholder="bc1q…"
        value={btc}
        onChange={setBtc}
        accent={<BtcLogo className="h-5 w-5" />}
      />
      <WalletField
        label="USDT (ERC20) Wallet Address"
        placeholder="0x…"
        value={usdt}
        onChange={setUsdt}
        accent={<UsdtLogo className="h-5 w-5" />}
      />

      <div className="flex justify-end">
        <Button variant="hero" size="lg" onClick={save} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="mr-2 h-4 w-4" /> Save Addresses</>}
        </Button>
      </div>
    </div>
  );
}

function WalletField({
  label, value, onChange, placeholder, accent,
}: { label: string; value: string; onChange: (v: string) => void; placeholder: string; accent: React.ReactNode }) {
  return (
    <div className="rounded-2xl glass p-5 sm:p-6">
      <label className="mb-2 flex items-center gap-2 text-sm font-medium">
        {accent} {label}
      </label>
      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-start">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={200}
          className="input-glow w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 font-mono text-xs sm:text-sm"
        />
        <div className="flex shrink-0 items-center justify-center self-center sm:self-auto">
          <div className="rounded-lg bg-white p-2">
            {value.trim() ? (
              <QRCodeSVG value={value.trim()} size={104} level="M" includeMargin={false} />
            ) : (
              <div className="flex h-[104px] w-[104px] items-center justify-center text-[10px] text-muted-foreground">
                QR preview
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


// ============ ANNOUNCEMENTS TAB ============
interface AnnouncementRow {
  id: string;
  message: string;
  type: "info" | "warning" | "urgent";
  active: boolean;
  created_at: string;
}

function AnnouncementsTab() {
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"info" | "warning" | "urgent">("info");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<AnnouncementRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    setItems((data as AnnouncementRow[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!message.trim()) { toast.error("Message required"); return; }
    setSaving(true);
    // Deactivate any other active rows so only one is active
    if (active) {
      await supabase.from("announcements").update({ active: false }).eq("active", true);
    }
    const { error } = await supabase.from("announcements").insert({
      message: message.trim(), type, active,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(active ? "Announcement published" : "Announcement saved (inactive)");
    setMessage("");
    load();
  };

  const toggle = async (row: AnnouncementRow) => {
    if (!row.active) {
      // Deactivate others first
      await supabase.from("announcements").update({ active: false }).eq("active", true);
    }
    await supabase.from("announcements").update({ active: !row.active }).eq("id", row.id);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl glass p-5 sm:p-6">
        <h3 className="font-semibold">New Announcement</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Pinned below the navbar on every page. Only one is active at a time. All users get an in-app notification when activated.
        </p>
        <div className="mt-4 space-y-3">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Scheduled maintenance on Saturday from 02:00–04:00 UTC."
            rows={3}
            maxLength={300}
            className="input-glow w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm"
          />
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-center">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as "info" | "warning" | "urgent")}
                className="input-glow w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
              >
                <option value="info">Info (blue)</option>
                <option value="warning">Warning (gold)</option>
                <option value="urgent">Urgent (red)</option>
              </select>
            </div>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
              Active
            </label>
            <Button variant="hero" onClick={save} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publish"}
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl glass">
        <div className="border-b border-white/10 px-5 py-3 text-sm font-semibold">Recent Announcements</div>
        {loading ? (
          <div className="flex items-center justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : items.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">No announcements yet.</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {items.map((row) => (
              <li key={row.id} className="flex items-start gap-3 px-5 py-3">
                <span className={`mt-1 inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${
                  row.type === "urgent" ? "bg-destructive/15 text-destructive ring-destructive/30"
                  : row.type === "warning" ? "bg-gold/15 text-gold ring-gold/30"
                  : "bg-primary/15 text-primary ring-primary/30"
                }`}>{row.type}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{row.message}</p>
                  <p className="text-[10px] text-muted-foreground">{formatDate(row.created_at)}</p>
                </div>
                <button
                  onClick={() => toggle(row)}
                  className={`shrink-0 rounded-md border px-2 py-1 text-[11px] font-medium ${
                    row.active ? "border-success/30 bg-success/10 text-success" : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10"
                  }`}
                >
                  {row.active ? "Active" : "Inactive"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
