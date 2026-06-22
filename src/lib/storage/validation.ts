import type { DocumentType } from "@/types/domain";
import { DOCUMENT_TYPES } from "@/types/domain";

/** Max upload size in bytes (R3.2). */
export const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB

/** Allowed MIME types mapped from supported extensions (R3.1). */
export const ALLOWED_MIME_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-excel": "xls",
  "text/plain": "txt",
  "text/csv": "csv",
};

export interface FileValidationResult {
  ok: boolean;
  error?: string;
}

/** Validate an uploaded file's type and size (R3.1, R3.2, NFR1.6). */
export function validateUpload(file: { type: string; size: number }): FileValidationResult {
  if (!(file.type in ALLOWED_MIME_TYPES)) {
    return { ok: false, error: "Unsupported file type. Allowed: PDF, DOCX, XLSX, TXT, CSV." };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { ok: false, error: "File exceeds the 25 MB limit." };
  }
  if (file.size <= 0) {
    return { ok: false, error: "File is empty." };
  }
  return { ok: true };
}

/** Validate the document category supplied with an upload (R3.3). */
export function isValidDocumentType(value: string): value is DocumentType {
  return (DOCUMENT_TYPES as readonly string[]).includes(value);
}
