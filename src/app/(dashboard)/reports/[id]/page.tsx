import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { userOwnsAudit } from "@/server/services/authz";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, severityVariant } from "@/components/ui/badge";
import { ScoreBadge } from "@/components/dashboard/score-badge";
import { HIPAA_AREA_LABELS } from "@/types/domain";
import type { AreaResult, Finding, HipaaArea, RemediationStep } from "@/types/domain";

interface ReportFindingsJson {
  executiveSummary: string;
  areaResults: AreaResult[];
  findings: Finding[];
}

export default async function ReportPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  const userId = session!.user.id;

  if (!(await userOwnsAudit(userId, params.id))) redirect("/audits");

  const audit = await prisma.audit.findUnique({
    where: { id: params.id },
    include: { report: true, workspace: { select: { companyName: true } } },
  });
  if (!audit) notFound();
  if (audit.status !== "COMPLETED" || !audit.report) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Report not ready</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This audit is currently <strong>{audit.status}</strong>. The report will appear here
            once processing completes.
          </p>
        </CardContent>
      </Card>
    );
  }

  const data = audit.report.findings as unknown as ReportFindingsJson;
  const remediation = audit.report.remediationSteps as unknown as RemediationStep[];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Compliance report</h1>
          <p className="text-sm text-muted-foreground">
            {audit.workspace.companyName} ·{" "}
            {audit.completedAt ? new Date(audit.completedAt).toLocaleDateString() : ""}
          </p>
        </div>
        <a
          href={`/api/audits/${audit.id}/pdf`}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Export PDF
        </a>
      </div>

      {/* Executive summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Executive summary
            <ScoreBadge score={audit.report.riskScore} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{data.executiveSummary}</p>
        </CardContent>
      </Card>

      {/* Risk assessment matrix by area */}
      <Card>
        <CardHeader>
          <CardTitle>Risk assessment by HIPAA area</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {data.areaResults.map((area) => (
              <div
                key={area.area}
                className="flex items-center justify-between rounded-md border border-border p-3"
              >
                <span className="text-sm font-medium">
                  {HIPAA_AREA_LABELS[area.area as HipaaArea]}
                </span>
                <ScoreBadge score={area.score} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed findings */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed findings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.findings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No findings recorded.</p>
          ) : (
            data.findings.map((finding, i) => (
              <div key={i} className="rounded-md border border-border p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{finding.title}</h3>
                  <Badge variant={severityVariant(finding.severity)}>{finding.severity}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {HIPAA_AREA_LABELS[finding.area as HipaaArea]}
                </p>
                <p className="mt-2 text-sm">{finding.detail}</p>
                {finding.evidence.length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {finding.evidence.map((e, j) => (
                      <li key={j}>
                        <span className="font-medium">{e.documentName}:</span> “{e.excerpt}”
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Remediation roadmap */}
      <Card>
        <CardHeader>
          <CardTitle>Remediation roadmap</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2">
            {remediation.map((step) => (
              <li
                key={step.priority}
                className="flex items-center justify-between rounded-md border border-border p-3 text-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                    {step.priority}
                  </span>
                  <span>{step.action}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{step.estimatedEffort} effort</Badge>
                  <Badge variant={severityVariant(step.severity)}>{step.severity}</Badge>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
