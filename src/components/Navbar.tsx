import { Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, LogOut, User, Settings, Shield } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { BrandLogo } from "./CryptoLogos";
import { CryptoPriceTicker } from "./CryptoPriceTicker";
import { NotificationBell } from "./NotificationBell";

export function Navbar() {
  const { user, isAdmin, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initials = (user?.user_metadata?.full_name || user?.email || "U")
    .split(" ")
    .map((s: string) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        <Link to={user ? "/dashboard" : "/"} className="shrink-0">
          <BrandLogo />
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          <CryptoPriceTicker />
          {user ? (
            <>
              <NotificationBell />
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setOpen((o) => !o)}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1.5 pl-1.5 pr-2 transition hover:bg-white/10 sm:pr-3"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 text-xs font-semibold">
                  {initials}
                </div>
                <span className="hidden max-w-[120px] truncate text-sm sm:inline">
                  {user.user_metadata?.full_name || user.email?.split("@")[0]}
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
              {open && (
                <div className="fade-in absolute right-0 mt-2 w-56 overflow-hidden rounded-xl glass-strong shadow-[var(--shadow-elevated)]">
                  <div className="border-b border-white/10 px-4 py-3">
                    <p className="truncate text-sm font-medium">{user.user_metadata?.full_name || "Account"}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <button
                    onClick={() => { setOpen(false); navigate({ to: "/dashboard" }); }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-white/10"
                  >
                    <User className="h-4 w-4" /> Profile
                  </button>
                  <button
                    onClick={() => { setOpen(false); navigate({ to: "/dashboard" }); }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-white/10"
                  >
                    <Settings className="h-4 w-4" /> Settings
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => { setOpen(false); navigate({ to: "/admin" }); }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gold hover:bg-white/10"
                    >
                      <Shield className="h-4 w-4" /> Admin Panel
                    </button>
                  )}
                  <button
                    onClick={async () => { setOpen(false); await signOut(); navigate({ to: "/" }); }}
                    className="flex w-full items-center gap-2 border-t border-white/10 px-4 py-2 text-sm text-destructive hover:bg-white/10"
                  >
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                </div>
              )}
            </div>
            </>
          ) : (
            <>
              <Link to="/login" className="rounded-lg px-3 py-2 text-sm hover:bg-white/5 sm:px-4">Sign In</Link>
              <Link to="/signup" className="rounded-lg btn-primary px-3 py-2 text-sm font-medium sm:px-4">Get Started</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
