import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Role = "admin" | "user";
type QueryResult<T> = { data: T | null; error: { code?: string; message?: string } | null };

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function withSchemaRetry<T>(query: () => Promise<QueryResult<T>>, attempts = 4) {
  let result = await query();
  for (let i = 1; result.error?.code === "PGRST002" && i < attempts; i += 1) {
    await wait(350 * i);
    result = await query();
  }
  return result;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  role: Role | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  const loadRole = async (userId: string | undefined) => {
    if (!userId) {
      setRole(null);
      return;
    }
    const { data: appUser, error: appUserError } = await withSchemaRetry(() => supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .maybeSingle());
    if (appUserError || !appUser) {
      setRole(null);
      return;
    }

    const { data } = await withSchemaRetry(() => supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId));
    if (data && data.some((r) => r.role === "admin")) {
      setRole("admin");
    } else if (data && data.length > 0) {
      setRole("user");
    } else {
      setRole(null);
    }
  };

  useEffect(() => {
    // Set up listener FIRST, then fetch session.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      // Defer role lookup so we don't block the auth callback.
      if (newSession?.user) {
        setTimeout(() => loadRole(newSession.user.id), 0);
      } else {
        setRole(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        loadRole(s.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const value: AuthContextValue = {
    session,
    user,
    role,
    loading,
    isAdmin: role === "admin",
    signOut: async () => {
      await supabase.auth.signOut();
    },
    refreshRole: async () => loadRole(user?.id),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
