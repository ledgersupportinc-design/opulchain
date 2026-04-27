// Custom Cloudflare Worker entry that wraps the TanStack Start handler
// to inject baseline security headers on every response.
import startEntry from "@tanstack/react-start/server-entry";

const SECURITY_HEADERS: Record<string, string> = {
  // Prevent clickjacking — app is never meant to be framed.
  "X-Frame-Options": "DENY",
  // Stop MIME-type sniffing.
  "X-Content-Type-Options": "nosniff",
  // Limit referrer leakage.
  "Referrer-Policy": "strict-origin-when-cross-origin",
  // Conservative permissions policy.
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  // Strict transport security (HTTPS only). Lovable hosts on HTTPS, so this is safe.
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  // Content Security Policy — broad enough to keep Vite/SSR + Supabase + Resend gateway working.
  // 'unsafe-inline' for styles is required by Tailwind utility classes inlined at runtime.
  // 'unsafe-inline' for scripts is required by TanStack Start's hydration script tag.
  "Content-Security-Policy": [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https:",
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.gpteng.co",
    "connect-src 'self' https://*.supabase.co https://*.lovable.dev https://*.lovable.app wss://*.supabase.co",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; "),
};

export default {
  async fetch(request: Request, env: unknown, ctx: unknown): Promise<Response> {
    const res = await (startEntry as { fetch: (req: Request, env: unknown, ctx: unknown) => Promise<Response> })
      .fetch(request, env, ctx);

    // Clone headers so we can mutate them (Response headers are immutable).
    const headers = new Headers(res.headers);
    for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
      if (!headers.has(k)) headers.set(k, v);
    }

    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers,
    });
  },
};
