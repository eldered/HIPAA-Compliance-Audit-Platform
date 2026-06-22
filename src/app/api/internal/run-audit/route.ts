import { NextRequest } from "next/server";
import { runAudit } from "@/server/services/audit-engine";
import { fail, ok } from "@/lib/utils/api";

export const runtime = "nodejs";
export const maxDuration = 300; // allow long-running AI processing (Vercel)

/**
 * Internal endpoint that executes an audit job. Protected by a shared secret
 * (design §6) — only callable by the app itself, never by end users.
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-internal-secret");
  if (!secret || secret !== (process.env.INTERNAL_JOB_SECRET ?? "")) {
    return fail("Forbidden", 403, "FORBIDDEN");
  }

  let body: { auditId?: string };
  try {
    body = (await req.json()) as { auditId?: string };
  } catch {
    return fail("Invalid JSON");
  }
  if (!body.auditId) return fail("Missing auditId");

  await runAudit(body.auditId);
  return ok({ ok: true });
}
