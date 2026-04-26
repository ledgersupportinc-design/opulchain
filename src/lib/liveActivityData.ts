// 40+ pre-written realistic-looking activity entries.
// Names span multiple regions (Africa, Asia, Europe, Americas, Middle East).
// Amounts are intentionally non-round to feel real.

export type ActivityAction = "deposited" | "withdrew";
export type ActivityAsset = "BTC" | "USDT";

export interface ActivityEntry {
  name: string;
  action: ActivityAction;
  asset: ActivityAsset;
  amount: number; // BTC: 0.05–3.2; USDT: 500–25000
}

export const liveActivityData: ActivityEntry[] = [
  { name: "Baron K.",  action: "deposited", asset: "BTC",  amount: 0.42 },
  { name: "Amara S.",  action: "withdrew",  asset: "USDT", amount: 3200 },
  { name: "James W.",  action: "deposited", asset: "BTC",  amount: 1.18 },
  { name: "Liu F.",    action: "deposited", asset: "USDT", amount: 12500 },
  { name: "Emeka T.",  action: "withdrew",  asset: "BTC",  amount: 0.75 },
  { name: "Sofia R.",  action: "deposited", asset: "USDT", amount: 815 },
  { name: "David M.",  action: "deposited", asset: "BTC",  amount: 2.34 },
  { name: "Fatima A.", action: "withdrew",  asset: "USDT", amount: 5040 },
  { name: "Chen L.",   action: "deposited", asset: "BTC",  amount: 0.087 },
  { name: "Olivia P.", action: "deposited", asset: "USDT", amount: 1450 },
  { name: "Ibrahim K.",action: "withdrew",  asset: "BTC",  amount: 0.213 },
  { name: "Yusuf B.",  action: "deposited", asset: "USDT", amount: 7625 },
  { name: "Mei W.",    action: "deposited", asset: "BTC",  amount: 0.561 },
  { name: "Lucas G.",  action: "withdrew",  asset: "USDT", amount: 9180 },
  { name: "Priya N.",  action: "deposited", asset: "BTC",  amount: 0.094 },
  { name: "Ahmed R.",  action: "deposited", asset: "USDT", amount: 2240 },
  { name: "Nadia E.",  action: "withdrew",  asset: "BTC",  amount: 1.045 },
  { name: "Kenji T.",  action: "deposited", asset: "USDT", amount: 18750 },
  { name: "Hannah B.", action: "deposited", asset: "BTC",  amount: 0.276 },
  { name: "Rafael C.", action: "withdrew",  asset: "USDT", amount: 640 },
  { name: "Zoe H.",    action: "deposited", asset: "BTC",  amount: 0.158 },
  { name: "Tariq M.",  action: "deposited", asset: "USDT", amount: 4380 },
  { name: "Isla F.",   action: "withdrew",  asset: "BTC",  amount: 0.382 },
  { name: "Gabriel O.",action: "deposited", asset: "USDT", amount: 11240 },
  { name: "Aisha L.",  action: "deposited", asset: "BTC",  amount: 0.067 },
  { name: "Marcus J.", action: "withdrew",  asset: "USDT", amount: 2890 },
  { name: "Hiroko S.", action: "deposited", asset: "BTC",  amount: 0.945 },
  { name: "Anders V.", action: "deposited", asset: "USDT", amount: 6700 },
  { name: "Naledi M.", action: "withdrew",  asset: "BTC",  amount: 0.117 },
  { name: "Diego A.",  action: "deposited", asset: "USDT", amount: 23900 },
  { name: "Kwame O.",  action: "deposited", asset: "BTC",  amount: 1.872 },
  { name: "Elena V.",  action: "withdrew",  asset: "USDT", amount: 1075 },
  { name: "Noah C.",   action: "deposited", asset: "BTC",  amount: 0.298 },
  { name: "Anika R.",  action: "deposited", asset: "USDT", amount: 540 },
  { name: "Pieter D.", action: "withdrew",  asset: "BTC",  amount: 0.633 },
  { name: "Layla H.",  action: "deposited", asset: "USDT", amount: 8920 },
  { name: "Tomás E.",  action: "deposited", asset: "BTC",  amount: 0.052 },
  { name: "Yara N.",   action: "withdrew",  asset: "USDT", amount: 14600 },
  { name: "Henrik L.", action: "deposited", asset: "BTC",  amount: 0.482 },
  { name: "Camille B.",action: "deposited", asset: "USDT", amount: 3120 },
  { name: "Ravi S.",   action: "withdrew",  asset: "BTC",  amount: 2.105 },
  { name: "Bisi A.",   action: "deposited", asset: "USDT", amount: 21450 },
  { name: "Arjun P.",  action: "deposited", asset: "BTC",  amount: 0.169 },
  { name: "Maya O.",   action: "withdrew",  asset: "USDT", amount: 690 },
  { name: "Leo K.",    action: "deposited", asset: "BTC",  amount: 0.741 },
];
