import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useRef } from "react";
import { Loader2, Users, ArrowDownToLine, ArrowUpFromLine, MessageSquare, Pencil, Check, X, Send, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { BtcLogo, UsdtLogo } from "@/components/CryptoLogos";
import { StatusBadge } from "./dashboard";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { formatCrypto, formatDate, formatUsd, toUsd } from "@/lib/format";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Panel — OpulChain" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type Tab = "users" | "deposits" | "withdrawals" | "chats";

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
  const [tab, setTab] = useState<Tab>("users");

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
      <main className="relative z-10 mx-auto max-w-7xl px-6 py-10">
        <header className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-gold/15 px-3 py-1 text-xs font-medium text-gold ring-1 ring-gold/30">
            <ShieldAlert className="h-3 w-3" /> Admin Panel
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold md:text-4xl">Operations Console</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage users, approve transactions, reply to chats.</p>
        </header>

        <div className="mb-6 flex flex-wrap gap-2 rounded-xl glass p-1.5">
          <TabBtn active={tab === "users"} onClick={() => setTab("users")} icon={<Users className="h-4 w-4" />}>Users</TabBtn>
          <TabBtn active={tab === "deposits"} onClick={() => setTab("deposits")} icon={<ArrowDownToLine className="h-4 w-4" />}>Deposits</TabBtn>
          <TabBtn active={tab === "withdrawals"} onClick={() => setTab("withdrawals")} icon={<ArrowUpFromLine className="h-4 w-4" />}>Withdrawals</TabBtn>
          <TabBtn active={tab === "chats"} onClick={() => setTab("chats")} icon={<MessageSquare className="h-4 w-4" />}>Chats</TabBtn>
        </div>

        {tab === "users" && <UsersTab />}
        {tab === "deposits" && <TxTab type="deposit" />}
        {tab === "withdrawals" && <TxTab type="withdrawal" />}
        {tab === "chats" && <ChatsTab />}
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
        await supabase.from("wallets").update({ [balCol]: newBal }).eq("user_id", tx.user_id);
      }
      const update: Record<string, unknown> = { status: newStatus, admin_note: note || null };
      if (type === "deposit") update.amount = Number(amount);
      const { error } = await supabase.from("transactions").update(update).eq("id", tx.id);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success(type === "deposit" ? "Deposit approved & balance credited" : "Withdrawal marked complete");
    } else {
      const { error } = await supabase.from("transactions").update({ status: "rejected", admin_note: note || null }).eq("id", tx.id);
      if (error) { toast.error(error.message); setSaving(false); return; }
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
      <div className="overflow-hidden rounded-2xl glass md:overflow-y-auto">
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
      <div className="flex flex-col overflow-hidden rounded-2xl glass">
        {!activeUserId ? (
          <div className="flex flex-1 items-center justify-center p-10 text-center text-sm text-muted-foreground">
            Select a conversation to view messages.
          </div>
        ) : (
          <>
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
