import { useState, useRef, useEffect, useCallback } from "react";
import { Bell, CheckCheck, ArrowDownToLine, ArrowUpFromLine, MessageSquare, Megaphone, XCircle, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatDate } from "@/lib/format";

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

export function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("id,type,title,message,read,link,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setNotifs(data as Notif[]);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    void load();
    const ch = supabase
      .channel(`notif:${user.id}`)
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

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unread = notifs.filter((n) => !n.read).length;

  const markAllRead = async () => {
    if (!user) return;
    const ids = notifs.filter((n) => !n.read).map((n) => n.id);
    if (!ids.length) return;
    await supabase.from("notifications").update({ read: true }).in("id", ids);
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  if (!user) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 transition hover:bg-white/10"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-gold-foreground ring-2 ring-background">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="fade-in absolute right-0 mt-2 w-[min(92vw,360px)] overflow-hidden rounded-xl glass-strong shadow-[var(--shadow-elevated)]">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Notifications</p>
              {unread > 0 && (
                <p className="text-[11px] text-muted-foreground">{unread} unread</p>
              )}
            </div>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-primary hover:bg-white/5"
              >
                <CheckCheck className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
                <Sparkles className="h-6 w-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">You're all caught up 🎉</p>
              </div>
            ) : (
              <ul className="divide-y divide-white/5">
                {notifs.map((n) => {
                  const inner = (
                    <div
                      className={`flex gap-3 px-4 py-3 transition hover:bg-white/[0.04] ${
                        !n.read ? "border-l-2 border-primary bg-primary/[0.04]" : "border-l-2 border-transparent"
                      }`}
                    >
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/5">
                        {ICON_BY_TYPE[n.type] ?? <Bell className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{n.title}</p>
                        <p className="line-clamp-2 text-xs text-muted-foreground">{n.message}</p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">{formatDate(n.created_at)}</p>
                      </div>
                    </div>
                  );
                  return (
                    <li key={n.id}>
                      {n.link ? (
                        <Link to={n.link} onClick={() => setOpen(false)} className="block">
                          {inner}
                        </Link>
                      ) : (
                        inner
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          {notifs.length >= 20 && (
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="block border-t border-white/10 px-4 py-2.5 text-center text-xs text-primary hover:bg-white/5"
            >
              View all
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
