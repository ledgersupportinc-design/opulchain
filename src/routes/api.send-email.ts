import { createFileRoute } from "@tanstack/react-router";
import { buildEmail, type TemplateName, type EmailVars } from "@/lib/emailTemplates";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const VALID_TEMPLATES: TemplateName[] = [
  "welcome",
  "login_alert",
  "deposit_submitted",
  "deposit_approved",
  "withdrawal_submitted",
  "withdrawal_approved",
  "withdrawal_rejected",
];

export const Route = createFileRoute("/api/send-email")({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, { status: 204, headers: corsHeaders }),

      POST: async ({ request }) => {
        try {
          const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
          const RESEND_API_KEY = process.env.RESEND_API_KEY;
          if (!LOVABLE_API_KEY || !RESEND_API_KEY) {
            return new Response(
              JSON.stringify({ error: "Email service not configured" }),
              { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
            );
          }

          const body = (await request.json()) as {
            to?: string;
            template?: TemplateName;
            vars?: EmailVars;
          };
          const { to, template, vars = {} } = body;

          if (!to || typeof to !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
            return new Response(JSON.stringify({ error: "Invalid recipient email" }), {
              status: 400,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            });
          }
          if (!template || !VALID_TEMPLATES.includes(template)) {
            return new Response(JSON.stringify({ error: "Invalid template" }), {
              status: 400,
              headers: { "Content-Type": "application/json", ...corsHeaders },
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
          if (!res.ok) {
            console.error("Resend send failed", res.status, data);
            return new Response(
              JSON.stringify({ error: "Email send failed", details: data }),
              { status: res.status, headers: { "Content-Type": "application/json", ...corsHeaders } }
            );
          }

          return new Response(JSON.stringify({ ok: true, id: (data as any)?.id }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        } catch (err) {
          console.error("send-email error", err);
          return new Response(JSON.stringify({ error: "Internal error" }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }
      },
    },
  },
});
