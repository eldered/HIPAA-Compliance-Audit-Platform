import { describe, it, expect } from "vitest";
import {
  buildRemediationRoadmap,
  computeOverallScore,
  countPassFail,
  missingAreas,
} from "@/lib/ai/scoring";
import type { AreaResult, Finding } from "@/types/domain";

const finding = (overrides: Partial<Finding> = {}): Finding => ({
  area: "ACCESS_CONTROL",
  severity: "MEDIUM",
  title: "Sample finding",
  detail: "detail",
  evidence: [],
  ...overrides,
});

describe("computeOverallScore", () => {
  it("returns equal-weight average for FULL audits", () => {
    const results: AreaResult[] = [
      { area: "ACCESS_CONTROL", score: 80, findings: [] },
      { area: "DATA_ENCRYPTION", score: 60, findings: [] },
    ];
    expect(computeOverallScore(results, "FULL")).toBe(70);
  });

  it("weights access control and encryption higher for QUICK_CHECK", () => {
    const results: AreaResult[] = [
      { area: "ACCESS_CONTROL", score: 90, findings: [] }, // weight 3
      { area: "WORKFORCE_TRAINING", score: 50, findings: [] }, // weight 0.5
    ];
    // (90*3 + 50*0.5) / 3.5 = 295/3.5 ≈ 84.28 -> 84
    expect(computeOverallScore(results, "QUICK_CHECK")).toBe(84);
  });

  it("clamps out-of-range scores", () => {
    const results: AreaResult[] = [
      { area: "ACCESS_CONTROL", score: 150, findings: [] },
      { area: "DATA_ENCRYPTION", score: -20, findings: [] },
    ];
    // clamps to 100 and 0 -> average 50
    expect(computeOverallScore(results, "FULL")).toBe(50);
  });

  it("returns 0 when no areas were evaluated", () => {
    expect(computeOverallScore([], "FULL")).toBe(0);
  });
});

describe("countPassFail", () => {
  it("treats CRITICAL and HIGH as failed items", () => {
    const findings = [
      finding({ severity: "CRITICAL" }),
      finding({ severity: "HIGH" }),
      finding({ severity: "MEDIUM" }),
      finding({ severity: "LOW" }),
    ];
    expect(countPassFail(findings)).toEqual({ passed: 2, failed: 2 });
  });
});

describe("buildRemediationRoadmap", () => {
  it("orders by severity with critical first and assigns sequential priority", () => {
    const findings = [
      finding({ severity: "LOW", title: "low" }),
      finding({ severity: "CRITICAL", title: "crit" }),
      finding({ severity: "MEDIUM", title: "med" }),
    ];
    const roadmap = buildRemediationRoadmap(findings);
    expect(roadmap.map((r) => r.severity)).toEqual(["CRITICAL", "MEDIUM", "LOW"]);
    expect(roadmap.map((r) => r.priority)).toEqual([1, 2, 3]);
    expect(roadmap[0]?.estimatedEffort).toBe("HIGH");
  });
});

describe("missingAreas", () => {
  it("lists catalog areas not present in results", () => {
    const results: AreaResult[] = [{ area: "ACCESS_CONTROL", score: 100, findings: [] }];
    const missing = missingAreas(results);
    expect(missing).toContain("DATA_ENCRYPTION");
    expect(missing).not.toContain("ACCESS_CONTROL");
    expect(missing).toHaveLength(6);
  });
});
