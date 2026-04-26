import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { useCryptoPrices } from "@/hooks/useCryptoPrices";
import { BtcLogo, UsdtLogo } from "./CryptoLogos";
import { Skeleton } from "./ui/skeleton";

function formatPrice(n: number): string {
  if (n >= 1000) return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
}

function ChangeBadge({ change }: { change: number }) {
  const positive = change >= 0;
  const Icon = positive ? TrendingUp : TrendingDown;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[10px] font-medium ${
        positive ? "text-success" : "text-destructive"
      }`}
    >
      <Icon className="h-2.5 w-2.5" />
      {positive ? "+" : ""}
      {change.toFixed(2)}%
    </span>
  );
}

/**
 * Compact pill-shaped price ticker for the navbar (desktop only).
 */
export function CryptoPriceTicker() {
  const { prices, loading, error } = useCryptoPrices();

  if (loading && !prices) {
    return (
      <div className="hidden items-center gap-2 lg:flex">
        <Skeleton className="h-8 w-28 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
    );
  }
  if (!prices) return null;

  return (
    <div className="hidden items-center gap-2 lg:flex">
      <div
        className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 backdrop-blur"
        title={error ? "Price data delayed" : undefined}
      >
        <BtcLogo className="h-4 w-4" />
        <span className="text-xs font-mono font-semibold">{formatPrice(prices.BTC.usd)}</span>
        <ChangeBadge change={prices.BTC.change24h} />
        {error && <AlertTriangle className="h-3 w-3 text-warning" />}
      </div>
      <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 backdrop-blur">
        <UsdtLogo className="h-4 w-4" />
        <span className="text-xs font-mono font-semibold">${prices.USDT.usd.toFixed(2)}</span>
        <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-success">
          <span className="h-1 w-1 rounded-full bg-success" /> Stable
        </span>
      </div>
    </div>
  );
}

/**
 * Hero-section price strip for the landing page.
 */
export function CryptoPriceStrip() {
  const { prices, loading, error, secondsAgo } = useCryptoPrices();

  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
      {loading && !prices ? (
        <>
          <Skeleton className="h-12 w-44 rounded-2xl" />
          <Skeleton className="h-12 w-44 rounded-2xl" />
        </>
      ) : prices ? (
        <>
          <PriceChip
            icon={<BtcLogo className="h-5 w-5" />}
            label="BTC"
            price={formatPrice(prices.BTC.usd)}
            change={prices.BTC.change24h}
            stale={!!error}
          />
          <PriceChip
            icon={<UsdtLogo className="h-5 w-5" />}
            label="USDT"
            price={`$${prices.USDT.usd.toFixed(2)}`}
            change={prices.USDT.change24h}
            stable
            stale={!!error}
          />
        </>
      ) : null}
      {prices && (
        <span className="text-[10px] text-muted-foreground">
          {error ? "⚠️ Price data delayed" : `Updated ${secondsAgo ?? 0}s ago`}
        </span>
      )}
    </div>
  );
}

function PriceChip({
  icon,
  label,
  price,
  change,
  stable,
  stale,
}: {
  icon: React.ReactNode;
  label: string;
  price: string;
  change: number;
  stable?: boolean;
  stale?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl glass px-4 py-2.5">
      {icon}
      <div className="text-left">
        <div className="flex items-baseline gap-2">
          <span className="text-xs text-muted-foreground">{label}</span>
          <span className="font-mono text-sm font-semibold">{price}</span>
        </div>
        {stable ? (
          <span className="text-[10px] text-success">● Stable</span>
        ) : (
          <ChangeBadge change={change} />
        )}
      </div>
      {stale && <AlertTriangle className="h-3 w-3 text-warning" />}
    </div>
  );
}
