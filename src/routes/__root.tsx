import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { AuthProvider } from "@/lib/auth";
import { ChatWidget } from "@/components/ChatWidget";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="mesh-bg" />
      <div className="relative z-10 max-w-md text-center">
        <h1 className="font-display text-8xl font-bold text-gradient-blue">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Link to="/" className="inline-flex items-center justify-center rounded-lg btn-primary px-5 py-2.5 text-sm font-medium">
            Go home
          </Link>
          <Link to="/about" className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm hover:bg-white/10">
            About
          </Link>
          <Link to="/support" className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm hover:bg-white/10">
            Support
          </Link>
          <Link to="/terms" className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm hover:bg-white/10">
            Terms
          </Link>
          <Link to="/legal" className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm hover:bg-white/10">
            Privacy
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "OpulChain — Invest Smarter. Grow Faster." },
      { name: "description", content: "Buy, hold, and grow Bitcoin and USDT in one secure luxury investment platform." },
      { name: "author", content: "OpulChain" },
      { property: "og:title", content: "OpulChain — Invest Smarter. Grow Faster." },
      { property: "og:description", content: "Buy, hold, and grow Bitcoin and USDT in one secure luxury investment platform." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "OpulChain — Invest Smarter. Grow Faster." },
      { name: "twitter:description", content: "Buy, hold, and grow Bitcoin and USDT in one secure luxury investment platform." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/75b29024-51ac-4843-8dab-875c2da50770" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/75b29024-51ac-4843-8dab-875c2da50770" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap",
      },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="bg-background text-foreground">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  // Clear the auto-reload guard once the app successfully mounts so a future
  // transient error can recover too.
  if (typeof window !== "undefined") {
    try {
      sessionStorage.removeItem("opul:auto-reload");
    } catch {
      /* ignore */
    }
  }
  return (
    <AuthProvider>
      <AnnouncementBanner />
      <Outlet />
      <ChatWidget />
      <Toaster />
    </AuthProvider>
  );
}
