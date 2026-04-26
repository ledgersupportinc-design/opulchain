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

export function ChatWidget() {
  const { user, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [unread, setUnread] = useState(0);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Don't show widget for admins (they have their own panel) or when no user
  const visible = !isAdmin;

  useEffect(() => {
    if (!user || isAdmin) return;

    const load = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      if (data) {
        setMessages(data as ChatMessage[]);
        setUnread(data.filter((m) => m.sender === "admin" && !m.read).length);
      }
    };
    load();

    const channel = supabase
      .channel(`chat:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const msg = payload.new as ChatMessage;
          setMessages((prev) => [...prev, msg]);
          if (msg.sender === "admin" && !open) setUnread((u) => u + 1);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isAdmin, open]);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [open, messages.length]);

  useEffect(() => {
    // Mark admin messages as read when drawer opens
    if (!open || !user) return;
    const unreadIds = messages.filter((m) => m.sender === "admin" && !m.read).map((m) => m.id);
    if (unreadIds.length === 0) return;
    supabase
      .from("chat_messages")
      .update({ read: true })
      .in("id", unreadIds)
      .then(() => setUnread(0));
  }, [open, messages, user]);

  if (!visible) return null;

  const send = async () => {
    if (!user) return;
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    const { error } = await supabase.from("chat_messages").insert({
      user_id: user.id,
      sender: "user",
      message: text,
    });
    if (!error) setInput("");
    setSending(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Open support chat"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full btn-primary"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {unread > 0 && !open && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[11px] font-semibold text-destructive-foreground">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fade-in fixed bottom-24 right-6 z-50 flex h-[28rem] w-[22rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl glass-strong shadow-[var(--shadow-elevated)]">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Headphones className="h-5 w-5 text-primary" />
                <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-success ring-2 ring-card" />
              </div>
              <div>
                <p className="text-sm font-semibold">OpulChain Support</p>
                <p className="text-[11px] text-success">Online · We'll reply shortly</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-md p-1 hover:bg-white/10"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {!user ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Sign in to chat with our support team.
              </p>
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="rounded-lg btn-primary px-4 py-2 text-sm font-medium"
              >
                Sign In
              </Link>
            </div>
          ) : (
            <>
              <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
                {messages.length === 0 && (
                  <p className="mt-4 text-center text-xs text-muted-foreground">
                    👋 Hi! How can we help you today?
                  </p>
                )}
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                        m.sender === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-white/10 text-foreground"
                      }`}
                    >
                      {m.message}
                    </div>
                  </div>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send();
                }}
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
