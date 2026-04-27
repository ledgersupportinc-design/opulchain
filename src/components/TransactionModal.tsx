import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import { Info, Loader2, ArrowDownToLine, ArrowUpFromLine, Copy, Check, AlertTriangle, ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { BtcLogo, UsdtLogo } from "./CryptoLogos";
import { sendEmail } from "@/lib/sendEmail";

type Asset = "BTC" | "USDT";
type Mode = "deposit" | "withdrawal";
type DepositStep = "details" | "payment" | "submitted";

function formatBal(n: number, asset: Asset) {
  if (asset === "BTC") {
    return `${n.toLocaleString("en-US", { maximumFractionDigits: 8 })} BTC`;
  }
  return `${n.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 })} USDT`;
}

const depositSchema = z.object({
  amount: z.number().positive("Amount must be positive").max(1_000_000),
});
const withdrawSchema = z.object({
  amount: z.number().positive("Amount must be positive").max(1_000_000),
  wallet_address: z.string().trim().min(10, "Wallet address looks too short").max(200),
});

export function TransactionModal({
  mode,
  open,
  onOpenChange,
}: {
  mode: Mode;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { user } = useAuth();
  const [asset, setAsset] = useState<Asset>("BTC");
  const [amount, setAmount] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [withdrawSubmitted, setWithdrawSubmitted] = useState(false);

  // Deposit-only flow state
  const [depositStep, setDepositStep] = useState<DepositStep>("details");
  const [adminAddresses, setAdminAddresses] = useState<Record<Asset, string>>({ BTC: "", USDT: "" });
  const [loadingAddrs, setLoadingAddrs] = useState(false);
  const [copied, setCopied] = useState(false);

  // Withdrawal-only: live wallet balances so we can block over-withdrawals
  const [balances, setBalances] = useState<Record<Asset, number>>({ BTC: 0, USDT: 0 });
  const [loadingBalances, setLoadingBalances] = useState(false);

  const reset = () => {
    setAsset("BTC");
    setAmount("");
    setWalletAddress("");
    setWithdrawSubmitted(false);
    setDepositStep("details");
    setCopied(false);
  };

  const handleClose = (o: boolean) => {
    if (!o) reset();
    onOpenChange(o);
  };

  // Load admin wallet addresses when opening a deposit
  useEffect(() => {
    if (!open || mode !== "deposit") return;
    let cancelled = false;
    setLoadingAddrs(true);
    supabase
      .from("admin_wallets")
      .select("asset,address")
      .then(({ data }) => {
        if (cancelled) return;
        const map: Record<Asset, string> = { BTC: "", USDT: "" };
        for (const row of data ?? []) {
          if (row.asset === "BTC" || row.asset === "USDT") map[row.asset] = row.address ?? "";
        }
        setAdminAddresses(map);
        setLoadingAddrs(false);
      });
    return () => { cancelled = true; };
  }, [open, mode]);

  // Load wallet balances when opening a withdrawal
  useEffect(() => {
    if (!open || mode !== "withdrawal" || !user) return;
    let cancelled = false;
    setLoadingBalances(true);
    supabase
      .from("wallets")
      .select("btc_balance,usdt_balance")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setBalances({
          BTC: Number(data?.btc_balance ?? 0),
          USDT: Number(data?.usdt_balance ?? 0),
        });
        setLoadingBalances(false);
      });
    return () => { cancelled = true; };
  }, [open, mode, user]);


  const isDeposit = mode === "deposit";
  const currentAdminAddr = adminAddresses[asset];
  const assetLabel = asset === "USDT" ? "USDT ERC20" : "BTC";

  // Step 1 → Step 2 (deposit only)
  const goToPayment = () => {
    const amt = Number(amount);
    const parsed = depositSchema.safeParse({ amount: amt });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    if (!currentAdminAddr) {
      toast.error(`No ${assetLabel} deposit address configured yet. Please contact support.`);
      return;
    }
    setDepositStep("payment");
  };

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(currentAdminAddr);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Could not copy address");
    }
  };

  // Final submit (deposit step 2 OR withdrawal)
  const submitDeposit = async () => {
    if (!user) return;
    const amt = Number(amount);
    setSubmitting(true);
    const { error } = await supabase.from("transactions").insert({
      user_id: user.id,
      type: "deposit",
      asset,
      amount: amt,
      wallet_address: null,
      status: "pending",
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    // Fire deposit submitted email (non-blocking)
    if (user.email) {
      const firstName = (user.user_metadata as { full_name?: string } | undefined)?.full_name;
      void sendEmail(user.email, "deposit_submitted", { firstName, amount: amt, asset });
    }
    setDepositStep("submitted");
    toast.success("Deposit submitted");
  };

  const submitWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const amt = Number(amount);
    const parsed = withdrawSchema.safeParse({ amount: amt, wallet_address: walletAddress });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }

    // Block over-withdrawal client-side
    const available = balances[asset];
    if (amt > available) {
      toast.error(`Insufficient ${asset} balance. Available: ${formatBal(available, asset)}`);
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("transactions").insert({
      user_id: user.id,
      type: "withdrawal",
      asset,
      amount: amt,
      wallet_address: walletAddress.trim(),
      status: "pending",
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    // Fire withdrawal submitted email (non-blocking)
    if (user.email) {
      const firstName = (user.user_metadata as { full_name?: string } | undefined)?.full_name;
      void sendEmail(user.email, "withdrawal_submitted", {
        firstName, amount: amt, asset, walletAddress: walletAddress.trim(),
      });
    }
    setWithdrawSubmitted(true);
    toast.success("Withdrawal request submitted");
  };

  const formattedAmount = useMemo(() => {
    const n = Number(amount);
    if (!n || Number.isNaN(n)) return "—";
    return asset === "BTC" ? `${n} BTC` : `${n.toLocaleString("en-US")} USDT`;
  }, [amount, asset]);

  // Withdrawal balance helpers
  const available = balances[asset];
  const numericAmount = Number(amount);
  const exceedsBalance =
    !isDeposit &&
    !loadingBalances &&
    amount !== "" &&
    Number.isFinite(numericAmount) &&
    numericAmount > available;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-white/10 bg-card/90 backdrop-blur-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {isDeposit
              ? <ArrowDownToLine className="h-5 w-5 text-success" />
              : <ArrowUpFromLine className="h-5 w-5 text-warning" />}
            {isDeposit
              ? depositStep === "payment" ? "Send Your Payment" : depositStep === "submitted" ? "Payment Submitted" : "Request Deposit"
              : withdrawSubmitted ? "Withdrawal Submitted" : "Request Withdrawal"}
          </DialogTitle>
        </DialogHeader>

        {/* ============ DEPOSIT FLOW ============ */}
        {isDeposit && depositStep === "details" && (
          <form onSubmit={(e) => { e.preventDefault(); goToPayment(); }} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Asset</label>
              <div className="grid grid-cols-2 gap-2">
                {(["BTC", "USDT"] as Asset[]).map((a) => (
                  <button
                    type="button"
                    key={a}
                    onClick={() => setAsset(a)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition ${
                      asset === a ? "border-primary bg-primary/10" : "border-white/10 bg-white/5 hover:border-white/20"
                    }`}
                  >
                    {a === "BTC" ? <BtcLogo className="h-5 w-5" /> : <UsdtLogo className="h-5 w-5" />}
                    <span className="font-medium">{a === "USDT" ? "USDT (ERC20)" : "BTC"}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Amount ({asset === "USDT" ? "USDT" : "BTC"})
              </label>
              <input
                type="number"
                step="any"
                min="0"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="input-glow w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-base"
              />
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-secondary-foreground">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p>Deposits are manually reviewed and credited within 24 hours.</p>
            </div>

            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loadingAddrs}>
              {loadingAddrs ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Continue to Payment <ArrowDownToLine className="ml-1 h-4 w-4 rotate-[-90deg]" /></>}
            </Button>
          </form>
        )}

        {isDeposit && depositStep === "payment" && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setDepositStep("details")}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3 w-3" /> Edit details
            </button>

            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-mono font-semibold">{formattedAmount}</span>
            </div>

            {/* QR */}
            <div className="flex flex-col items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <div className="rounded-lg bg-white p-3">
                {currentAdminAddr ? (
                  <QRCodeSVG value={currentAdminAddr} size={168} level="M" includeMargin={false} />
                ) : (
                  <div className="flex h-[168px] w-[168px] items-center justify-center text-xs text-muted-foreground">
                    No address
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {asset === "BTC" ? <BtcLogo className="h-4 w-4" /> : <UsdtLogo className="h-4 w-4" />}
                Scan to send {assetLabel}
              </div>
            </div>

            {/* Address + copy */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{assetLabel} Wallet Address</label>
              <div className="flex items-stretch gap-2">
                <div className="flex-1 break-all rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 font-mono text-xs">
                  {currentAdminAddr || "—"}
                </div>
                <button
                  type="button"
                  onClick={copyAddress}
                  disabled={!currentAdminAddr}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-medium hover:bg-white/10 disabled:opacity-40"
                >
                  {copied ? <><Check className="h-3.5 w-3.5 text-success" /> Copied!</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
                </button>
              </div>
            </div>

            {/* Gold warning */}
            <div className="flex items-start gap-2 rounded-lg border border-gold/40 bg-gold/10 p-3 text-xs text-gold">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Only send <span className="font-semibold">{assetLabel}</span> to this address.
                Sending any other asset will result in permanent loss.
              </p>
            </div>

            <Button onClick={submitDeposit} variant="hero" size="lg" className="w-full" disabled={submitting || !currentAdminAddr}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "I Have Made This Payment"}
            </Button>
          </div>
        )}

        {isDeposit && depositStep === "submitted" && (
          <div className="space-y-4 py-2 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success ring-1 ring-success/30">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <p className="font-semibold">Payment submitted</p>
              <p className="mt-1 text-sm text-muted-foreground">
                ✅ Your balance will be credited within 24 hours after confirmation.
              </p>
            </div>
            <Button variant="hero" className="w-full" onClick={() => handleClose(false)}>Done</Button>
          </div>
        )}

        {/* ============ WITHDRAWAL FLOW (unchanged) ============ */}
        {!isDeposit && (
          withdrawSubmitted ? (
            <div className="space-y-4 py-4 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-warning/15 text-warning ring-1 ring-warning/30">
                <Loader2 className="h-7 w-7 animate-pulse" />
              </div>
              <div>
                <p className="font-semibold">Pending Review</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  We've received your request. You'll see the update in your transaction history.
                </p>
              </div>
              <Button variant="hero" className="w-full" onClick={() => handleClose(false)}>Done</Button>
            </div>
          ) : (
            <form onSubmit={submitWithdrawal} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Asset</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["BTC", "USDT"] as Asset[]).map((a) => (
                    <button
                      type="button"
                      key={a}
                      onClick={() => setAsset(a)}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition ${
                        asset === a ? "border-primary bg-primary/10" : "border-white/10 bg-white/5 hover:border-white/20"
                      }`}
                    >
                      {a === "BTC" ? <BtcLogo className="h-5 w-5" /> : <UsdtLogo className="h-5 w-5" />}
                      <span className="font-medium">{a}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="block text-xs font-medium text-muted-foreground">Amount ({asset})</label>
                  <button
                    type="button"
                    onClick={() => setAmount(String(available))}
                    disabled={loadingBalances || available <= 0}
                    className="text-xs font-medium text-primary hover:underline disabled:opacity-40 disabled:no-underline"
                  >
                    Max
                  </button>
                </div>
                <input
                  type="number" step="any" min="0" inputMode="decimal"
                  value={amount} onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className={`input-glow w-full rounded-lg border bg-white/5 px-3 py-2.5 text-base ${
                    exceedsBalance ? "border-destructive/60" : "border-white/10"
                  }`}
                />
                <div className="mt-1.5 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Available: <span className="font-mono text-foreground">{loadingBalances ? "…" : formatBal(available, asset)}</span>
                  </span>
                  {exceedsBalance && (
                    <span className="font-medium text-destructive">Exceeds balance</span>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Destination Wallet Address</label>
                <input
                  type="text" value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder={asset === "BTC" ? "bc1q..." : "0x... (ERC20)"}
                  className="input-glow w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 font-mono text-xs"
                />
              </div>

              <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-secondary-foreground">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p>Withdrawals are processed within 1–3 business days.</p>
              </div>

              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={submitting || exceedsBalance || loadingBalances}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Request Withdrawal"}
              </Button>
            </form>
          )
        )}
      </DialogContent>
    </Dialog>
  );
}
