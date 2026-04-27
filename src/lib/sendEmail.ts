// Client-side helper to trigger transactional emails.
// Fire-and-forget: never blocks UI on email errors.
import type { TemplateName, EmailVars } from "@/lib/emailTemplates";
import { supabase } from "@/integrations/supabase/client";

export async function sendEmail(
  to: string,
  template: TemplateName,
  vars: EmailVars = {}
): Promise<void> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      // No session — skip silently. The route requires auth.
      console.warn("sendEmail: no active session, skipping");
      return;
    }
    const res = await fetch("/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
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
