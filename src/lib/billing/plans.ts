import type { Plan } from "@/types/domain";

/**
 * Plan entitlements — the single source of truth for quotas, limits, and
 * feature gating across the app. See requirements §5.
 */
export interface PlanEntitlements {
  /** Display name. */
  label: string;
  /** Monthly price in USD (null = custom / contact sales). */
  priceUsd: number | null;
  /**
   * Audits allowed per billing period.
   * `Infinity` = unlimited, a finite number = monthly quota.
   */
  auditsPerMonth: number;
  /** Total storage allowance in bytes. */
  storageBytes: number;
  /** Report depth offered. */
  reportDepth: "BASIC" | "DETAILED";
  /** Whether continuous monitoring is available. */
  continuousMonitoring: boolean;
  /** Stripe price id env var name (resolved at runtime; null for non-billable). */
  stripePriceEnv: string | null;
}

const GB = 1024 * 1024 * 1024;
const MB = 1024 * 1024;

export const PLAN_ENTITLEMENTS: Record<Plan, PlanEntitlements> = {
  FREE_TRIAL: {
    label: "Free Trial",
    priceUsd: 0,
    auditsPerMonth: 1, // lifetime single audit, enforced via User.freeAuditUsed
    storageBytes: 100 * MB,
    reportDepth: "BASIC",
    continuousMonitoring: false,
    stripePriceEnv: null,
  },
  STARTER: {
    label: "Starter",
    priceUsd: 99,
    auditsPerMonth: 1,
    storageBytes: 500 * MB,
    reportDepth: "BASIC",
    continuousMonitoring: false,
    stripePriceEnv: "STRIPE_PRICE_STARTER",
  },
  PROFESSIONAL: {
    label: "Professional",
    priceUsd: 299,
    auditsPerMonth: Number.POSITIVE_INFINITY,
    storageBytes: 5 * GB,
    reportDepth: "DETAILED",
    continuousMonitoring: false,
    stripePriceEnv: "STRIPE_PRICE_PROFESSIONAL",
  },
  ENTERPRISE: {
    label: "Enterprise",
    priceUsd: null,
    auditsPerMonth: Number.POSITIVE_INFINITY,
    storageBytes: 100 * GB,
    reportDepth: "DETAILED",
    continuousMonitoring: true,
    stripePriceEnv: null,
  },
};

export function getEntitlements(plan: Plan): PlanEntitlements {
  return PLAN_ENTITLEMENTS[plan];
}

/** Whether a new upload of `incomingBytes` keeps the workspace within plan storage. */
export function canUpload(plan: Plan, usedBytes: number, incomingBytes: number): boolean {
  return usedBytes + incomingBytes <= getEntitlements(plan).storageBytes;
}

/**
 * Whether a new audit is allowed.
 * For FREE_TRIAL, `freeAuditUsed` gates the single lifetime audit.
 * For metered plans, `auditsThisPeriod` is compared to the monthly quota.
 */
export function canRunAudit(args: {
  plan: Plan;
  freeAuditUsed: boolean;
  auditsThisPeriod: number;
}): boolean {
  const { plan, freeAuditUsed, auditsThisPeriod } = args;
  if (plan === "FREE_TRIAL") return !freeAuditUsed;
  return auditsThisPeriod < getEntitlements(plan).auditsPerMonth;
}
