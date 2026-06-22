import { logger } from "@/lib/utils/logger";

/**
 * Enqueue an audit job (design §6).
 *
 * MVP strategy: fire-and-forget HTTP call to an internal authenticated endpoint
 * so the job runs out-of-band from the request that created the audit. The
 * interface is queue-agnostic, so this can later be swapped for QStash/SQS/etc.
 */
export async function enqueueAudit(auditId: string): Promise<void> {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  const secret = process.env.INTERNAL_JOB_SECRET ?? "";

  // Intentionally not awaited end-to-end: trigger and return.
  void fetch(`${base}/api/internal/run-audit`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-internal-secret": secret },
    body: JSON.stringify({ auditId }),
  }).catch((err) => logger.error("enqueueAudit trigger failed", { auditId, err: String(err) }));
}
