/**
 * Shared domain types & enums for VivAudit.
 *
 * These mirror the Prisma schema (prisma/schema.prisma) and are the canonical
 * application-level vocabulary used across API routes, services, and UI.
 * String-literal unions are used (instead of importing the Prisma enums into the
 * client bundle) so types are available in both server and browser contexts.
 */

// ─────────────────────────── Enums (as const unions) ───────────────────────────

export const PLANS = ["FREE_TRIAL", "STARTER", "PROFESSIONAL", "ENTERPRISE"] as const;
export type Plan = (typeof PLANS)[number];

export const DOCUMENT_TYPES = [
  "POLICIES",
  "IT_INFRASTRUCTURE",
  "PATIENT_DATA_HANDLING",
  "ADMIN_DOCS",
] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const AUDIT_TYPES = ["FULL", "FOCUSED", "QUICK_CHECK"] as const;
export type AuditType = (typeof AUDIT_TYPES)[number];

export const AUDIT_STATUSES = ["PENDING", "PROCESSING", "COMPLETED", "FAILED"] as const;
export type AuditStatus = (typeof AUDIT_STATUSES)[number];

export const PAYMENT_STATUSES = ["ACTIVE", "PAST_DUE", "CANCELED", "INCOMPLETE"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const RISK_SEVERITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;
export type RiskSeverity = (typeof RISK_SEVERITIES)[number];

// HIPAA control areas evaluated by the audit engine (design §4).
export const HIPAA_AREAS = [
  "ACCESS_CONTROL",
  "DATA_ENCRYPTION",
  "INCIDENT_RESPONSE",
  "WORKFORCE_TRAINING",
  "PHYSICAL_SECURITY",
  "BUSINESS_ASSOCIATE_AGREEMENTS",
  "PATIENT_CONSENT",
] as const;
export type HipaaArea = (typeof HIPAA_AREAS)[number];

export const HIPAA_AREA_LABELS: Record<HipaaArea, string> = {
  ACCESS_CONTROL: "Access Control",
  DATA_ENCRYPTION: "Data Encryption (at-rest & in-transit)",
  INCIDENT_RESPONSE: "Incident Response",
  WORKFORCE_TRAINING: "Workforce Security Training",
  PHYSICAL_SECURITY: "Physical Security",
  BUSINESS_ASSOCIATE_AGREEMENTS: "Business Associate Agreements",
  PATIENT_CONSENT: "Patient Consent Documentation",
};

// ─────────────────────────── Domain entities ───────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  companyName: string | null;
  plan: Plan;
  stripeCustomerId: string | null;
}

export interface Workspace {
  id: string;
  userId: string;
  companyName: string;
  industry: string | null;
  employeeCount: number | null;
  complianceNotes: string | null;
  createdAt: string;
}

export interface DocumentRecord {
  id: string;
  workspaceId: string;
  auditId: string | null;
  fileName: string;
  fileUrl: string;
  documentType: DocumentType;
  sizeBytes: number;
  uploadDate: string;
}

export interface AuditSummary {
  id: string;
  workspaceId: string;
  auditType: AuditType;
  status: AuditStatus;
  complianceScore: number | null;
  createdAt: string;
  completedAt: string | null;
}

// ─────────────────────────── Report value objects ───────────────────────────

/** A single evidence reference back to an uploaded document. */
export interface Evidence {
  documentId: string;
  documentName: string;
  excerpt: string;
}

/** One observation tied to a HIPAA control area. */
export interface Finding {
  area: HipaaArea;
  severity: RiskSeverity;
  title: string;
  detail: string;
  evidence: Evidence[];
}

/** Per-area score plus its findings. */
export interface AreaResult {
  area: HipaaArea;
  score: number; // 0–100
  findings: Finding[];
}

/** A prioritized remediation action. */
export interface RemediationStep {
  area: HipaaArea;
  severity: RiskSeverity;
  action: string;
  estimatedEffort: "LOW" | "MEDIUM" | "HIGH";
  priority: number; // 1 = highest
}

export interface ComplianceReport {
  auditId: string;
  riskScore: number; // overall 0–100
  executiveSummary: string;
  areaResults: AreaResult[];
  findings: Finding[];
  recommendations: string[];
  remediationSteps: RemediationStep[];
  pdfUrl: string | null;
  createdAt: string;
}

// ─────────────────────────── API payloads ───────────────────────────

export interface CreateAuditRequest {
  workspaceId: string;
  documentIds: string[];
  auditType: AuditType;
}

export interface ApiError {
  error: string;
  code?: string;
}
