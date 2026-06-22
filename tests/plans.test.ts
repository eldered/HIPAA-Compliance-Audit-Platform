import { describe, it, expect } from "vitest";
import { canRunAudit, canUpload, getEntitlements } from "@/lib/billing/plans";

describe("plan entitlements", () => {
  it("free trial allows exactly one lifetime audit", () => {
    expect(canRunAudit({ plan: "FREE_TRIAL", freeAuditUsed: false, auditsThisPeriod: 0 })).toBe(
      true,
    );
    expect(canRunAudit({ plan: "FREE_TRIAL", freeAuditUsed: true, auditsThisPeriod: 0 })).toBe(
      false,
    );
  });

  it("starter enforces a monthly quota of 1", () => {
    expect(canRunAudit({ plan: "STARTER", freeAuditUsed: false, auditsThisPeriod: 0 })).toBe(true);
    expect(canRunAudit({ plan: "STARTER", freeAuditUsed: false, auditsThisPeriod: 1 })).toBe(false);
  });

  it("professional allows unlimited audits", () => {
    expect(
      canRunAudit({ plan: "PROFESSIONAL", freeAuditUsed: false, auditsThisPeriod: 999 }),
    ).toBe(true);
  });

  it("blocks uploads that exceed plan storage", () => {
    const limit = getEntitlements("STARTER").storageBytes;
    expect(canUpload("STARTER", limit - 10, 5)).toBe(true);
    expect(canUpload("STARTER", limit - 10, 50)).toBe(false);
  });
});
