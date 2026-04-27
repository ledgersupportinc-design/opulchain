import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BrandLogo } from "@/components/CryptoLogos";
import { sendEmail } from "@/lib/sendEmail";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your OpulChain account" },
      { name: "description", content: "Sign up for OpulChain and start investing in Bitcoin and USDT." },
    ],
  }),
  component: SignUp,
});

const schema = z
  .object({
    fullName: z.string().trim().min(2, "Name is required").max(80),
    email: z.string().trim().email("Enter a valid email").max(255),
    password: z.string().min(8, "Password must be at least 8 characters").max(128),
    confirm: z.string(),
    agreed: z.literal(true, { message: "You must accept the terms" }),
  })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Passwords don't match" });

function SignUp() {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirm: "", agreed: false });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        fieldErrors[i.path.join(".")] = i.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: parsed.data.fullName },
      },
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    // Fire welcome email (non-blocking)
    void sendEmail(parsed.data.email, "welcome", { firstName: parsed.data.fullName });
    toast.success("Account created! Welcome to OpulChain.");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="mesh-bg" />
      <div className="relative z-10 w-full max-w-md fade-in">
        <Link to="/" className="mb-6 flex justify-center"><BrandLogo /></Link>
        <div className="rounded-2xl glass-strong p-8 shadow-[var(--shadow-elevated)]">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Start investing in minutes.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <Field label="Full Name" error={errors.fullName}>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="input-glow w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm"
                autoComplete="name"
              />
            </Field>
            <Field label="Email" error={errors.email}>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input-glow w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm"
                autoComplete="email"
              />
            </Field>
            <Field label="Password" error={errors.password}>
              <div className="relative">
                <input
                  type={show ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input-glow w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 pr-10 text-sm"
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground" aria-label="Toggle password">
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>
            <Field label="Confirm Password" error={errors.confirm}>
              <input
                type={show ? "text" : "password"}
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                className="input-glow w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm"
                autoComplete="new-password"
              />
            </Field>
            <label className="flex items-start gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={form.agreed}
                onChange={(e) => setForm({ ...form, agreed: e.target.checked })}
                className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 accent-[oklch(0.62_0.22_260)]"
              />
              <span>I agree to the <a href="#" className="text-primary hover:underline">Terms & Conditions</a></span>
            </label>
            {errors.agreed && <p className="text-xs text-destructive">{errors.agreed}</p>}
            <button type="submit" disabled={submitting} className="flex h-11 w-full items-center justify-center rounded-lg btn-primary text-sm font-semibold disabled:opacity-60">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account? <Link to="/login" className="text-primary hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
