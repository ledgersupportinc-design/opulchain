// Client-side helper to trigger transactional emails.
// Fire-and-forget: never blocks UI on email errors.
import type { TemplateName, EmailVars } from "@/lib/emailTemplates";

export async function sendEmail(
  to: string,
  template: TemplateName,
  vars: EmailVars = {}
): Promise<void> {
  try {
    const res = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, template, vars }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.warn("sendEmail failed", res.status, data);
    }
  } catch (err) {
    console.warn("sendEmail error", err);
  }
}
