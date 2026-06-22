import { prisma } from "@/lib/db/prisma";
import { canRunAudit } from "@/lib/billing/plans";
import type { AuditType, Plan } from "@/types/domain";

/** Count audits created in the current calendar month for a workspace. */
async function auditsThisMonth(workspaceId: string): Promise<number> {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  return prisma.audit.count({
    where: { workspaceId, createdAt: { gte: start } },
  });
}

export class QuotaExceededError extends Error {
  constructor() {
    super("Audit quota exhausted for your plan.");
    this.name = "QuotaExceededError";
  }
}

export interface CreateAuditInput {
  userId: string;
  workspaceId: string;
  documentIds: string[];
  auditType: AuditType;
  plan: Plan;
}

/**
 * Create an audit after enforcing plan quota (R4.1, R4.6).
 * Returns the created audit in PENDING status. Caller enqueues the job.
 */
export async function createAudit(input: CreateAuditInput) {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { freeAuditUsed: true },
  });
  if (!user) throw new Error("User not found");

  const used = await auditsThisMonth(input.workspaceId);
  const allowed = canRunAudit({
    plan: input.plan,
    freeAuditUsed: user.freeAuditUsed,
    auditsThisPeriod: used,
  });
  if (!allowed) throw new QuotaExceededError();

  // Validate the documents belong to the workspace.
  const docs = await prisma.document.findMany({
    where: { id: { in: input.documentIds }, workspaceId: input.workspaceId, deletedAt: null },
    select: { id: true },
  });
  if (docs.length === 0) throw new Error("No valid documents for this workspace");

  const audit = await prisma.audit.create({
    data: {
      workspaceId: input.workspaceId,
      auditType: input.auditType,
      status: "PENDING",
      documents: { connect: docs.map((d) => ({ id: d.id })) },
    },
  });

  // For free trial, mark the lifetime audit as consumed.
  if (input.plan === "FREE_TRIAL") {
    await prisma.user.update({
      where: { id: input.userId },
      data: { freeAuditUsed: true },
    });
  }

  return audit;
}
