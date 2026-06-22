import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getPrimaryWorkspace } from "@/server/services/dashboard-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScoreBadge } from "@/components/dashboard/score-badge";

export default async function AuditHistoryPage() {
  const session = await getSession();
  const workspace = await getPrimaryWorkspace(session!.user.id);
  if (!workspace) redirect("/onboarding");

  const audits = await prisma.audit.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      auditType: true,
      status: true,
      complianceScore: true,
      createdAt: true,
      completedAt: true,
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Audit history</h1>
        <Button asChild>
          <Link href="/audits/new">Run new audit</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All audits</CardTitle>
        </CardHeader>
        <CardContent>
          {audits.length === 0 ? (
            <p className="text-sm text-muted-foreground">No audits yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-2 font-medium">Type</th>
                  <th className="py-2 font-medium">Created</th>
                  <th className="py-2 font-medium">Status</th>
                  <th className="py-2 font-medium">Score</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {audits.map((audit) => (
                  <tr key={audit.id} className="border-b border-border last:border-0">
                    <td className="py-3 font-medium">{audit.auditType}</td>
                    <td className="py-3 text-muted-foreground">
                      {new Date(audit.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3">{audit.status}</td>
                    <td className="py-3">
                      <ScoreBadge score={audit.complianceScore} />
                    </td>
                    <td className="py-3 text-right">
                      {audit.status === "COMPLETED" && (
                        <Link
                          href={`/reports/${audit.id}`}
                          className="text-brand hover:underline"
                        >
                          View report
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
