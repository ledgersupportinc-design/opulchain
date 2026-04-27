import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BrandLogo } from "@/components/CryptoLogos";
import { sendEmail } from "@/lib/sendEmail";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in to OpulChain" },
      { name: "description", content: "Sign in to your OpulChain investor account." },
    ],
  }),
  component: Login,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(1, "Password required").max(128),
});

function Login() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const fe: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (fe[i.path.join(".")] = i.message));
      setErrors(fe);
      return;
    }
    setSubmitting(true);
    const { data: signInData, error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    // Fire login alert email (non-blocking)
    const fullName = (signInData.user?.user_metadata as { full_name?: string } | undefined)?.full_name;
    void sendEmail(parsed.data.email, "login_alert", {
      firstName: fullName,
      when: new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }),
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    });
    toast.success("Welcome back!");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="mesh-bg" />
      <div className="relative z-10 w-full max-w-md fade-in">
        <Link to="/" className="mb-6 flex justify-center"><BrandLogo /></Link>
        <div className="rounded-2xl glass-strong p-8 shadow-[var(--shadow-elevated)]">
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to access your portfolio.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input-glow w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm"
                autoComplete="email"
              />
              {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-xs font-medium text-muted-foreground">Password</label>
                <a href="#" className="text-xs text-primary hover:underline">Forgot Password?</a>
              </div>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="input-glow w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm"
                autoComplete="current-password"
              />
              {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password}</p>}
            </div>
            <button type="submit" disabled={submitting} className="flex h-11 w-full items-center justify-center rounded-lg btn-primary text-sm font-semibold disabled:opacity-60">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-white/10" />
            <span>or continue with</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>
          <button
            type="button"
            onClick={() => toast.info("Google sign-in coming soon.")}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 text-sm font-medium hover:bg-white/10"
          >
            <GoogleIcon />
            Google
          </button>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account? <Link to="/signup" className="text-primary hover:underline">Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}
