import Link from "next/link";
import { FileText, ShieldCheck, Sparkles, Upload, ClipboardCheck, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PricingCards } from "@/components/marketing/pricing-cards";

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="section">
        <div className="container grid items-center gap-10 md:grid-cols-2">
          <div>
            <Badge variant="success" className="mb-4">
              HIPAA Compliance Made Simple
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              Automated HIPAA audits for your practice
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Upload your policies and IT documentation. Our AI analyzes them against HIPAA
              requirements and returns a risk-scored report with a prioritized remediation
              roadmap — in minutes, not months.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/signup">Start your free audit</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/#how-it-works">See how it works</Link>
              </Button>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              No credit card required · First audit free
            </p>
          </div>
          <div className="rounded-lg border border-border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Overall compliance
              </span>
              <ShieldCheck className="h-5 w-5 text-success" />
            </div>
            <div className="mt-2 text-5xl font-bold text-brand">82</div>
            <div className="mt-1 text-sm text-muted-foreground">/ 100 — fair, minor gaps</div>
            <div className="mt-6 space-y-3">
              {[
                { label: "Access Control", score: 90, tone: "bg-success" },
                { label: "Data Encryption", score: 75, tone: "bg-brand" },
                { label: "Incident Response", score: 48, tone: "bg-danger" },
              ].map((row) => (
                <div key={row.label}>
                  <div className="flex justify-between text-sm">
                    <span>{row.label}</span>
                    <span className="font-medium">{row.score}</span>
                  </div>
                  <div className="mt-1 h-2 w-full rounded-full bg-muted">
                    <div
                      className={`h-2 rounded-full ${row.tone}`}
                      style={{ width: `${row.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pain point */}
      <section className="border-y border-border bg-muted/40 section">
        <div className="container text-center">
          <h2 className="text-2xl font-bold md:text-3xl">
            HIPAA penalties can reach six figures — per violation
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Most small practices don&apos;t know where they stand until an incident or audit
            forces the issue. VivAudit gives you an objective assessment and a clear plan before
            that happens.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="section">
        <div className="container">
          <h2 className="text-center text-3xl font-bold">How it works</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              {
                icon: Upload,
                title: "1. Upload your docs",
                body: "Drag-and-drop policies, IT setup, and patient-data procedures (PDF, DOCX, XLSX, TXT, CSV).",
              },
              {
                icon: Sparkles,
                title: "2. AI runs the audit",
                body: "Claude analyzes access control, encryption, incident response, training, and more — scoring each area.",
              },
              {
                icon: ClipboardCheck,
                title: "3. Get your roadmap",
                body: "Receive a risk-scored report with evidence-backed findings and prioritized remediation steps.",
              },
            ].map((step) => (
              <div key={step.title} className="rounded-lg border border-border bg-white p-6">
                <step.icon className="h-8 w-8 text-brand" />
                <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features strip */}
      <section className="border-t border-border bg-muted/40 section">
        <div className="container grid gap-8 md:grid-cols-3">
          {[
            { icon: FileText, title: "Evidence-backed findings", body: "Every finding cites the document it came from." },
            { icon: TrendingUp, title: "Track improvement", body: "See month-over-month score trends and close gaps." },
            { icon: ShieldCheck, title: "Built for trust", body: "Encryption at rest and in transit, access logging, secure by default." },
          ].map((f) => (
            <div key={f.title} className="flex gap-4">
              <f.icon className="h-6 w-6 shrink-0 text-brand" />
              <div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="section">
        <div className="container">
          <h2 className="text-center text-3xl font-bold">Simple, transparent pricing</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
            Start free. Upgrade when you&apos;re ready for unlimited audits and continuous
            monitoring.
          </p>
          <div className="mt-12">
            <PricingCards />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand section">
        <div className="container text-center text-white">
          <h2 className="text-3xl font-bold">Know where your practice stands today</h2>
          <p className="mx-auto mt-3 max-w-xl text-brand-50">
            Run your first HIPAA audit free — no credit card, no commitment.
          </p>
          <Button asChild size="lg" variant="success" className="mt-8">
            <Link href="/signup">Start your free audit</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
