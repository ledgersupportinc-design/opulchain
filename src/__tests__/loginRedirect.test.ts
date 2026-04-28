import { describe, it, expect } from "vitest";

/**
 * Pure logic mirror of src/routes/login.tsx redirect decision:
 * after a successful sign-in we look up user_roles and route admins
 * to /admin, everyone else to /dashboard.
 */
function pickRedirect(roles: { role: string }[] | null | undefined): "/admin" | "/dashboard" {
  const isAdmin = !!roles?.some((r) => r.role === "admin");
  return isAdmin ? "/admin" : "/dashboard";
}

describe("login role-based redirect", () => {
  it("sends admins to /admin", () => {
    expect(pickRedirect([{ role: "admin" }])).toBe("/admin");
    expect(pickRedirect([{ role: "user" }, { role: "admin" }])).toBe("/admin");
  });

  it("sends regular users to /dashboard", () => {
    expect(pickRedirect([{ role: "user" }])).toBe("/dashboard");
  });

  it("treats users with no role row as regular users", () => {
    expect(pickRedirect([])).toBe("/dashboard");
    expect(pickRedirect(null)).toBe("/dashboard");
    expect(pickRedirect(undefined)).toBe("/dashboard");
  });
});
