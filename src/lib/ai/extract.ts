/**
 * Document text extraction.
 *
 * TXT/CSV are decoded directly. For PDF/DOCX/XLSX a best-effort UTF-8 decode is
 * used here to avoid heavy native deps in the MVP; swap in dedicated parsers
 * (pdf-parse, mammoth, xlsx) behind this function for production-grade fidelity.
 * The function signature is intentionally stable so callers don't change.
 */
export function extractText(fileName: string, bytes: Buffer): string {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";

  if (ext === "txt" || ext === "csv") {
    return bytes.toString("utf-8");
  }

  // Best-effort: decode and keep readable ASCII/Unicode runs.
  const decoded = bytes.toString("utf-8");
  const readable = decoded
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, " ")
    .replace(/\s{3,}/g, "  ")
    .trim();

  return readable.length > 0 ? readable : "[Unable to extract readable text from this document]";
}

/** Combine multiple documents into a single labeled corpus for analysis. */
export function buildCorpus(docs: { fileName: string; text: string }[]): string {
  return docs
    .map((d) => `### Document: ${d.fileName}\n${d.text}`)
    .join("\n\n---\n\n");
}
