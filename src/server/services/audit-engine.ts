import { prisma } from "@/lib/db/prisma";
import { getStorage } from "@/lib/storage";
import { analyzeArea } from "@/lib/ai/claude";
import { buildCorpus, extractText } from "@/lib/ai/extract";
import {
  buildRemediationRoadmap,
  collectFindings,
  computeOverallScore,
  countPassFail,
} from "@/lib/ai/scoring";
import { HIPAA_AREAS, type AreaResult, type AuditType, type Finding } from "@/types/domain";
import { logger } from "@/lib/utils/logger";
import { sendAuditCompleteEmail } from "@/lib/email";

/**
 * Run a full audit end-to-end (R4.2–R4.5):
 *   PROCESSING -> extract text -> analyze each HIPAA area -> score ->
 *   persist ComplianceReport + AuditHistory -> COMPLETED (or FAILED) -> email.
 *
 * Designed to be invoked by the internal job runner; never throws to the caller
 * (errors are captured on the audit row).
 */
export async function runAudit(auditId: string): Promise<void> {
  const audit = await prisma.audit.findUnique({
    where: { id: auditId },
    include: { documents: true, workspace: { include: { user: true } } },
  });
  if (!audit) {
    logger.error("runAudit: audit not found", { auditId });
    return;
  }

  try {
    await prisma.audit.update({ where: { id: auditId }, data: { status: "PROCESSING" } });

    // 1. Extract text from each document.
    const storage = getStorage();
    const extracted = await Promise.all(
      audit.documents.map(async (doc) => {
        const bytes = await storage.download(doc.storageKey);
        return { fileName: doc.fileName, text: extractText(doc.fileName, bytes) };
      }),
    );
    const corpus = buildCorpus(extracted);

    // 2. Analyze each HIPAA area.
    const areaResults: AreaResult[] = [];
    for (const area of HIPAA_AREAS) {
      const response = await analyzeArea(area, corpus);
      if (!response) {
        logger.warn("Area inconclusive", { auditId, area });
        continue; // inconclusive areas are skipped from scoring (R4.5)
      }
      const findings: Finding[] = response.findings.map((f) => ({
        area,
        severity: f.severity,
        title: f.title,
        detail: f.detail,
        evidence: f.evidence.map((e) => ({
          documentId: "",
          documentName: e.documentName,
          excerpt: e.excerpt,
        })),
      }));
      areaResults.push({ area, score: response.score, findings });
    }

    if (areaResults.length === 0) {
      throw new Error("All areas were inconclusive");
    }

    // 3. Score + build report.
    const overall = computeOverallScore(areaResults, audit.auditType as AuditType);
    const findings = collectFindings(areaResults);
    const remediation = buildRemediationRoadmap(findings);
    const { passed, failed } = countPassFail(findings);
    const recommendations = remediation.slice(0, 10).map((r) => r.action);
    const executiveSummary = buildExecutiveSummary(overall, failed, audit.workspace.companyName);

    // 4. Persist atomically.
    await prisma.$transaction([
      prisma.complianceReport.create({
        data: {
          auditId,
          riskScore: overall,
          findings: JSON.parse(JSON.stringify({ executiveSummary, areaResults, findings })),
          recommendations,
          remediationSteps: JSON.parse(JSON.stringify(remediation)),
        },
      }),
      prisma.auditHistory.create({
        data: {
          workspaceId: audit.workspaceId,
          auditId,
          score: overall,
          passedItems: passed,
          failedItems: failed,
        },
      }),
      prisma.audit.update({
        where: { id: auditId },
        data: { status: "COMPLETED", complianceScore: overall, completedAt: new Date() },
      }),
    ]);

    // 5. Notify (R8.2). Email failures must not fail the audit.
    if (audit.workspace.user.email) {
      try {
        await sendAuditCompleteEmail({
          to: audit.workspace.user.email,
          companyName: audit.workspace.companyName,
          score: overall,
          auditId,
        });
      } catch (err) {
        logger.error("audit-complete email failed", { auditId, err: String(err) });
      }
    }

    logger.info("Audit completed", { auditId, score: overall });
  } catch (err) {
    logger.error("Audit failed", { auditId, err: String(err) });
    await prisma.audit.update({
      where: { id: auditId },
      data: { status: "FAILED", errorReason: String(err).slice(0, 500) },
    });
  }
}

function buildExecutiveSummary(score: number, failedItems: number, company: string): string {
  const posture =
    score >= 90 ? "strong" : score >= 70 ? "fair with minor gaps" : score >= 40 ? "at risk" : "critical";
  return `${company} has an overall HIPAA compliance score of ${score}/100 (${posture}). ${failedItems} high-or-critical item(s) require attention. See the remediation roadmap for prioritized next steps.`;
}
