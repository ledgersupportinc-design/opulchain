import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info, Loader2, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { BtcLogo, UsdtLogo } from "./CryptoLogos";

type Asset = "BTC" | "USDT";
type Mode = "deposit" | "withdrawal";

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
  const [submitted, setSubmitted] = useState(false);

  const reset = () => {
    setAsset("BTC");
    setAmount("");
    setWalletAddress("");
    setSubmitted(false);
  };

  const handleClose = (o: boolean) => {
    if (!o) reset();
    onOpenChange(o);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const amt = Number(amount);

    if (mode === "deposit") {
      const parsed = depositSchema.safeParse({ amount: amt });
      if (!parsed.success) {
        toast.error(parsed.error.issues[0].message);
        return;
      }
    } else {
      const parsed = withdrawSchema.safeParse({ amount: amt, wallet_address: walletAddress });
      if (!parsed.success) {
        toast.error(parsed.error.issues[0].message);
        return;
      }
    }

    setSubmitting(true);
    const { error } = await supabase.from("transactions").insert({
      user_id: user.id,
      type: mode,
      asset,
      amount: amt,
      wallet_address: mode === "withdrawal" ? walletAddress.trim() : null,
      status: "pending",
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSubmitted(true);
    toast.success(mode === "deposit" ? "Deposit request submitted" : "Withdrawal request submitted");
  };

  const isDeposit = mode === "deposit";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="border-white/10 bg-card/90 backdrop-blur-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {isDeposit ? <ArrowDownToLine className="h-5 w-5 text-success" /> : <ArrowUpFromLine className="h-5 w-5 text-warning" />}
            {isDeposit ? "Request Deposit" : "Request Withdrawal"}
          </DialogTitle>
        </DialogHeader>

        {submitted ? (
          <div className="space-y-4 py-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-warning/15 text-warning ring-1 ring-warning/30">
              <Loader2 className="h-7 w-7 animate-pulse" />
            </div>
            <div>
              <p className="font-semibold">{isDeposit ? "Pending Admin Approval" : "Pending Review"}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                We've received your request. You'll see the update in your transaction history.
              </p>
            </div>
            <Button variant="hero" className="w-full" onClick={() => handleClose(false)}>
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
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
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Amount ({asset})</label>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="input-glow w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-base"
              />
            </div>

            {!isDeposit && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Destination Wallet Address</label>
                <input
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder={asset === "BTC" ? "bc1q..." : "T... (TRC20)"}
                  className="input-glow w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 font-mono text-xs"
                />
              </div>
            )}

            <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-secondary-foreground">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p>
                {isDeposit
                  ? "Deposits are manually reviewed and credited within 24 hours."
                  : "Withdrawals are processed within 1–3 business days."}
              </p>
            </div>

            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : isDeposit ? "Request Deposit" : "Request Withdrawal"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
