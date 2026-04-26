import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/legal")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — OpulChain" },
      {
        name: "description",
        content: "How OpulChain collects, uses, and protects your personal information.",
      },
      { property: "og:title", content: "Privacy Policy — OpulChain" },
      {
        property: "og:description",
        content: "Read OpulChain's Privacy Policy to understand how your data is handled.",
      },
    ],
  }),
  component: LegalPage,
});

const sections = [
  {
    title: "1. Information We Collect",
    body: [
      "We collect information you provide directly, including your name, email address, wallet addresses you submit, transaction history, and support communications.",
      "We also automatically collect device and browser information such as IP address, device type, operating system, and pages visited, used to keep your account secure and improve the platform.",
    ],
  },
  {
    title: "2. How We Use Your Information",
    body: [
      "Your information is used to manage your account, process deposits and withdrawals, send security alerts, and provide customer support.",
      "We also use aggregated, anonymized data to improve platform performance, detect fraud, and develop new features.",
    ],
  },
  {
    title: "3. Data Storage & Security",
    body: [
      "Personal data is stored in encrypted databases on secured infrastructure. Sensitive fields are encrypted both in transit (TLS) and at rest.",
      "We do not sell your personal information to third parties. Access to user data is strictly limited to authorized personnel who need it to operate the platform.",
    ],
  },
  {
    title: "4. Cookies",
    body: [
      "We use essential session cookies to keep you logged in and to secure your account.",
      "Optional analytics cookies help us understand how the platform is used so we can improve it. You may disable non-essential cookies in your browser settings.",
    ],
  },
  {
    title: "5. Third-Party Services",
    body: [
      "OpulChain uses trusted third parties to operate, including database and authentication infrastructure, transactional email delivery, and public market price data.",
      "These providers process data only for the purposes of delivering their service and are bound by strict data-protection agreements.",
    ],
  },
  {
    title: "6. Your Rights",
    body: [
      "You have the right to access, correct, export, or delete your personal information at any time. To exercise these rights, contact our support team.",
      "Where required by law, we will respond to verified requests within 30 days.",
    ],
  },
  {
    title: "7. Data Retention",
    body: [
      "We retain account data for up to 5 years after account closure to comply with financial, tax, and anti-money-laundering regulations.",
      "After the retention period, your personal information is permanently deleted or fully anonymized.",
    ],
  },
  {
    title: "8. Children's Privacy",
    body: [
      "OpulChain is not intended for users under the age of 18. We do not knowingly collect personal information from minors. If we learn that a minor has registered, we will delete the account and any associated data.",
    ],
  },
  {
    title: "9. Contact Us",
    body: [
      "Questions about this Privacy Policy or your data can be sent to support@opulchain.com. Our team will respond within 2–4 business hours.",
    ],
  },
];

function LegalPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="mesh-bg" />
      <Navbar />

      <section className="relative z-10 mx-auto max-w-4xl px-4 pb-16 pt-12 sm:px-6 sm:pt-20">
        <div className="text-center">
          <h1 className="font-display text-4xl font-bold sm:text-5xl">Privacy Policy</h1>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            Last updated: January 1, 2025
          </p>
          <div className="mx-auto mt-4 h-1 w-20 rounded-full bg-gold" />
        </div>

        <div className="mt-10 space-y-6 sm:space-y-8">
          {sections.map((s) => (
            <div key={s.title} className="glass p-6 sm:p-8">
              <h2 className="font-display text-lg font-semibold sm:text-2xl">{s.title}</h2>
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
