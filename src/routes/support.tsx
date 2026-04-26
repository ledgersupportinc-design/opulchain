import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle, Mail, Clock } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Support — OpulChain" },
      {
        name: "description",
        content: "Get help with deposits, withdrawals, and account questions on OpulChain.",
      },
      { property: "og:title", content: "Support — OpulChain" },
      {
        property: "og:description",
        content: "Live chat, email, and FAQs for the OpulChain investment platform.",
      },
    ],
  }),
  component: SupportPage,
});

const faqs = [
  {
    q: "How do I make a deposit?",
    a: "Select your asset (BTC or USDT), enter the amount, and send to the provided wallet address. Your balance is credited within 24 hours after confirmation.",
  },
  {
    q: "How long do withdrawals take?",
    a: "Withdrawals are processed within 1–3 business days after review.",
  },
  {
    q: "What cryptocurrencies do you support?",
    a: "We currently support Bitcoin (BTC) and USDT (ERC20 / Tether).",
  },
  {
    q: "Is my investment secure?",
    a: "Yes. OpulChain uses 256-bit encryption and stores all sensitive data on secured infrastructure.",
  },
  {
    q: "What is the minimum deposit?",
    a: "The minimum deposit is 0.001 BTC or $10 USDT.",
  },
  {
    q: "Can I have multiple accounts?",
    a: "No. One account per user is permitted per our Terms & Conditions.",
  },
  {
    q: "How do I reset my password?",
    a: "Click \"Forgot Password\" on the login page and follow the instructions sent to your email.",
  },
  {
    q: "Why was my withdrawal rejected?",
    a: "Withdrawals may be rejected due to incomplete KYC, insufficient balance, or suspicious activity. Contact support for details.",
  },
  {
    q: "How do I contact support?",
    a: "Use the live chat widget on any page or email us at support@opulchain.com.",
  },
  {
    q: "Is OpulChain available in my country?",
    a: "OpulChain is available in most countries. Some regions may be restricted due to local regulations.",
  },
];

function openChat() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("opulchain:open-chat"));
  }
}

function SupportPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="mesh-bg" />
      <Navbar />

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-4xl px-4 pt-12 pb-10 text-center sm:px-6 sm:pt-20 sm:pb-14">
        <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
          We're <span className="text-gradient-blue">Here to Help</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:mt-6 sm:text-lg">
          Our support team is available to assist with deposits, withdrawals, and account questions.
        </p>
        <div className="mt-7">
          <button
            onClick={openChat}
            className="inline-flex items-center gap-2 rounded-lg btn-primary px-6 py-3 text-sm font-medium sm:text-base"
          >
            <MessageCircle className="h-4 w-4" /> Start a Live Chat
          </button>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative z-10 mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Frequently Asked Questions</h2>
          <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-gold" />
        </div>
        <div className="mt-8 sm:mt-10">
          <Accordion type="single" collapsible className="glass p-2 sm:p-4">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border-white/10">
                <AccordionTrigger className="px-3 text-left text-sm font-semibold sm:px-4 sm:text-base">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="px-3 text-sm leading-relaxed text-muted-foreground sm:px-4 sm:text-base">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Contact Cards */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="grid gap-5 sm:gap-6 md:grid-cols-3">
          <div className="glass p-6 text-center">
            <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <MessageCircle className="h-6 w-6" />
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold">Live Chat</h3>
            <p className="mt-1 text-sm text-muted-foreground">Available 24/7</p>
            <button
              onClick={openChat}
              className="mt-4 inline-flex rounded-lg btn-primary px-4 py-2 text-sm font-medium"
            >
              Open Chat
            </button>
          </div>

          <div className="glass p-6 text-center">
            <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gold/20 text-gold">
              <Mail className="h-6 w-6" />
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold">Email Support</h3>
            <p className="mt-1 text-sm text-muted-foreground">support@opulchain.com</p>
            <a
              href="mailto:support@opulchain.com"
              className="mt-4 inline-flex rounded-lg btn-gold px-4 py-2 text-sm font-medium"
            >
              Send Email
            </a>
          </div>

          <div className="glass p-6 text-center">
            <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-success/20 text-success">
              <Clock className="h-6 w-6" />
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold">Response Time</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              We typically respond within 2–4 hours
            </p>
            <div className="mt-4 inline-flex rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-muted-foreground">
              Mon – Sun
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
