import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlanActions } from "@/components/dashboard/plan-actions";
import { getEntitlements } from "@/lib/billing/plans";
import type { Plan } from "@/types/domain";

export default async function SettingsPage() {
  const session = await getSession();
  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { email: true, name: true, companyName: true, plan: true },
  });

  const plan = (user?.plan ?? "FREE_TRIAL") as Plan;
  const entitlements = getEntitlements(plan);

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Name</span>
            <span>{user?.name ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span>{user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Practice</span>
            <span>{user?.companyName ?? "—"}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Plan &amp; billing
            <Badge>{entitlements.label}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <ul className="space-y-1 text-muted-foreground">
            <li>
              Audits/month:{" "}
              {entitlements.auditsPerMonth === Number.POSITIVE_INFINITY
                ? "Unlimited"
                : entitlements.auditsPerMonth}
            </li>
            <li>Report depth: {entitlements.reportDepth}</li>
            <li>Storage: {(entitlements.storageBytes / (1024 * 1024)).toFixed(0)} MB</li>
          </ul>
          <PlanActions currentPlan={plan} />
        </CardContent>
      </Card>
    </div>
  );
}
