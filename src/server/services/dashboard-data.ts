import { prisma } from "@/lib/db/prisma";

/** The user's primary (first) workspace, or null if onboarding is incomplete. */
export async function getPrimaryWorkspace(userId: string) {
  return prisma.workspace.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
}

/** Aggregate dashboard overview data for a workspace (R6.1). */
export async function getDashboardOverview(workspaceId: string) {
  const [recentAudits, history, latest] = await Promise.all([
    prisma.audit.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        auditType: true,
        status: true,
        complianceScore: true,
        createdAt: true,
      },
    }),
    prisma.auditHistory.findMany({
      where: { workspaceId },
      orderBy: { auditDate: "asc" },
      select: { score: true, auditDate: true, passedItems: true, failedItems: true },
    }),
    prisma.audit.findFirst({
      where: { workspaceId, status: "COMPLETED" },
      orderBy: { completedAt: "desc" },
      select: { complianceScore: true },
    }),
  ]);

  return {
    recentAudits,
    trend: history.map((h) => ({
      date: h.auditDate.toISOString().slice(0, 10),
      score: h.score,
    })),
    latestScore: latest?.complianceScore ?? null,
    totalAudits: history.length,
  };
}
