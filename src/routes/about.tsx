import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock, Zap, MessageSquare, TrendingUp } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About OpulChain — Built for the Future of Wealth" },
      {
        name: "description",
        content:
          "OpulChain is a secure, modern crypto investment platform built to make Bitcoin and USDT accessible, transparent, and rewarding.",
      },
      { property: "og:title", content: "About OpulChain — Built for the Future of Wealth" },
      {
        property: "og:description",
        content:
          "Learn about OpulChain's mission, team, and why thousands of investors trust us with their crypto.",
      },
    ],
  }),
  component: AboutPage,
});

const stats = [
  { icon: "💰", label: "Assets Managed", value: "$24M+" },
  { icon: "👥", label: "Active Investors", value: "12,000+" },
  { icon: "🌍", label: "Countries Served", value: "40+" },
  { icon: "⚡", label: "Platform Uptime", value: "99.9%" },
];

const features = [
  {
    icon: <Lock className="h-6 w-6" />,
    title: "Bank-Grade Security",
    desc: "Your funds are protected with 256-bit encryption and multi-layer authentication.",
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: "Fast Processing",
    desc: "Deposits credited within 24 hours, withdrawals within 3 business days.",
  },
  {
    icon: <MessageSquare className="h-6 w-6" />,
    title: "Real Human Support",
    desc: "Our support team is available to assist you every step of the way.",
  },
  {
    icon: <TrendingUp className="h-6 w-6" />,
    title: "Transparent Operations",
    desc: "Every transaction is logged and visible in your dashboard in real time.",
  },
];

const team = [
  {
    name: "James Harrington",
    title: "CEO & Co-Founder",
    bio: "Two decades shaping fintech and digital assets at a global scale.",
  },
  {
    name: "Sophia Chen",
    title: "Chief Technology Officer",
    bio: "Builds the secure, low-latency systems behind every OpulChain transaction.",
  },
  {
    name: "Allen Jones",
    title: "Head of Operations",
    bio: "Leads the people side: support, compliance, and a flawless investor experience.",
  },
];

function avatarUrl(name: string) {
  const q = encodeURIComponent(name);
  return `https://ui-avatars.com/api/?name=${q}&background=1A6BFF&color=fff&size=256&bold=true`;
}

function AboutPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="mesh-bg" />
      <Navbar />

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-5xl px-4 pt-12 pb-10 text-center sm:px-6 sm:pt-20 sm:pb-16">
        <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
          Built for the <span className="text-gradient-blue">Future of Wealth</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:mt-6 sm:text-lg">
          OpulChain is a secure, modern crypto investment platform designed to make Bitcoin and
          USDT investing accessible, transparent, and rewarding for everyone.
        </p>
      </section>

      {/* Mission */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Our Mission</h2>
            <div className="mt-3 h-1 w-16 rounded-full bg-gold" />
            <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
              We believe financial freedom should not be reserved for the few. OpulChain was built
              to give everyday people access to the same wealth-building tools used by
              institutional investors — with full transparency, military-grade security, and real
              human support.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {stats.map((s) => (
              <div key={s.label} className="glass p-4 text-center sm:p-5">
                <div className="text-2xl sm:text-3xl">{s.icon}</div>
                <div className="mt-2 font-display text-xl font-bold sm:text-2xl">{s.value}</div>
                <div className="mt-1 text-xs text-muted-foreground sm:text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why OpulChain */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Why OpulChain</h2>
          <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-gold" />
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:mt-10 sm:gap-6 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="glass p-5 transition hover:-translate-y-1 sm:p-6">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                {f.icon}
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">The Team Behind OpulChain</h2>
          <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-gold" />
        </div>
        <div className="mt-8 grid gap-5 sm:mt-10 sm:gap-6 md:grid-cols-3">
          {team.map((m) => (
            <div key={m.name} className="glass p-6 text-center">
              <img
                src={avatarUrl(m.name)}
                alt={m.name}
                loading="lazy"
                className="mx-auto h-24 w-24 rounded-full ring-2 ring-primary/40"
              />
              <h3 className="mt-4 font-display text-lg font-semibold">{m.name}</h3>
              <p className="text-sm text-gold">{m.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">{m.bio}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 mx-auto max-w-4xl px-4 pb-16 pt-6 text-center sm:px-6">
        <div className="glass-strong p-8 sm:p-10">
          <h3 className="font-display text-2xl font-bold sm:text-3xl">Ready to start growing?</h3>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Join thousands of investors building wealth on OpulChain.
          </p>
          <Link
            to="/signup"
            className="mt-5 inline-flex rounded-lg btn-primary px-6 py-2.5 text-sm font-medium"
          >
            Open an Account
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
