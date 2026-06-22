"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

/** Initiates Stripe Checkout for an upgrade (R7.1). */
export function PlanActions({ currentPlan }: { currentPlan: string }) {
  const [loading, setLoading] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function upgrade(plan: "STARTER" | "PROFESSIONAL") {
    setError(null);
    setLoading(plan);
    const res = await fetch("/api/payments/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
    setLoading(null);
    if (data.url) {
      window.location.href = data.url;
      return;
    }
    setError(data.error ?? "Could not start checkout.");
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          disabled={currentPlan === "STARTER" || loading !== null}
          onClick={() => upgrade("STARTER")}
        >
          {loading === "STARTER" ? "Redirecting…" : "Switch to Starter ($99/mo)"}
        </Button>
        <Button
          disabled={currentPlan === "PROFESSIONAL" || loading !== null}
          onClick={() => upgrade("PROFESSIONAL")}
        >
          {loading === "PROFESSIONAL" ? "Redirecting…" : "Upgrade to Professional ($299/mo)"}
        </Button>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
