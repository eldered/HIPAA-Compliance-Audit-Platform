import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { fail, ok, unauthorized, forbidden } from "@/lib/utils/api";
import { userOwnsWorkspace } from "@/server/services/authz";
import { createAudit, QuotaExceededError } from "@/server/services/audit-service";
import { enqueueAudit } from "@/server/services/job-queue";
import { AUDIT_TYPES, type Plan } from "@/types/domain";

const createAuditSchema = z.object({
  workspaceId: z.string().uuid(),
  documentIds: z.array(z.string().uuid()).min(1, "Select at least one document"),
  auditType: z.enum(AUDIT_TYPES).default("FULL"),
});

/** Create a new audit and enqueue processing (R4.1, R4.6). */
export async function POST(req: NextRequest) {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) return unauthorized();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body");
  }

  const parsed = createAuditSchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input", 422, "VALIDATION");
  }

  if (!(await userOwnsWorkspace(userId, parsed.data.workspaceId))) return forbidden();

  try {
    const audit = await createAudit({
      userId,
      workspaceId: parsed.data.workspaceId,
      documentIds: parsed.data.documentIds,
      auditType: parsed.data.auditType,
      plan: (session.user.plan ?? "FREE_TRIAL") as Plan,
    });

    await enqueueAudit(audit.id);

    return ok(
      { audit: { id: audit.id, status: audit.status, auditType: audit.auditType } },
      { status: 202 },
    );
  } catch (err) {
    if (err instanceof QuotaExceededError) return fail(err.message, 402, "QUOTA_EXCEEDED");
    if (err instanceof Error && err.message.includes("No valid documents")) {
      return fail(err.message, 422, "NO_DOCUMENTS");
    }
    throw err;
  }
}

/** List audits for a workspace (R6.2). */
export async function GET(req: NextRequest) {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) return unauthorized();

  const workspaceId = req.nextUrl.searchParams.get("workspaceId");
  if (!workspaceId) return fail("Missing workspaceId");
  if (!(await userOwnsWorkspace(userId, workspaceId))) return forbidden();

  const audits = await prisma.audit.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      auditType: true,
      status: true,
      complianceScore: true,
      createdAt: true,
      completedAt: true,
    },
  });

  return ok({ audits });
}
