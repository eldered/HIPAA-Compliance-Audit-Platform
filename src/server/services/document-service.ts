import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { getStorage } from "@/lib/storage";
import { canUpload } from "@/lib/billing/plans";
import type { DocumentType, Plan } from "@/types/domain";

/** Sum of non-deleted document sizes for a workspace. */
export async function getStorageUsed(workspaceId: string): Promise<number> {
  const agg = await prisma.document.aggregate({
    where: { workspaceId, deletedAt: null },
    _sum: { sizeBytes: true },
  });
  return agg._sum.sizeBytes ?? 0;
}

export interface UploadDocumentInput {
  workspaceId: string;
  plan: Plan;
  fileName: string;
  contentType: string;
  documentType: DocumentType;
  bytes: Buffer;
}

/**
 * Store a document and create its record, enforcing plan storage limits
 * (R3.1, R3.6). Throws on quota violation; the route maps it to a 402/403.
 */
export async function uploadDocument(input: UploadDocumentInput) {
  const used = await getStorageUsed(input.workspaceId);
  if (!canUpload(input.plan, used, input.bytes.length)) {
    throw new StorageQuotaError();
  }

  const storage = getStorage();
  const safeName = input.fileName.replace(/[^\w.\-]+/g, "_");
  const key = `workspaces/${input.workspaceId}/${randomUUID()}-${safeName}`;

  const stored = await storage.upload({
    key,
    body: input.bytes,
    contentType: input.contentType,
  });

  return prisma.document.create({
    data: {
      workspaceId: input.workspaceId,
      fileName: input.fileName,
      fileUrl: stored.url,
      storageKey: stored.key,
      documentType: input.documentType,
      sizeBytes: input.bytes.length,
    },
  });
}

/** Soft-delete a document record and remove the object from storage (R3.5). */
export async function deleteDocument(documentId: string, workspaceId: string) {
  const doc = await prisma.document.findFirst({
    where: { id: documentId, workspaceId, deletedAt: null },
  });
  if (!doc) return null;

  try {
    await getStorage().delete(doc.storageKey);
  } catch {
    // Best-effort: continue with soft-delete even if storage delete fails.
  }

  return prisma.document.update({
    where: { id: doc.id },
    data: { deletedAt: new Date() },
  });
}

export class StorageQuotaError extends Error {
  constructor() {
    super("Storage limit reached for your plan.");
    this.name = "StorageQuotaError";
  }
}
