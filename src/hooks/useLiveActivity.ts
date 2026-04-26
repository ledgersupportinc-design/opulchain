import { useEffect, useState } from "react";
import { liveActivityData, type ActivityEntry } from "@/lib/liveActivityData";

export interface LiveActivityItem extends ActivityEntry {
  id: string;
  agoSec: number; // seconds since the entry "happened" (for relative time display)
}

const MAX_ITEMS = 6;

function pickNext(prevName: string | undefined): ActivityEntry {
  // Pick a random entry that's not the same name as the previous one
  let candidate = liveActivityData[Math.floor(Math.random() * liveActivityData.length)];
  let safety = 0;
  while (candidate.name === prevName && safety < 8) {
    candidate = liveActivityData[Math.floor(Math.random() * liveActivityData.length)];
    safety++;
  }
  return candidate;
}

function randomDelayMs(): number {
  // 4–7 seconds, randomized
  return 4000 + Math.floor(Math.random() * 3000);
}

export function useLiveActivity(): LiveActivityItem[] {
  const [items, setItems] = useState<LiveActivityItem[]>(() => {
    // Seed with 4 staggered entries so the feed is never empty
    const seed: LiveActivityItem[] = [];
    let prevName: string | undefined;
    for (let i = 0; i < 4; i++) {
      const e = pickNext(prevName);
      prevName = e.name;
      seed.push({
        ...e,
        id: `seed-${i}-${Math.random().toString(36).slice(2, 8)}`,
        agoSec: i * 45 + Math.floor(Math.random() * 30),
      });
    }
    return seed;
  });

  // Push a new entry every 4–7s
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const schedule = () => {
      timeoutId = setTimeout(() => {
        setItems((prev) => {
          const next = pickNext(prev[0]?.name);
          const newItem: LiveActivityItem = {
            ...next,
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            agoSec: 0,
          };
          return [newItem, ...prev].slice(0, MAX_ITEMS);
        });
        schedule();
      }, randomDelayMs());
    };
    schedule();
    return () => clearTimeout(timeoutId);
  }, []);

  // Tick relative ages every 30s
  useEffect(() => {
    const id = setInterval(() => {
      setItems((prev) => prev.map((it) => ({ ...it, agoSec: it.agoSec + 30 })));
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  return items;
}

export function formatAgo(sec: number): string {
  if (sec < 30) return "Just now";
  if (sec < 90) return "1 min ago";
  if (sec < 60 * 60) return `${Math.round(sec / 60)} mins ago`;
  if (sec < 60 * 60 * 2) return "1 hour ago";
  return `${Math.round(sec / 3600)} hours ago`;
}
