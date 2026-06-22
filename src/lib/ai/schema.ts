import { z } from "zod";
import { RISK_SEVERITIES } from "@/types/domain";

/**
 * Zod schema for validating Claude's JSON response per area (design §5).
 * Malformed responses are rejected and trigger a retry / inconclusive handling.
 */
export const areaResponseSchema = z.object({
  score: z.number().int().min(0).max(100),
  findings: z
    .array(
      z.object({
        severity: z.enum(RISK_SEVERITIES),
        title: z.string().min(1).max(200),
        detail: z.string().min(1).max(2000),
        evidence: z
          .array(
            z.object({
              documentName: z.string().max(300),
              excerpt: z.string().max(2000),
            }),
          )
          .default([]),
      }),
    )
    .default([]),
  recommendations: z.array(z.string().max(1000)).default([]),
});

export type AreaResponse = z.infer<typeof areaResponseSchema>;

/** Parse a model text response into validated JSON, tolerating code fences. */
export function parseAreaResponse(raw: string): AreaResponse | null {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  try {
    const json: unknown = JSON.parse(cleaned);
    const result = areaResponseSchema.safeParse(json);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}
