import type { Block } from "@/lib/report/pdf";
import { HIPAA_AREA_LABELS } from "@/types/domain";
import type { AreaResult, Finding, HipaaArea, RemediationStep } from "@/types/domain";

export interface ReportData {
  companyName: string;
  riskScore: number;
  executiveSummary: string;
  areaResults: AreaResult[];
  findings: Finding[];
  remediation: RemediationStep[];
  date: string;
}

/** Turn report data into PDF text blocks (R5.1, R5.2). */
export function reportToBlocks(data: ReportData): Block[] {
  const blocks: Block[] = [
    { kind: "h1", text: "HIPAA Compliance Report" },
    { kind: "p", text: `${data.companyName} — ${data.date}` },
    { kind: "p", text: `Overall compliance score: ${data.riskScore}/100` },
    { kind: "spacer" },
    { kind: "h2", text: "Executive Summary" },
    { kind: "p", text: data.executiveSummary },
    { kind: "h2", text: "Risk Assessment by Area" },
  ];

  for (const area of data.areaResults) {
    blocks.push({
      kind: "p",
      text: `${HIPAA_AREA_LABELS[area.area as HipaaArea]}: ${area.score}/100`,
    });
  }

  blocks.push({ kind: "h2", text: "Detailed Findings" });
  if (data.findings.length === 0) {
    blocks.push({ kind: "p", text: "No findings recorded." });
  } else {
    data.findings.forEach((f, i) => {
      blocks.push({ kind: "p", text: `${i + 1}. [${f.severity}] ${f.title}` });
      blocks.push({ kind: "p", text: `   ${f.detail}` });
    });
  }

  blocks.push({ kind: "h2", text: "Remediation Roadmap" });
  data.remediation.forEach((step) => {
    blocks.push({
      kind: "p",
      text: `${step.priority}. ${step.action} (${step.estimatedEffort} effort, ${step.severity})`,
    });
  });

  return blocks;
}
