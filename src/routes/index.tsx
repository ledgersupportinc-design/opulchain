import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Shield, Zap, TrendingUp, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BtcLogo, UsdtLogo } from "@/components/CryptoLogos";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OpulChain — Invest Smarter. Grow Faster." },
      { name: "description", content: "The luxury platform to buy, hold, and grow Bitcoin and USDT. Secure wallets, instant deposits, real-time tracking." },
      { property: "og:title", content: "OpulChain — Invest Smarter. Grow Faster." },
      { property: "og:description", content: "Buy, hold, and grow Bitcoin and USDT in one secure luxury platform." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <Navbar />

      {/* Hero */}
      <section className="relative">
        <div className="mesh-bg" />
        <div className="relative z-10 mx-auto max-w-7xl px-6 pb-24 pt-20 md:pt-32">
          <div className="mx-auto max-w-3xl text-center fade-in">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
              Secure custody · Manual review · Real humans
            </div>
            <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
              Invest Smarter.
              <br />
              <span className="text-gradient-blue">Grow Faster.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
              Buy, hold, and grow Bitcoin and USDT in one secure platform built for serious investors.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/signup" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl btn-primary px-8 text-base font-semibold">
                Get Started <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/login" className="inline-flex h-12 items-center justify-center rounded-xl btn-ghost-outline px-8 text-base font-semibold">
                Sign In
              </Link>
            </div>

            {/* Floating asset chips */}
            <div className="mt-16 flex items-center justify-center gap-4 fade-in">
              <div className="flex items-center gap-3 rounded-2xl glass px-5 py-3">
                <BtcLogo className="h-8 w-8" />
                <div className="text-left">
                  <p className="text-xs text-muted-foreground">Supported</p>
                  <p className="text-sm font-semibold">Bitcoin</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl glass px-5 py-3">
                <UsdtLogo className="h-8 w-8" />
                <div className="text-left">
                  <p className="text-xs text-muted-foreground">Supported</p>
                  <p className="text-sm font-semibold">USDT</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why OpulChain */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 py-24">
        <div className="mb-14 text-center">
          <h2 className="font-display text-4xl font-bold md:text-5xl">Why OpulChain?</h2>
          <p className="mt-3 text-muted-foreground">Built for clarity, security, and confidence.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <FeatureCard
            icon={<Shield className="h-6 w-6" />}
            title="Secure Wallets"
            desc="Funds are held in custody with strict access controls and full transparency on every movement."
          />
          <FeatureCard
            icon={<Zap className="h-6 w-6" />}
            title="Instant Deposits"
            desc="Submit a deposit and we credit your account fast — typically within 24 hours after manual review."
          />
          <FeatureCard
            icon={<TrendingUp className="h-6 w-6" />}
            title="Real-time Tracking"
            desc="See your BTC and USDT balances update in real time with a clean, distraction-free dashboard."
          />
        </div>
      </section>

      {/* CTA banner */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-3xl glass-strong p-10 text-center md:p-16">
          <div className="absolute inset-0 opacity-60">
            <div className="mesh-bg" />
          </div>
          <div className="relative">
            <h3 className="font-display text-3xl font-bold md:text-4xl">Ready to start?</h3>
            <p className="mx-auto mt-3 max-w-md text-muted-foreground">
              Create your free account and make your first deposit in minutes.
            </p>
            <Link to="/signup" className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-xl btn-gold px-8 text-base font-semibold">
              Open Account <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="group rounded-2xl glass p-7 transition hover:-translate-y-1 hover:glow-blue">
      <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30">
        {icon}
      </div>
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
