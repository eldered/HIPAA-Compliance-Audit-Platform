"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const SPECIALTIES = [
  "Dental Practice",
  "Therapy / Counseling",
  "Medical Spa",
  "Urgent Care",
  "Other Healthcare",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [form, setForm] = React.useState({
    companyName: "",
    industry: SPECIALTIES[0]!,
    employeeCount: "",
    complianceNotes: "",
  });
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function finish() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyName: form.companyName,
        industry: form.industry,
        employeeCount: form.employeeCount ? Number(form.employeeCount) : undefined,
        complianceNotes: form.complianceNotes || undefined,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Could not save your practice.");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-xl items-center px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Set up your practice</CardTitle>
          <CardDescription>Step {step} of 2 — this tailors your audit.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 1 && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="companyName">Practice name</Label>
                <Input
                  id="companyName"
                  value={form.companyName}
                  onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="industry">Specialty</Label>
                <select
                  id="industry"
                  className="flex h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
                  value={form.industry}
                  onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}
                >
                  {SPECIALTIES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="employeeCount">Employees</Label>
                <Input
                  id="employeeCount"
                  type="number"
                  min={1}
                  value={form.employeeCount}
                  onChange={(e) => setForm((f) => ({ ...f, employeeCount: e.target.value }))}
                />
              </div>
              <Button
                className="w-full"
                disabled={!form.companyName}
                onClick={() => setStep(2)}
              >
                Continue
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="complianceNotes">
                  Current compliance efforts (optional)
                </Label>
                <textarea
                  id="complianceNotes"
                  rows={4}
                  className="flex w-full rounded-md border border-border bg-white px-3 py-2 text-sm"
                  placeholder="E.g. We have written policies but no formal risk assessment."
                  value={form.complianceNotes}
                  onChange={(e) => setForm((f) => ({ ...f, complianceNotes: e.target.value }))}
                />
              </div>
              {error && <p className="text-sm text-danger">{error}</p>}
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button className="flex-1" disabled={loading} onClick={finish}>
                  {loading ? "Saving…" : "Finish setup"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
