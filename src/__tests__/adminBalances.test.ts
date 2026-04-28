import { describe, it, expect } from "vitest";

/**
 * Pure logic mirror of UsersTab.load() in src/routes/admin.tsx:
 * we fetch profiles + wallets independently and merge them by user id.
 */
interface Profile { id: string; email: string; full_name: string | null; created_at: string }
interface Wallet { user_id: string; btc_balance: number | string; usdt_balance: number | string }
interface UserRow {
  id: string; email: string; full_name: string | null; created_at: string;
  btc_balance: number; usdt_balance: number;
}

function mergeUsers(profiles: Profile[], wallets: Wallet[]): UserRow[] {
  return profiles.map((p) => {
    const w = wallets.find((x) => x.user_id === p.id);
    return {
      id: p.id,
      email: p.email,
      full_name: p.full_name,
      created_at: p.created_at,
      btc_balance: Number(w?.btc_balance ?? 0),
      usdt_balance: Number(w?.usdt_balance ?? 0),
    };
  });
}

const profiles: Profile[] = [
  { id: "u1", email: "admin@example.com", full_name: "Admin", created_at: "2026-01-01" },
  { id: "u2", email: "alice@example.com", full_name: "Alice", created_at: "2026-01-02" },
  { id: "u3", email: "bob@example.com", full_name: null, created_at: "2026-01-03" },
];

const wallets: Wallet[] = [
  { user_id: "u1", btc_balance: "126.00000000", usdt_balance: "900000.00000000" },
  { user_id: "u2", btc_balance: 1, usdt_balance: 0 },
  // u3 intentionally missing — should default to 0/0
];

describe("admin Users tab balance merge", () => {
  const rows = mergeUsers(profiles, wallets);

  it("returns one row per profile", () => {
    expect(rows).toHaveLength(profiles.length);
  });

  it("populates balances from the wallets table for matched users", () => {
    const admin = rows.find((r) => r.id === "u1")!;
    expect(admin.btc_balance).toBe(126);
    expect(admin.usdt_balance).toBe(900000);

    const alice = rows.find((r) => r.id === "u2")!;
    expect(alice.btc_balance).toBe(1);
    expect(alice.usdt_balance).toBe(0);
  });

  it("falls back to zero balances when a wallet row is missing", () => {
    const bob = rows.find((r) => r.id === "u3")!;
    expect(bob.btc_balance).toBe(0);
    expect(bob.usdt_balance).toBe(0);
  });

  it("never returns NaN in numeric balance fields", () => {
    for (const r of rows) {
      expect(Number.isNaN(r.btc_balance)).toBe(false);
      expect(Number.isNaN(r.usdt_balance)).toBe(false);
    }
  });
});
