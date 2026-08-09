// Branded OpulChain email templates — dark navy bg, gold accent, white card
// Usage: build({ subject, preheader, heading, body, ctaLabel, ctaUrl })

export type EmailVars = {
  firstName?: string | null;
  amount?: number | string;
  asset?: "BTC" | "USDT" | string;
  walletAddress?: string;
  reason?: string;
  ip?: string;
  userAgent?: string;
  when?: string;
  /** Transaction reference id */
  txId?: string;
  /** Human readable transaction date */
  date?: string;
};

const DASHBOARD_URL =
  (typeof process !== "undefined" && (process as any).env?.PUBLIC_APP_URL) ||
  "https://opulchain.lovable.app/dashboard";

const BRAND = {
  navy: "#0B1220",
  card: "#ffffff",
  cardText: "#1f2937",
  muted: "#6b7280",
  gold: "#D4AF37",
  goldDark: "#a8861f",
  border: "#1f2a44",
};

const fontStack =
  "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

function shell(opts: {
  preheader: string;
  heading: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
}) {
  const { preheader, heading, bodyHtml, ctaLabel, ctaUrl } = opts;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>OpulChain</title>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet" />
</head>
<body style="margin:0;padding:0;background:${BRAND.navy};font-family:${fontStack};">
  <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all;">${preheader}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.navy};padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">
        <tr><td align="center" style="padding-bottom:24px;">
          <div style="display:inline-flex;align-items:center;gap:10px;color:${BRAND.gold};font-family:${fontStack};font-weight:700;font-size:22px;letter-spacing:0.5px;">
            <span style="display:inline-block;width:28px;height:28px;border-radius:8px;background:${BRAND.gold};color:${BRAND.navy};text-align:center;line-height:28px;font-size:16px;">◆</span>
            OpulChain
          </div>
        </td></tr>
        <tr><td style="background:${BRAND.card};border-radius:16px;padding:36px 32px;color:${BRAND.cardText};box-shadow:0 8px 32px rgba(0,0,0,0.3);">
          <h1 style="margin:0 0 16px;font-family:${fontStack};font-size:24px;font-weight:700;color:#111827;">${heading}</h1>
          <div style="font-family:${fontStack};font-size:15px;line-height:1.6;color:${BRAND.cardText};">
            ${bodyHtml}
          </div>
          ${
            ctaLabel && ctaUrl
              ? `<div style="margin-top:28px;text-align:center;">
                   <a href="${ctaUrl}" style="display:inline-block;background:${BRAND.gold};color:${BRAND.navy};text-decoration:none;font-weight:700;font-size:14px;padding:13px 28px;border-radius:10px;font-family:${fontStack};">${ctaLabel}</a>
                 </div>`
              : ""
          }
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0 20px;" />
          <p style="margin:0;font-size:12px;color:${BRAND.muted};font-family:${fontStack};">
            Need help? Contact our support team from your dashboard.
          </p>
        </td></tr>
        <tr><td align="center" style="padding-top:20px;font-family:${fontStack};font-size:12px;color:#7a869a;">
          © 2026 OpulChain. All rights reserved.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const greet = (n?: string | null) =>
  n && n.trim() ? `Hi ${esc(n.trim().split(/\s+/)[0])},` : `Hi there,`;

const fmt = (a: number | string | undefined, asset?: string) =>
  a === undefined ? "" : `${esc(a)}${asset ? " " + esc(asset) : ""}`;

/** Renders a transaction details table (type, amount, ref, date, status). */
function details(
  kind: "Deposit" | "Withdrawal",
  status: "Pending" | "Approved" | "Rejected",
  vars: EmailVars
) {
  const row = (label: string, value?: string) =>
    value
      ? `<tr><td style="padding:6px 0;color:${BRAND.muted};font-size:13px;">${esc(label)}</td><td style="padding:6px 0;text-align:right;font-size:13px;color:${BRAND.cardText};word-break:break-all;">${value}</td></tr>`
      : "";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:20px;border-top:1px solid #e5e7eb;">
    ${row("Type", esc(kind))}
    ${row("Status", esc(status))}
    ${row("Amount", vars.amount !== undefined ? `<strong>${fmt(vars.amount, vars.asset)}</strong>` : undefined)}
    ${row("Currency", vars.asset ? esc(vars.asset) : undefined)}
    ${row("Reference ID", vars.txId ? `<span style="font-family:monospace;">${esc(vars.txId)}</span>` : undefined)}
    ${row("Date", vars.date ? esc(vars.date) : undefined)}
    ${row("Destination", vars.walletAddress ? `<span style="font-family:monospace;">${esc(vars.walletAddress)}</span>` : undefined)}
  </table>`;
}

export type TemplateName =
  | "welcome"
  | "login_alert"
  | "deposit_submitted"
  | "deposit_approved"
  | "deposit_rejected"
  | "withdrawal_submitted"
  | "withdrawal_approved"
  | "withdrawal_rejected";

export function buildEmail(name: TemplateName, vars: EmailVars) {
  const cta = { ctaLabel: "Go to Dashboard", ctaUrl: DASHBOARD_URL };


  switch (name) {
    case "welcome":
      return {
        subject: "Welcome to OpulChain",
        html: shell({
          preheader: "Your OpulChain account is ready.",
          heading: "Welcome to OpulChain",
          bodyHtml: `
            <p>${greet(vars.firstName)}</p>
            <p>Your OpulChain account is ready. You can now deposit BTC or USDT and start growing your portfolio with institutional-grade tools.</p>
            <p>If you have questions, our support team is one click away.</p>`,
          ...cta,
        }),
      };

    case "login_alert":
      return {
        subject: "New sign-in to your OpulChain account",
        html: shell({
          preheader: "We detected a new sign-in to your account.",
          heading: "New sign-in detected",
          bodyHtml: `
            <p>${greet(vars.firstName)}</p>
            <p>We're letting you know that your OpulChain account was just signed in to.</p>
            ${vars.when ? `<p style="margin:6px 0;"><strong>Time:</strong> ${esc(vars.when)}</p>` : ""}
            ${vars.ip ? `<p style="margin:6px 0;"><strong>IP:</strong> ${esc(vars.ip)}</p>` : ""}
            ${vars.userAgent ? `<p style="margin:6px 0;"><strong>Device:</strong> ${esc(vars.userAgent)}</p>` : ""}
            <p>If this was you, no action is needed. If you don't recognize this activity, please reset your password immediately.</p>`,
          ...cta,
        }),
      };

    case "deposit_submitted":
      return {
        subject: "Deposit request received — pending review",
        html: shell({
          preheader: "We've received your deposit request.",
          heading: "Deposit pending review",
          bodyHtml: `
            <p>${greet(vars.firstName)}</p>
            <p>We've received your deposit request for <strong>${fmt(vars.amount, vars.asset)}</strong>. It is currently <strong>pending</strong> review. Once your transaction is confirmed on-chain, we'll credit your balance — usually within 24 hours.</p>
            ${details("Deposit", "Pending", vars)}`,
          ...cta,
        }),
      };

    case "deposit_approved":
      return {
        subject: "Deposit approved & credited",
        html: shell({
          preheader: "Your deposit has been credited to your account.",
          heading: "Deposit approved",
          bodyHtml: `
            <p>${greet(vars.firstName)}</p>
            <p>Good news — your deposit of <strong>${fmt(vars.amount, vars.asset)}</strong> has been approved and credited to your OpulChain wallet.</p>
            ${details("Deposit", "Approved", vars)}`,
          ...cta,
        }),
      };

    case "deposit_rejected":
      return {
        subject: "Deposit request not approved",
        html: shell({
          preheader: "Action needed on your deposit request.",
          heading: "Deposit not approved",
          bodyHtml: `
            <p>${greet(vars.firstName)}</p>
            <p>Unfortunately, your deposit of <strong>${fmt(vars.amount, vars.asset)}</strong> was not approved.</p>
            ${vars.reason ? `<p style="background:#fef2f2;border-left:3px solid #dc2626;padding:10px 12px;margin:16px 0;"><strong>Reason:</strong> ${esc(vars.reason)}</p>` : ""}
            ${details("Deposit", "Rejected", vars)}
            <p>Please contact support if you have any questions.</p>`,
          ...cta,
        }),
      };

    case "withdrawal_submitted":
      return {
        subject: "Withdrawal request received — pending review",
        html: shell({
          preheader: "Your withdrawal request is being reviewed.",
          heading: "Withdrawal pending review",
          bodyHtml: `
            <p>${greet(vars.firstName)}</p>
            <p>We've received your withdrawal request for <strong>${fmt(vars.amount, vars.asset)}</strong>. It is currently <strong>pending</strong> review by our team.</p>
            ${details("Withdrawal", "Pending", vars)}`,
          ...cta,
        }),
      };

    case "withdrawal_approved":
      return {
        subject: "Withdrawal processed",
        html: shell({
          preheader: "Your withdrawal has been sent.",
          heading: "Withdrawal processed",
          bodyHtml: `
            <p>${greet(vars.firstName)}</p>
            <p>Your withdrawal of <strong>${fmt(vars.amount, vars.asset)}</strong> has been approved and sent to your wallet.</p>
            ${details("Withdrawal", "Approved", vars)}
            <p>Please allow a short time for network confirmation.</p>`,
          ...cta,
        }),
      };

    case "withdrawal_rejected":
      return {
        subject: "Withdrawal request not approved",
        html: shell({
          preheader: "Action needed on your withdrawal request.",
          heading: "Withdrawal not approved",
          bodyHtml: `
            <p>${greet(vars.firstName)}</p>
            <p>Unfortunately, your withdrawal request for <strong>${fmt(vars.amount, vars.asset)}</strong> was not approved.</p>
            ${vars.reason ? `<p style="background:#fef2f2;border-left:3px solid #dc2626;padding:10px 12px;margin:16px 0;"><strong>Reason:</strong> ${esc(vars.reason)}</p>` : ""}
            ${details("Withdrawal", "Rejected", vars)}
            <p>Please contact support if you have any questions or would like to try again.</p>`,
          ...cta,
        }),
      };
  }

      };
  }
}
