// Display-only conversion rates. Honest static reference values, NOT a live ticker.
// Used to show an approximate USD value next to balances.
export const REFERENCE_USD_RATES = {
  BTC: 65000,
  USDT: 1,
} as const;

export function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCrypto(value: number, asset: "BTC" | "USDT"): string {
  const decimals = asset === "BTC" ? 8 : 2;
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals,
  });
}

export function toUsd(amount: number, asset: "BTC" | "USDT"): number {
  return amount * REFERENCE_USD_RATES[asset];
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
