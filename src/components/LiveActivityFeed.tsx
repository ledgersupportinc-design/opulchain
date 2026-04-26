import { useLiveActivity, formatAgo, type LiveActivityItem } from "@/hooks/useLiveActivity";
import { BtcLogo, UsdtLogo } from "./CryptoLogos";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";

function formatAmount(item: LiveActivityItem): string {
  if (item.asset === "BTC") {
    // BTC – up to 3 decimals trimmed
    return `${item.amount.toFixed(3).replace(/0+$/, "").replace(/\.$/, "")} BTC`;
  }
  // USDT – with $ and thousands separators
  return `$${item.amount.toLocaleString("en-US")} USDT`;
}

function Row({ item, compact = false }: { item: LiveActivityItem; compact?: boolean }) {
  const isDeposit = item.action === "deposited";
  const accent = isDeposit ? "text-success" : "text-primary";
  const Icon = isDeposit ? ArrowDownToLine : ArrowUpFromLine;
  return (
    <div
      key={item.id}
      className={`flex items-center gap-3 ${compact ? "shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1.5" : "rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5"}`}
    >
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5 ${accent}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">
          <span className="font-medium">{item.name}</span>{" "}
          <span className={accent}>{item.action}</span>{" "}
          <span className="font-mono text-foreground">{formatAmount(item)}</span>
        </p>
        {!compact && (
          <p className="text-[11px] text-muted-foreground">{formatAgo(item.agoSec)}</p>
        )}
      </div>
      <div className="shrink-0">
        {item.asset === "BTC" ? <BtcLogo className="h-5 w-5" /> : <UsdtLogo className="h-5 w-5" />}
      </div>
    </div>
  );
}

interface Props {
  /** "section" = full-width landing card, "sidebar" = dashboard column */
  variant?: "section" | "sidebar";
  title?: string;
}

export function LiveActivityFeed({ variant = "section", title = "Global Activity" }: Props) {
  const items = useLiveActivity();

  return (
    <div className="rounded-2xl glass-strong p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold sm:text-xl">{title}</h3>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-[11px] font-semibold text-success">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
          LIVE
        </span>
      </div>

      {/* Mobile: compact horizontal ticker */}
      <div className="-mx-5 overflow-x-auto px-5 pb-1 sm:hidden">
        <div className="flex w-max gap-2">
          {items.map((it) => (
            <Row key={it.id} item={it} compact />
          ))}
        </div>
      </div>

      {/* Desktop / tablet: vertical list with fade-in */}
      <div className={`hidden sm:block ${variant === "sidebar" ? "space-y-2" : "space-y-2"}`}>
        {items.map((it, i) => (
          <div key={it.id} className={i === 0 ? "fade-in" : ""}>
            <Row item={it} />
          </div>
        ))}
      </div>
    </div>
  );
}
