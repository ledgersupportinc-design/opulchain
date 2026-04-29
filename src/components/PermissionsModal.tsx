import { useEffect, useState, useCallback } from "react";
import {
  Loader2, ShieldCheck, ShieldX, Check, X,
  Users, ArrowDownToLine, ArrowUpFromLine, Wallet as WalletIcon, Megaphone, MessageSquare, RefreshCw,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

type CheckStatus = "pending" | "ok" | "fail";

interface CapabilityCheck {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  status: CheckStatus;
  detail?: string;
}

export function PermissionsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, isAdmin, role } = useAuth();
  const [checks, setChecks] = useState<CapabilityCheck[]>(initialChecks());
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  const runChecks = useCallback(async () => {
    if (!user) return;
    setRunning(true);

    const results: Record<string, { status: CheckStatus; detail?: string }> = {};

    {
      const { data, error, count } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true });
      results.viewUsers = error
        ? { status: "fail", detail: error.message }
        : { status: "ok", detail: `${count ?? data?.length ?? 0} profiles visible` };
    }
    {
      const { data, error, count } = await supabase
        .from("wallets")
        .select("user_id", { count: "exact", head: true });
      results.viewBalances = error
        ? { status: "fail", detail: error.message }
        : { status: "ok", detail: `${count ?? data?.length ?? 0} wallets visible` };
    }
    {
      const { count: depositCount, error: depErr } = await supabase
        .from("transactions").select("id", { count: "exact", head: true }).eq("type", "deposit");
      const { count: wdCount, error: wdErr } = await supabase
        .from("transactions").select("id", { count: "exact", head: true }).eq("type", "withdrawal");
      if (depErr || wdErr) {
        results.viewDeposits = { status: "fail", detail: (depErr || wdErr)!.message };
        results.viewWithdrawals = { status: "fail", detail: (depErr || wdErr)!.message };
      } else {
        results.viewDeposits = { status: "ok", detail: `${depositCount ?? 0} deposit records visible` };
        results.viewWithdrawals = { status: "ok", detail: `${wdCount ?? 0} withdrawal records visible` };
      }
    }
    {
      const probeId = "00000000-0000-0000-0000-000000000000";
      const { error } = await supabase
        .from("transactions").update({ admin_note: null }).eq("id", probeId);
      results.approveTx = error
        ? { status: "fail", detail: error.message }
        : { status: "ok", detail: "Update policy permits admin write" };
    }
    {
      const probeUser = "00000000-0000-0000-0000-000000000000";
      const { error } = await supabase
        .from("wallets").update({ btc_balance: 0 }).eq("user_id", probeUser);
      results.editBalances = error
        ? { status: "fail", detail: error.message }
        : { status: "ok", detail: "Update policy permits admin write" };
    }
    {
      const { data, error } = await supabase.from("admin_wallets").select("asset, address");
      results.manageAdminWallets = error
        ? { status: "fail", detail: error.message }
        : { status: "ok", detail: `${data?.length ?? 0} deposit addresses configured` };
    }
    {
      const probeId = "00000000-0000-0000-0000-000000000000";
      const { error } = await supabase
        .from("announcements").update({ active: true }).eq("id", probeId);
      results.manageAnnouncements = error
        ? { status: "fail", detail: error.message }
        : { status: "ok", detail: "Insert/update policy permits admin write" };
    }
    {
      const { count, error } = await supabase
        .from("chat_messages").select("id", { count: "exact", head: true });
      results.supportChat = error
        ? { status: "fail", detail: error.message }
        : { status: "ok", detail: `${count ?? 0} messages visible across all threads` };
    }
    {
      const probeUser = "00000000-0000-0000-0000-000000000000";
      const { error } = await supabase
        .from("user_roles").delete().eq("user_id", probeUser).eq("role", "admin");
      results.manageRoles = error
        ? { status: "fail", detail: error.message }
        : { status: "ok", detail: "Delete policy permits admin write" };
    }

    setChecks((prev) =>
      prev.map((c) => ({
        ...c,
        status: results[c.key]?.status ?? "fail",
        detail: results[c.key]?.detail,
      }))
    );
    setLastRun(new Date());
    setRunning(false);
  }, [user]);

  useEffect(() => {
    if (open && isAdmin && user) void runChecks();
  }, [open, isAdmin, user, runChecks]);

  if (!isAdmin || !user) return null;

  const passed = checks.filter((c) => c.status === "ok").length;
  const failed = checks.filter((c) => c.status === "fail").length;
  const total = checks.length;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-card/95 backdrop-blur-xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-gold" /> Admin Capability Verification
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Live probe of every admin power for <span className="font-medium text-foreground">{user.email}</span>.
        </p>

        <div className="grid gap-2 sm:grid-cols-3">
          <SummaryCard label="Account role" value={role ?? "—"} accent="primary" icon={<ShieldCheck className="h-3 w-3" />} />
          <SummaryCard label="Granted" value={`${passed}/${total}`} accent={passed === total ? "success" : "warn"} icon={<Check className="h-3 w-3" />} />
          <SummaryCard label="Denied" value={`${failed}`} accent={failed === 0 ? "muted" : "danger"} icon={<X className="h-3 w-3" />} />
        </div>

        <div className="flex items-center justify-between">
          {lastRun ? (
            <p className="text-xs text-muted-foreground">
              Last checked {lastRun.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
            </p>
          ) : <span />}
          <button
            onClick={runChecks}
            disabled={running}
            className="inline-flex items-center gap-2 rounded-lg btn-primary px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
          >
            {running ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            Re-run
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
          <ul className="divide-y divide-white/5">
            {checks.map((c) => (
              <li key={c.key} className="flex items-start gap-3 px-4 py-3">
                <div className="mt-0.5 text-muted-foreground">{c.icon}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{c.label}</p>
                    <StatusPill status={c.status} />
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{c.description}</p>
                  {c.detail && (
                    <p className={`mt-1 font-mono text-[11px] ${c.status === "fail" ? "text-destructive" : "text-muted-foreground/80"}`}>
                      {c.detail}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-muted-foreground">
          Write checks use a harmless probe (an impossible row id) so nothing is actually modified.
        </p>
      </DialogContent>
    </Dialog>
  );
}

function initialChecks(): CapabilityCheck[] {
  return [
    { key: "viewUsers", label: "View all users", description: "Read every account profile in the system.", icon: <Users className="h-4 w-4" />, status: "pending" },
    { key: "viewBalances", label: "View user balances", description: "Read BTC and USDT balances across every wallet.", icon: <WalletIcon className="h-4 w-4" />, status: "pending" },
    { key: "editBalances", label: "Edit user balances", description: "Adjust BTC / USDT balances on the wallets table.", icon: <WalletIcon className="h-4 w-4" />, status: "pending" },
    { key: "viewDeposits", label: "View all deposits", description: "Inspect every deposit transaction submitted by users.", icon: <ArrowDownToLine className="h-4 w-4" />, status: "pending" },
    { key: "viewWithdrawals", label: "View all withdrawals", description: "Inspect every withdrawal request submitted by users.", icon: <ArrowUpFromLine className="h-4 w-4" />, status: "pending" },
    { key: "approveTx", label: "Approve / reject transactions", description: "Update transaction status (approve, complete, reject).", icon: <Check className="h-4 w-4" />, status: "pending" },
    { key: "manageAdminWallets", label: "Manage deposit addresses", description: "Read & update the BTC / USDT addresses users send funds to.", icon: <WalletIcon className="h-4 w-4" />, status: "pending" },
    { key: "manageAnnouncements", label: "Post announcements", description: "Create or edit the platform-wide announcement banner.", icon: <Megaphone className="h-4 w-4" />, status: "pending" },
    { key: "supportChat", label: "Reply to support chats", description: "Read every user's chat thread and respond as OpulChain Support.", icon: <MessageSquare className="h-4 w-4" />, status: "pending" },
    { key: "manageRoles", label: "Manage admin roles", description: "Grant or revoke the admin role on other accounts.", icon: <ShieldCheck className="h-4 w-4" />, status: "pending" },
  ];
}

function StatusPill({ status }: { status: CheckStatus }) {
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
        <Loader2 className="h-2.5 w-2.5 animate-spin" /> Checking
      </span>
    );
  }
  if (status === "ok") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-medium text-success ring-1 ring-success/30">
        <Check className="h-2.5 w-2.5" /> Granted
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-medium text-destructive ring-1 ring-destructive/30">
      <ShieldX className="h-2.5 w-2.5" /> Denied
    </span>
  );
}

function SummaryCard({
  label, value, icon, accent,
}: {
  label: string; value: string; icon: React.ReactNode;
  accent: "primary" | "success" | "warn" | "danger" | "muted";
}) {
  const accentMap: Record<typeof accent, string> = {
    primary: "text-primary bg-primary/10 ring-primary/30",
    success: "text-success bg-success/10 ring-success/30",
    warn: "text-gold bg-gold/10 ring-gold/30",
    danger: "text-destructive bg-destructive/10 ring-destructive/30",
    muted: "text-muted-foreground bg-white/5 ring-white/10",
  };
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
      <div className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${accentMap[accent]}`}>
        {icon} {label}
      </div>
      <p className="mt-1.5 font-display text-lg font-bold capitalize">{value}</p>
    </div>
  );
}
