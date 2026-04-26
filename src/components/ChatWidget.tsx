import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "@tanstack/react-router";

interface ChatMessage {
  id: string;
  user_id: string;
  sender: "user" | "admin";
  message: string;
  read: boolean;
  created_at: string;
}

const GREETED_KEY = "opulchain_chat_greeted";
const WELCOME_TEXT =
  "👋 Welcome to OpulChain! I'm here to help you with deposits, withdrawals, or any questions about your account. How can I assist you today?";

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function ChatWidget() {
  const { user, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false); // controls slide animation
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [unread, setUnread] = useState(0);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false); // show "Support is typing…"
  const [showGreeting, setShowGreeting] = useState(false); // welcome bubble for guests
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastAdminIdRef = useRef<string | null>(null);

  // Hide widget for admins
  const visible = !isAdmin;

  // Auto-welcome on first visit (any page) — pulse + auto-open after 2.5s
  useEffect(() => {
    if (!visible) return;
    if (typeof window === "undefined") return;
    const greeted = window.localStorage.getItem(GREETED_KEY);
    if (greeted) return;
    const t = setTimeout(() => {
      setOpen(true);
      setShowGreeting(true);
      window.localStorage.setItem(GREETED_KEY, "1");
    }, 2500);
    return () => clearTimeout(t);
  }, [visible]);

  // Drive open/close animation
  useEffect(() => {
    if (open) {
      setMounted(true);
    } else {
      const t = setTimeout(() => setMounted(false), 220);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Load messages + subscribe
  useEffect(() => {
    if (!user || isAdmin) return;
    let cancelled = false;

    const load = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      if (cancelled || !data) return;
      const list = data as ChatMessage[];
      setMessages(list);
      setUnread(list.filter((m) => m.sender === "admin" && !m.read).length);
      const lastAdmin = [...list].reverse().find((m) => m.sender === "admin");
      lastAdminIdRef.current = lastAdmin?.id ?? null;
    };
    load();

    const channel = supabase
      .channel(`chat:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const msg = payload.new as ChatMessage;
          setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
          if (msg.sender === "admin") {
            setTyping(false);
            if (!open) setUnread((u) => u + 1);
            lastAdminIdRef.current = msg.id;
          }
        },
      )
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [user, isAdmin, open]);

  // Auto-scroll on new messages / open
  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [open, messages.length, typing, showGreeting]);

  // Mark admin messages read on open
  useEffect(() => {
    if (!open || !user) return;
    const unreadIds = messages.filter((m) => m.sender === "admin" && !m.read).map((m) => m.id);
    if (unreadIds.length === 0) return;
    supabase.from("chat_messages").update({ read: true }).in("id", unreadIds).then(() => setUnread(0));
  }, [open, messages, user]);

  if (!visible) return null;

  const send = async () => {
    if (!user) return;
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    const { error } = await supabase.from("chat_messages").insert({
      user_id: user.id, sender: "user", message: text,
    });
    if (!error) {
      setInput("");
      // Show typing indicator briefly after user sends — purely UX, cleared on real reply
      setTyping(true);
      setTimeout(() => setTyping(false), 2000);
    }
    setSending(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Open support chat"
        className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full btn-primary sm:bottom-6 sm:right-6"
        style={{
          boxShadow: open ? undefined : "0 0 0 0 oklch(0.66 0.22 255 / 0.6), 0 12px 32px -10px oklch(0.66 0.22 255 / 0.55)",
          animation: open ? undefined : "chat-pulse 2.4s ease-out infinite",
        }}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {unread > 0 && !open && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[11px] font-bold text-[oklch(0.18_0.04_265)] ring-2 ring-background">
            {unread}
          </span>
        )}
        <style>{`
          @keyframes chat-pulse {
            0%   { box-shadow: 0 0 0 0 oklch(0.66 0.22 255 / 0.55), 0 12px 32px -10px oklch(0.66 0.22 255 / 0.55); }
            70%  { box-shadow: 0 0 0 14px oklch(0.66 0.22 255 / 0), 0 12px 32px -10px oklch(0.66 0.22 255 / 0.55); }
            100% { box-shadow: 0 0 0 0   oklch(0.66 0.22 255 / 0),  0 12px 32px -10px oklch(0.66 0.22 255 / 0.55); }
          }
          @keyframes chat-slide-up {
            from { opacity: 0; transform: translateY(12px) scale(0.98); }
            to   { opacity: 1; transform: translateY(0)    scale(1); }
          }
          @keyframes chat-slide-down {
            from { opacity: 1; transform: translateY(0)    scale(1); }
            to   { opacity: 0; transform: translateY(12px) scale(0.98); }
          }
          @keyframes typing-bounce {
            0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
            40%           { transform: translateY(-4px); opacity: 1; }
          }
        `}</style>
      </button>

      {mounted && (
        <div
          className="fixed bottom-20 right-3 z-50 flex h-[28rem] w-[calc(100vw-1.5rem)] max-w-[22rem] flex-col overflow-hidden rounded-2xl glass-strong shadow-[var(--shadow-elevated)] sm:bottom-24 sm:right-6 sm:w-[22rem]"
          style={{
            animation: `${open ? "chat-slide-up" : "chat-slide-down"} 220ms ease-out forwards`,
          }}
        >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Headphones className="h-5 w-5 text-primary" />
                <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-success ring-2 ring-card" />
              </div>
              <div>
                <p className="text-sm font-semibold">OpulChain Support</p>
                <p className="flex items-center gap-1 text-[11px] text-success">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" /> Online
                </p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-md p-1 hover:bg-white/10" aria-label="Close chat">
              <X className="h-4 w-4" />
            </button>
          </div>

          {!user ? (
            <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
              {/* Always show the warm welcome bubble for guests */}
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl bg-white/10 px-3 py-2 text-sm">
                  {WELCOME_TEXT}
                  <div className="mt-1 text-[10px] opacity-60">Just now</div>
                </div>
              </div>
              <div className="mt-auto rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                <p className="text-xs text-muted-foreground">
                  Please sign in so we can connect you with our support team.
                </p>
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="mt-2 inline-flex rounded-lg btn-primary px-4 py-2 text-xs font-medium"
                >
                  Sign In to Chat
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
                {(showGreeting || messages.length === 0) && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-2xl bg-white/10 px-3 py-2 text-sm">
                      {WELCOME_TEXT}
                      <div className="mt-1 text-[10px] opacity-60">Just now</div>
                    </div>
                  </div>
                )}
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                        m.sender === "user" ? "bg-primary text-primary-foreground" : "bg-white/10 text-foreground"
                      }`}
                    >
                      {m.message}
                      <div className="mt-1 text-[10px] opacity-60">{formatTime(m.created_at)}</div>
                    </div>
                  </div>
                ))}
                {typing && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-1 rounded-2xl bg-white/10 px-3 py-2.5 text-sm">
                      <span className="text-[11px] text-muted-foreground">Support is typing</span>
                      <span className="ml-1 inline-flex gap-0.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" style={{ animation: "typing-bounce 1.2s ease-in-out infinite" }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" style={{ animation: "typing-bounce 1.2s ease-in-out 0.2s infinite" }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" style={{ animation: "typing-bounce 1.2s ease-in-out 0.4s infinite" }} />
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <form
                onSubmit={(e) => { e.preventDefault(); send(); }}
                className="flex items-center gap-2 border-t border-white/10 p-3"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message…"
                  maxLength={2000}
                  className="input-glow flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm placeholder:text-muted-foreground"
                />
                <Button type="submit" size="icon" variant="hero" disabled={sending || !input.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
