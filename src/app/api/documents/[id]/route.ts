import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { ok, unauthorized, forbidden, notFound } from "@/lib/utils/api";
import { deleteDocument } from "@/server/services/document-service";

/** Delete a document (R3.5). */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) return unauthorized();

  // Resolve the document's workspace and verify ownership.
  const doc = await prisma.document.findUnique({
    where: { id: params.id },
    select: { workspaceId: true, workspace: { select: { userId: true } } },
  });
  if (!doc) return notFound("Document");
  if (doc.workspace.userId !== userId) return forbidden();

  const deleted = await deleteDocument(params.id, doc.workspaceId);
  if (!deleted) return notFound("Document");

  return ok({ id: params.id, deleted: true });
}
