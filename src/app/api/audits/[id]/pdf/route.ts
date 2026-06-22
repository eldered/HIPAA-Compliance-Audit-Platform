import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { unauthorized, forbidden, notFound } from "@/lib/utils/api";
import { userOwnsAudit } from "@/server/services/authz";
import { buildPdf } from "@/lib/report/pdf";
import { reportToBlocks } from "@/lib/report/build-blocks";
import type { AreaResult, Finding, RemediationStep } from "@/types/domain";

export const runtime = "nodejs";

interface ReportFindingsJson {
  executiveSummary: string;
  areaResults: AreaResult[];
  findings: Finding[];
}

/** Export a completed audit's report as a downloadable PDF (R5.2). */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) return unauthorized();
  if (!(await userOwnsAudit(userId, params.id))) return forbidden();

  const audit = await prisma.audit.findUnique({
    where: { id: params.id },
    include: { report: true, workspace: { select: { companyName: true } } },
  });
  if (!audit?.report) return notFound("Report");

  const data = audit.report.findings as unknown as ReportFindingsJson;
  const remediation = audit.report.remediationSteps as unknown as RemediationStep[];

  const blocks = reportToBlocks({
    companyName: audit.workspace.companyName,
    riskScore: audit.report.riskScore,
    executiveSummary: data.executiveSummary,
    areaResults: data.areaResults,
    findings: data.findings,
    remediation,
    date: (audit.completedAt ?? audit.report.createdAt).toISOString().slice(0, 10),
  });

  const pdf = buildPdf(blocks);

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="vivaudit-report-${params.id}.pdf"`,
    },
  });
}
