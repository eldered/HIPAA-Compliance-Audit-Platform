import { NextRequest } from "next/server";
import { requireUserId, getSession } from "@/lib/auth/session";
import { fail, ok, unauthorized, forbidden } from "@/lib/utils/api";
import { userOwnsWorkspace } from "@/server/services/authz";
import {
  StorageQuotaError,
  uploadDocument,
} from "@/server/services/document-service";
import { isValidDocumentType, validateUpload } from "@/lib/storage/validation";
import type { Plan } from "@/types/domain";

export const runtime = "nodejs";

/** Upload a compliance document (R3.1–R3.3, NFR1.6). Expects multipart/form-data. */
export async function POST(req: NextRequest) {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) return unauthorized();

  const form = await req.formData().catch(() => null);
  if (!form) return fail("Expected multipart/form-data");

  const file = form.get("file");
  const workspaceId = String(form.get("workspaceId") ?? "");
  const documentType = String(form.get("documentType") ?? "");

  if (!(file instanceof File)) return fail("Missing file");
  if (!workspaceId) return fail("Missing workspaceId");
  if (!isValidDocumentType(documentType)) return fail("Invalid document category");

  if (!(await userOwnsWorkspace(userId, workspaceId))) return forbidden();

  const validation = validateUpload({ type: file.type, size: file.size });
  if (!validation.ok) return fail(validation.error ?? "Invalid file", 422, "INVALID_FILE");

  const bytes = Buffer.from(await file.arrayBuffer());

  try {
    const doc = await uploadDocument({
      workspaceId,
      plan: (session.user.plan ?? "FREE_TRIAL") as Plan,
      fileName: file.name,
      contentType: file.type,
      documentType,
      bytes,
    });
    return ok(
      {
        document: {
          id: doc.id,
          fileName: doc.fileName,
          documentType: doc.documentType,
          sizeBytes: doc.sizeBytes,
          uploadDate: doc.uploadDate,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof StorageQuotaError) {
      return fail(err.message, 402, "STORAGE_LIMIT");
    }
    throw err;
  }
}
