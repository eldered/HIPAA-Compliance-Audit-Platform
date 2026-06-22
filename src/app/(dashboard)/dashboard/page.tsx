import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getDashboardOverview, getPrimaryWorkspace } from "@/server/services/dashboard-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScoreTrendChart } from "@/components/dashboard/score-trend-chart";
import { ScoreBadge } from "@/components/dashboard/score-badge";

export default async function DashboardPage() {
  const session = await getSession();
  const userId = session!.user.id;

  const workspace = await getPrimaryWorkspace(userId);
  if (!workspace) redirect("/onboarding");

  const overview = await getDashboardOverview(workspace.id);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{workspace.companyName}</h1>
          <p className="text-sm text-muted-foreground">HIPAA compliance overview</p>
        </div>
        <Button asChild>
          <Link href="/audits/new">Run new audit</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Latest score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-brand">
              {overview.latestScore ?? "—"}
              {overview.latestScore !== null && (
                <span className="text-lg text-muted-foreground">/100</span>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total audits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{overview.totalAudits}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{session!.user.plan}</div>
            <Link href="/settings" className="text-sm text-brand hover:underline">
              Manage plan
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Compliance trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ScoreTrendChart data={overview.trend} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent audits</CardTitle>
        </CardHeader>
        <CardContent>
          {overview.recentAudits.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No audits yet.{" "}
              <Link href="/audits/new" className="text-brand hover:underline">
                Run your first audit
              </Link>
              .
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {overview.recentAudits.map((audit) => (
                <li key={audit.id} className="flex items-center justify-between py-3">
                  <div>
                    <Link
                      href={`/reports/${audit.id}`}
                      className="font-medium text-brand hover:underline"
                    >
                      {audit.auditType} audit
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {new Date(audit.createdAt).toLocaleString()} · {audit.status}
                    </p>
                  </div>
                  <ScoreBadge score={audit.complianceScore} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
