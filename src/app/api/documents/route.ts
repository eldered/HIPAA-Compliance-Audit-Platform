import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { fail, ok, unauthorized, forbidden } from "@/lib/utils/api";
import { userOwnsWorkspace } from "@/server/services/authz";
import { getStorageUsed } from "@/server/services/document-service";
import { getEntitlements } from "@/lib/billing/plans";
import type { Plan } from "@/types/domain";

/** List a workspace's documents grouped data + storage usage (R3.4). */
export async function GET(req: NextRequest) {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) return unauthorized();

  const workspaceId = req.nextUrl.searchParams.get("workspaceId");
  if (!workspaceId) return fail("Missing workspaceId");
  if (!(await userOwnsWorkspace(userId, workspaceId))) return forbidden();

  const [documents, used] = await Promise.all([
    prisma.document.findMany({
      where: { workspaceId, deletedAt: null },
      orderBy: { uploadDate: "desc" },
      select: {
        id: true,
        fileName: true,
        documentType: true,
        sizeBytes: true,
        uploadDate: true,
      },
    }),
    getStorageUsed(workspaceId),
  ]);

  const limit = getEntitlements((session.user.plan ?? "FREE_TRIAL") as Plan).storageBytes;

  return ok({
    documents,
    storage: { usedBytes: used, limitBytes: limit },
  });
}
