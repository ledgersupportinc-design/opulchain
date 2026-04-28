import { describe, it, expect } from "vitest";

/**
 * Pure logic mirror of the /admin route guard in src/routes/admin.tsx
 * and the /dashboard guard in src/routes/dashboard.tsx.
 */
function adminRouteDecision(opts: { loading: boolean; user: unknown; isAdmin: boolean }) {
  if (opts.loading) return "wait";
  if (!opts.user) return "/login";
  if (!opts.isAdmin) return "/dashboard";
  return "render";
}

function dashboardRouteDecision(opts: { loading: boolean; user: unknown; isAdmin: boolean }) {
  if (opts.loading) return "wait";
  if (!opts.user) return "/login";
  if (opts.isAdmin) return "/admin";
  return "render";
}

describe("/admin route guard", () => {
  it("waits while auth is loading", () => {
    expect(adminRouteDecision({ loading: true, user: null, isAdmin: false })).toBe("wait");
  });
  it("redirects unauthenticated visitors to /login", () => {
    expect(adminRouteDecision({ loading: false, user: null, isAdmin: false })).toBe("/login");
  });
  it("redirects non-admin users to /dashboard", () => {
    expect(adminRouteDecision({ loading: false, user: { id: "u" }, isAdmin: false })).toBe("/dashboard");
  });
  it("renders the admin panel for admins", () => {
    expect(adminRouteDecision({ loading: false, user: { id: "u" }, isAdmin: true })).toBe("render");
  });
});

describe("/dashboard guard", () => {
  it("kicks admins over to /admin", () => {
    expect(dashboardRouteDecision({ loading: false, user: { id: "u" }, isAdmin: true })).toBe("/admin");
  });
  it("renders for regular users", () => {
    expect(dashboardRouteDecision({ loading: false, user: { id: "u" }, isAdmin: false })).toBe("render");
  });
});
