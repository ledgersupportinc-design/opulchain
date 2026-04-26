import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — OpulChain" },
      {
        name: "description",
        content: "Read the OpulChain Terms & Conditions covering eligibility, deposits, withdrawals, and account use.",
      },
      { property: "og:title", content: "Terms & Conditions — OpulChain" },
      {
        property: "og:description",
        content: "The legal terms governing your use of the OpulChain platform.",
      },
    ],
  }),
  component: TermsPage,
});

const sections = [
  {
    title: "1. Acceptance of Terms",
    body: [
      "By accessing or using OpulChain in any way — including creating an account, making a deposit, or browsing the platform — you agree to be bound by these Terms & Conditions in full.",
      "If you do not agree to any part of these terms, you must stop using the platform immediately. Continued use after updates constitutes acceptance of the revised terms.",
    ],
  },
  {
    title: "2. Eligibility",
    body: [
      "You must be at least 18 years old and legally permitted to invest in cryptocurrency in your country or jurisdiction of residence.",
      "It is your responsibility to ensure that using OpulChain does not violate any laws or regulations applicable to you. We reserve the right to refuse service in restricted regions.",
    ],
  },
  {
    title: "3. Account Registration",
    body: [
      "You agree to provide accurate, current, and complete information during registration and to keep that information updated.",
      "Only one account per individual is permitted. Creating multiple accounts may result in suspension of all related accounts and forfeiture of balances.",
    ],
  },
  {
    title: "4. Deposits & Withdrawals",
    body: [
      "All deposits and withdrawals are reviewed manually by our operations team to protect users from fraud and unauthorized activity.",
      "Deposits are typically credited within 24 hours after on-chain confirmation. Withdrawals are processed within 1–3 business days. Processing times are estimates and may vary during periods of high volume.",
    ],
  },
  {
    title: "5. Investment Risks",
    body: [
      "Cryptocurrency investments are volatile and carry significant risk. The value of your holdings can rise or fall sharply, and you may lose part or all of your invested capital.",
      "Past performance does not guarantee future results. You should only invest what you can afford to lose, and you are solely responsible for your investment decisions.",
    ],
  },
  {
    title: "6. Prohibited Activities",
    body: [
      "You agree not to use OpulChain for any unlawful purpose, including but not limited to fraud, money laundering, terrorism financing, market manipulation, or circumventing sanctions.",
      "Using bots, scripts, automation, fake identities, or operating multiple accounts is strictly prohibited and will result in immediate account termination.",
    ],
  },
  {
    title: "7. Account Termination",
    body: [
      "OpulChain reserves the right to suspend, restrict, or terminate any account that violates these Terms, engages in suspicious activity, or poses a risk to the platform or its users.",
      "Where lawful, remaining balances will be returned to the verified account holder after a review period.",
    ],
  },
  {
    title: "8. Limitation of Liability",
    body: [
      "OpulChain is not liable for losses arising from market volatility, network outages, third-party services, or user error such as sending funds to an incorrect wallet address.",
      "To the maximum extent permitted by law, our total liability is limited to the fees you paid to us in the 12 months preceding the event giving rise to the claim.",
    ],
  },
  {
    title: "9. Privacy",
    body: [
      "Your personal data is handled in accordance with our Privacy Policy. By using OpulChain you consent to the collection and use of information as described there.",
    ],
  },
  {
    title: "10. Changes to Terms",
    body: [
      "We may update these Terms from time to time. Material changes will be communicated by email and announced on the platform at least 7 days before they take effect.",
      "Your continued use of OpulChain after the effective date constitutes acceptance of the updated Terms.",
    ],
  },
];

function TermsPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="mesh-bg" />
      <Navbar />

      <section className="relative z-10 mx-auto max-w-4xl px-4 pb-16 pt-12 sm:px-6 sm:pt-20">
        <div className="text-center">
          <h1 className="font-display text-4xl font-bold sm:text-5xl">Terms &amp; Conditions</h1>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            Last updated: January 1, 2025
          </p>
          <div className="mx-auto mt-4 h-1 w-20 rounded-full bg-gold" />
        </div>

        {/* Mobile: accordion */}
        <div className="mt-10 md:hidden">
          <Accordion type="single" collapsible className="glass p-2">
            {sections.map((s, i) => (
              <AccordionItem key={s.title} value={`item-${i}`} className="border-white/10">
                <AccordionTrigger className="px-3 text-left text-sm font-semibold">
                  {s.title}
                </AccordionTrigger>
                <AccordionContent className="px-3 text-sm leading-relaxed text-muted-foreground">
                  <div className="space-y-3">
                    {s.body.map((p, idx) => (
                      <p key={idx}>{p}</p>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Desktop: full text */}
        <div className="mt-10 hidden space-y-8 md:block">
          {sections.map((s) => (
            <div key={s.title} className="glass p-6 sm:p-8">
              <h2 className="font-display text-xl font-semibold sm:text-2xl">{s.title}</h2>
              <div className="mt-4 space-y-3 text-base leading-relaxed text-muted-foreground">
                {s.body.map((p, idx) => (
                  <p key={idx}>{p}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
