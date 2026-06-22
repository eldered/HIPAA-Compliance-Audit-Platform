import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

interface Tier {
  name: string;
  price: string;
  cadence: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  highlighted?: boolean;
}

const TIERS: Tier[] = [
  {
    name: "Starter",
    price: "$99",
    cadence: "/month",
    description: "For solo practices getting compliant.",
    features: ["1 audit / month", "Basic compliance report", "PDF export", "Email support", "500 MB storage"],
    cta: "Choose Starter",
    href: "/signup?plan=STARTER",
  },
  {
    name: "Professional",
    price: "$299",
    cadence: "/month",
    description: "For growing practices that audit often.",
    features: [
      "Unlimited audits",
      "Detailed reports + evidence",
      "Monthly compliance updates",
      "Slack support",
      "5 GB storage",
    ],
    cta: "Choose Professional",
    href: "/signup?plan=PROFESSIONAL",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    cadence: "",
    description: "For multi-location and continuous monitoring.",
    features: [
      "Everything in Professional",
      "Dedicated compliance manager",
      "Continuous monitoring",
      "Insurance & EHR integrations",
      "Custom storage",
    ],
    cta: "Contact sales",
    href: "/signup",
  },
];

export function PricingCards() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {TIERS.map((tier) => (
        <Card
          key={tier.name}
          className={cn(
            "flex flex-col",
            tier.highlighted && "border-brand shadow-md ring-1 ring-brand",
          )}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">{tier.name}</h3>
              {tier.highlighted && <Badge>Most popular</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">{tier.description}</p>
            <div className="mt-2">
              <span className="text-3xl font-bold">{tier.price}</span>
              <span className="text-muted-foreground">{tier.cadence}</span>
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col">
            <ul className="mb-6 space-y-2 text-sm">
              {tier.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button
              asChild
              className="mt-auto w-full"
              variant={tier.highlighted ? "default" : "outline"}
            >
              <Link href={tier.href}>{tier.cta}</Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
