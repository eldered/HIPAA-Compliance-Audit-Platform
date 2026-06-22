import type { Metadata } from "next";
import { PricingCards } from "@/components/marketing/pricing-cards";

export const metadata: Metadata = {
  title: "Pricing",
  description: "VivAudit pricing — Starter, Professional, and Enterprise HIPAA audit plans.",
};

const FAQ = [
  {
    q: "Is my data secure?",
    a: "Yes. Documents are encrypted at rest and in transit, access is logged, and we never share your data. See our Security & Privacy page for details.",
  },
  {
    q: "What file types can I upload?",
    a: "PDF, DOCX, XLSX, TXT, and CSV up to 25 MB each.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. You can cancel from the billing portal; your plan stays active until the end of the period.",
  },
  {
    q: "Does the free audit require a credit card?",
    a: "No. Your first audit is free with no card required.",
  },
];

export default function PricingPage() {
  return (
    <div className="section">
      <div className="container">
        <h1 className="text-center text-4xl font-bold">Pricing</h1>
        <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
          Choose the plan that fits your practice. Every plan includes evidence-backed reports
          and PDF export.
        </p>

        <div className="mt-12">
          <PricingCards />
        </div>

        <div className="mx-auto mt-20 max-w-3xl">
          <h2 className="text-2xl font-bold">Frequently asked questions</h2>
          <dl className="mt-6 space-y-6">
            {FAQ.map((item) => (
              <div key={item.q} className="border-b border-border pb-6">
                <dt className="font-semibold">{item.q}</dt>
                <dd className="mt-2 text-sm text-muted-foreground">{item.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
