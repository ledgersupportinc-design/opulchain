import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Bell, CheckCheck, Loader2, Sparkles, ArrowDownToLine, ArrowUpFromLine, MessageSquare, Megaphone, XCircle, ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — OpulChain" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NotificationsPage,
});

interface Notif {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  link: string | null;
  created_at: string;
}

const ICON_BY_TYPE: Record<string, React.ReactNode> = {
  deposit_approved: <ArrowDownToLine className="h-4 w-4 text-success" />,
  withdrawal_processed: <ArrowUpFromLine className="h-4 w-4 text-primary" />,
  withdrawal_rejected: <XCircle className="h-4 w-4 text-destructive" />,
  support_reply: <MessageSquare className="h-4 w-4 text-primary" />,
  announcement: <Megaphone className="h-4 w-4 text-gold" />,
};

function NotificationsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Notif[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  const load = useCallback(async () => {
    if (!user) return;
    setFetching(true);
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setItems((data as Notif[]) ?? []);
    setFetching(false);
  }, [user]);

  useEffect(() => {
    void load();
    if (!user) return;
    const ch = supabase
      .channel(`notif-page:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, load]);

  const markAllRead = async () => {
    if (!user) return;
    const ids = items.filter((n) => !n.read).map((n) => n.id);
    if (!ids.length) return;
    await supabase.from("notifications").update({ read: true }).in("id", ids);
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const unread = items.filter((n) => !n.read).length;

  return (
    <div className="relative min-h-screen">
      <Navbar />
      <main className="relative z-10 mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <Link to="/dashboard" className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> Back to dashboard
        </Link>
        <div className="mb-6 flex items-end justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary ring-1 ring-primary/30">
              <Bell className="h-3 w-3" /> Notifications
            </div>
            <h1 className="mt-3 font-display text-2xl font-bold sm:text-3xl">All Notifications</h1>
            <p className="mt-1 text-sm text-muted-foreground">{unread > 0 ? `${unread} unread` : "All caught up."}</p>
          </div>
          {unread > 0 && (
            <button
              onClick={markAllRead}
              className="inline-flex items-center gap-1 rounded-md border border-white/10 px-3 py-1.5 text-xs hover:bg-white/5"
            >
              <CheckCheck className="h-3 w-3" /> Mark all read
            </button>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl glass">
          {fetching ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
              <Sparkles className="h-7 w-7 text-muted-foreground" />
              <p className="text-sm font-semibold">You're all caught up 🎉</p>
              <p className="text-xs text-muted-foreground">New activity will appear here in real time.</p>
            </div>
          ) : (
            <ul className="divide-y divide-white/5">
              {items.map((n) => {
                const inner = (
                  <div
                    className={`flex gap-3 px-4 py-4 transition hover:bg-white/[0.04] sm:px-5 ${
                      !n.read ? "border-l-2 border-primary bg-primary/[0.04]" : "border-l-2 border-transparent"
                    }`}
                  >
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5">
                      {ICON_BY_TYPE[n.type] ?? <Bell className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="text-xs text-muted-foreground">{n.message}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">{formatDate(n.created_at)}</p>
                    </div>
                  </div>
                );
                return (
                  <li key={n.id}>
                    {n.link ? <Link to={n.link}>{inner}</Link> : inner}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
