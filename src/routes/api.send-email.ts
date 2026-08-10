import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { buildEmail, type TemplateName, type EmailVars } from "@/lib/emailTemplates";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

// Same-origin only — no wildcard CORS. The browser will send the request
// directly from the app, so no Access-Control-Allow-Origin header is needed.
const jsonHeaders = { "Content-Type": "application/json" };

const VALID_TEMPLATES: TemplateName[] = [
  "welcome",
  "login_alert",
  "deposit_submitted",
  "deposit_approved",
  "deposit_rejected",
  "withdrawal_submitted",
  "withdrawal_approved",
  "withdrawal_rejected",
];

export const Route = createFileRoute("/api/send-email")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const SUPABASE_URL = process.env.SUPABASE_URL;
          const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
          const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
          const RESEND_API_KEY = process.env.RESEND_API_KEY;

          if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
            return new Response(
              JSON.stringify({ error: "Auth not configured" }),
              { status: 500, headers: jsonHeaders }
            );
          }
          if (!LOVABLE_API_KEY || !RESEND_API_KEY) {
            return new Response(
              JSON.stringify({ error: "Email service not configured" }),
              { status: 500, headers: jsonHeaders }
            );
          }

          // ── Require valid Supabase session ────────────────────────────────
          const authHeader = request.headers.get("authorization");
          if (!authHeader?.startsWith("Bearer ")) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
              status: 401,
              headers: jsonHeaders,
            });
          }
          const token = authHeader.slice("Bearer ".length).trim();
          if (!token) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
              status: 401,
              headers: jsonHeaders,
            });
          }

          const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
            auth: { persistSession: false, autoRefreshToken: false },
          });
          const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
          const userId = claimsData?.claims?.sub as string | undefined;
          const userEmail = (claimsData?.claims?.email as string | undefined)?.toLowerCase();
          if (claimsErr || !userId) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
              status: 401,
              headers: jsonHeaders,
            });
          }

          // ── Validate input ────────────────────────────────────────────────
          const body = (await request.json().catch(() => null)) as {
            to?: string;
            template?: TemplateName;
            vars?: EmailVars;
          } | null;

          if (!body) {
            return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
              status: 400,
              headers: jsonHeaders,
            });
          }

          const { to, template, vars = {} } = body;

          if (
            !to ||
            typeof to !== "string" ||
            to.length > 254 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)
          ) {
            return new Response(JSON.stringify({ error: "Invalid recipient email" }), {
              status: 400,
              headers: jsonHeaders,
            });
          }
          if (!template || !VALID_TEMPLATES.includes(template)) {
            return new Response(JSON.stringify({ error: "Invalid template" }), {
              status: 400,
              headers: jsonHeaders,
            });
          }

          // ── Authorization: users can only email themselves; admins can email anyone ──
          // Look up admin role server-side using the user's own JWT (RLS enforced).
          const userClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
            global: { headers: { Authorization: `Bearer ${token}` } },
            auth: { persistSession: false, autoRefreshToken: false },
          });
          const { data: roleRows } = await userClient
            .from("user_roles")
            .select("role")
            .eq("user_id", userId)
            .eq("role", "admin");
          const isAdmin = (roleRows?.length ?? 0) > 0;

          if (!isAdmin && to.toLowerCase() !== userEmail) {
            return new Response(
              JSON.stringify({ error: "You can only send email to yourself" }),
              { status: 403, headers: jsonHeaders }
            );
          }

          // Cap vars size to prevent abuse via huge payloads
          if (JSON.stringify(vars).length > 4096) {
            return new Response(JSON.stringify({ error: "Payload too large" }), {
              status: 413,
              headers: jsonHeaders,
            });
          }

          const { subject, html } = buildEmail(template, vars);

          const res = await fetch(`${GATEWAY_URL}/emails`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "X-Connection-Api-Key": RESEND_API_KEY,
            },
            body: JSON.stringify({
              from: "OpulChain <onboarding@resend.dev>",
              to: [to],
              subject,
              html,
            }),
          });

          const data = await res.json().catch(() => ({}));
          const logBase = {
            template,
            recipient: to,
            userId,
            txId: (vars as EmailVars)?.txId ?? null,
          };
          if (!res.ok) {
            // Non-sensitive diagnostics only: no keys, no tokens.
            console.error("email.send.failed", {
              ...logBase,
              providerStatus: res.status,
              providerError: (data as { message?: string })?.message ?? null,
            });
            return new Response(
              JSON.stringify({
                error: "Email send failed",
                detail: (data as { message?: string })?.message ?? null,
              }),
              { status: res.status, headers: jsonHeaders }
            );
          }

          console.log("email.send.accepted", {
            ...logBase,
            providerStatus: res.status,
            providerMessageId: (data as { id?: string })?.id ?? null,
          });

          return new Response(JSON.stringify({ ok: true, id: (data as { id?: string })?.id }), {
            status: 200,
            headers: jsonHeaders,
          });

        } catch (err) {
          console.error("send-email error", err);
          return new Response(JSON.stringify({ error: "Internal error" }), {
            status: 500,
            headers: jsonHeaders,
          });
        }
      },
    },
  },
});
