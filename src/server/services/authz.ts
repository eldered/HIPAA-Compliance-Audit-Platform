import { prisma } from "@/lib/db/prisma";

/**
 * Verify the user owns the workspace (prevents cross-tenant access — design §9).
 * Returns true only if the workspace exists and belongs to the user.
 */
export async function userOwnsWorkspace(userId: string, workspaceId: string): Promise<boolean> {
  const count = await prisma.workspace.count({ where: { id: workspaceId, userId } });
  return count > 0;
}

/** Verify the user owns the audit (via its workspace). */
export async function userOwnsAudit(userId: string, auditId: string): Promise<boolean> {
  const count = await prisma.audit.count({ where: { id: auditId, workspace: { userId } } });
  return count > 0;
}
