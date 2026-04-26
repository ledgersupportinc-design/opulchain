import { useEffect, useState, useCallback, useRef } from "react";

/**
 * Live BTC + USDT prices from CoinGecko.
 * Cached at module level for 60s so multiple consumers share the same fetch.
 */

export interface CryptoPriceEntry {
  usd: number;
  change24h: number;
}

export interface CryptoPrices {
  BTC: CryptoPriceEntry;
  USDT: CryptoPriceEntry;
}

interface CacheShape {
  data: CryptoPrices | null;
  fetchedAt: number; // ms epoch
  inflight: Promise<CryptoPrices | null> | null;
  lastError: string | null;
}

const cache: CacheShape = {
  data: null,
  fetchedAt: 0,
  inflight: null,
  lastError: null,
};

const TTL_MS = 60_000;
const COINGECKO_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,tether&vs_currencies=usd&include_24hr_change=true";

async function fetchPrices(): Promise<CryptoPrices | null> {
  try {
    const res = await fetch(COINGECKO_URL, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
    const json = (await res.json()) as {
      bitcoin?: { usd?: number; usd_24h_change?: number };
      tether?: { usd?: number; usd_24h_change?: number };
    };
    const data: CryptoPrices = {
      BTC: {
        usd: Number(json.bitcoin?.usd ?? 0),
        change24h: Number(json.bitcoin?.usd_24h_change ?? 0),
      },
      USDT: {
        usd: Number(json.tether?.usd ?? 1),
        change24h: Number(json.tether?.usd_24h_change ?? 0),
      },
    };
    cache.data = data;
    cache.fetchedAt = Date.now();
    cache.lastError = null;
    return data;
  } catch (err) {
    cache.lastError = err instanceof Error ? err.message : "Failed to load prices";
    return cache.data; // return last known
  }
}

function getOrFetch(): Promise<CryptoPrices | null> {
  const fresh = cache.data && Date.now() - cache.fetchedAt < TTL_MS;
  if (fresh) return Promise.resolve(cache.data);
  if (cache.inflight) return cache.inflight;
  cache.inflight = fetchPrices().finally(() => {
    cache.inflight = null;
  });
  return cache.inflight;
}

export function useCryptoPrices(refreshInterval = 60_000) {
  const [prices, setPrices] = useState<CryptoPrices | null>(cache.data);
  const [loading, setLoading] = useState<boolean>(!cache.data);
  const [error, setError] = useState<string | null>(cache.lastError);
  const [fetchedAt, setFetchedAt] = useState<number>(cache.fetchedAt);
  const [now, setNow] = useState<number>(Date.now());
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    setLoading(!cache.data);
    const data = await getOrFetch();
    if (!mounted.current) return;
    setPrices(data);
    setFetchedAt(cache.fetchedAt);
    setError(cache.lastError);
    setLoading(false);
  }, []);

  useEffect(() => {
    mounted.current = true;
    void refresh();
    const id = setInterval(() => {
      void refresh();
    }, refreshInterval);
    const tickId = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      mounted.current = false;
      clearInterval(id);
      clearInterval(tickId);
    };
  }, [refresh, refreshInterval]);

  const secondsAgo = fetchedAt ? Math.max(0, Math.floor((now - fetchedAt) / 1000)) : null;

  return { prices, loading, error, refresh, fetchedAt, secondsAgo };
}
