import { useEffect, useState, useCallback } from "react";
import { Info, AlertTriangle, Siren, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Announcement {
  id: string;
  message: string;
  type: "info" | "warning" | "urgent";
  active: boolean;
}

const STYLES: Record<Announcement["type"], { bg: string; icon: React.ReactNode }> = {
  info: {
    bg: "bg-primary/15 border-primary/30 text-foreground",
    icon: <Info className="h-4 w-4 text-primary" />,
  },
  warning: {
    bg: "bg-gold/15 border-gold/40 text-foreground",
    icon: <AlertTriangle className="h-4 w-4 text-gold" />,
  },
  urgent: {
    bg: "bg-destructive/15 border-destructive/40 text-foreground",
    icon: <Siren className="h-4 w-4 text-destructive" />,
  },
};

const SESSION_KEY = "opulchain_announcement_dismissed";

export function AnnouncementBanner() {
  const [ann, setAnn] = useState<Announcement | null>(null);
  const [dismissed, setDismissed] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setDismissed(sessionStorage.getItem(SESSION_KEY));
    }
  }, []);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("announcements")
      .select("id,message,type,active")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(1);
    setAnn((data?.[0] as Announcement | undefined) ?? null);
  }, []);

  useEffect(() => {
    void load();
    const ch = supabase
      .channel("announcements-banner")
      .on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [load]);

  if (!ann || dismissed === ann.id) return null;

  const type = (["info", "warning", "urgent"].includes(ann.type) ? ann.type : "info") as Announcement["type"];
  const style = STYLES[type];

  const dismiss = () => {
    sessionStorage.setItem(SESSION_KEY, ann.id);
    setDismissed(ann.id);
  };

  return (
    <div className={`relative z-30 border-b ${style.bg}`}>
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2 sm:px-6">
        <div className="shrink-0">{style.icon}</div>
        <p className="flex-1 text-center text-xs font-medium sm:text-sm">{ann.message}</p>
        <button
          onClick={dismiss}
          aria-label="Dismiss announcement"
          className="shrink-0 rounded-md p-1 hover:bg-white/10"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
