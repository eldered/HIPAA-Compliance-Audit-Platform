import {
  HIPAA_AREAS,
  type AreaResult,
  type AuditType,
  type Finding,
  type HipaaArea,
  type RemediationStep,
  type RiskSeverity,
} from "@/types/domain";

/**
 * Per-audit-type weighting of HIPAA areas. Weights need not sum to 1; the
 * overall score is a weighted average so any positive weights work.
 * FOCUSED/QUICK_CHECK emphasize the highest-impact controls.
 */
const AREA_WEIGHTS: Record<AuditType, Record<HipaaArea, number>> = {
  FULL: {
    ACCESS_CONTROL: 1,
    DATA_ENCRYPTION: 1,
    INCIDENT_RESPONSE: 1,
    WORKFORCE_TRAINING: 1,
    PHYSICAL_SECURITY: 1,
    BUSINESS_ASSOCIATE_AGREEMENTS: 1,
    PATIENT_CONSENT: 1,
  },
  FOCUSED: {
    ACCESS_CONTROL: 2,
    DATA_ENCRYPTION: 2,
    INCIDENT_RESPONSE: 1.5,
    WORKFORCE_TRAINING: 1,
    PHYSICAL_SECURITY: 1,
    BUSINESS_ASSOCIATE_AGREEMENTS: 1,
    PATIENT_CONSENT: 1,
  },
  QUICK_CHECK: {
    ACCESS_CONTROL: 3,
    DATA_ENCRYPTION: 3,
    INCIDENT_RESPONSE: 1,
    WORKFORCE_TRAINING: 0.5,
    PHYSICAL_SECURITY: 0.5,
    BUSINESS_ASSOCIATE_AGREEMENTS: 1,
    PATIENT_CONSENT: 1,
  },
};

const SEVERITY_RANK: Record<RiskSeverity, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

const EFFORT_BY_SEVERITY: Record<RiskSeverity, RemediationStep["estimatedEffort"]> = {
  CRITICAL: "HIGH",
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW",
};

function clampScore(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

/**
 * Compute the overall weighted compliance score (0–100) from per-area results.
 * Areas missing from `results` are ignored (e.g., inconclusive areas).
 */
export function computeOverallScore(results: AreaResult[], auditType: AuditType): number {
  const weights = AREA_WEIGHTS[auditType];
  let weightedSum = 0;
  let totalWeight = 0;

  for (const result of results) {
    const weight = weights[result.area] ?? 1;
    weightedSum += clampScore(result.score) * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) return 0;
  return clampScore(weightedSum / totalWeight);
}

/** Count findings that pass vs. fail. A "failed" item is CRITICAL or HIGH severity. */
export function countPassFail(findings: Finding[]): { passed: number; failed: number } {
  let failed = 0;
  for (const f of findings) {
    if (f.severity === "CRITICAL" || f.severity === "HIGH") failed += 1;
  }
  return { passed: findings.length - failed, failed };
}

/**
 * Build a prioritized remediation roadmap from findings.
 * Sorted by severity (critical first); priority is assigned 1..n in that order.
 */
export function buildRemediationRoadmap(findings: Finding[]): RemediationStep[] {
  const sorted = [...findings].sort(
    (a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity],
  );

  return sorted.map((f, index) => ({
    area: f.area,
    severity: f.severity,
    action: `Remediate: ${f.title}`,
    estimatedEffort: EFFORT_BY_SEVERITY[f.severity],
    priority: index + 1,
  }));
}

/** All findings flattened from area results. */
export function collectFindings(results: AreaResult[]): Finding[] {
  return results.flatMap((r) => r.findings);
}

/** Areas that were evaluated, for completeness checks. */
export function evaluatedAreas(results: AreaResult[]): HipaaArea[] {
  return results.map((r) => r.area);
}

/** Areas in the catalog that were NOT evaluated (e.g., inconclusive / missing). */
export function missingAreas(results: AreaResult[]): HipaaArea[] {
  const present = new Set(results.map((r) => r.area));
  return HIPAA_AREAS.filter((area) => !present.has(area));
}
