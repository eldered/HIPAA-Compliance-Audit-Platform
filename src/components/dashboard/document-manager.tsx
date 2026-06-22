"use client";

import * as React from "react";
import { Trash2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DOCUMENT_TYPES, type DocumentType } from "@/types/domain";

interface Doc {
  id: string;
  fileName: string;
  documentType: DocumentType;
  sizeBytes: number;
  uploadDate: string;
}

const TYPE_LABELS: Record<DocumentType, string> = {
  POLICIES: "Policies",
  IT_INFRASTRUCTURE: "IT Infrastructure",
  PATIENT_DATA_HANDLING: "Patient Data Handling",
  ADMIN_DOCS: "Admin Docs",
};

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function DocumentManager({ workspaceId }: { workspaceId: string }) {
  const [docs, setDocs] = React.useState<Doc[]>([]);
  const [storage, setStorage] = React.useState({ usedBytes: 0, limitBytes: 1 });
  const [docType, setDocType] = React.useState<DocumentType>("POLICIES");
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    const res = await fetch(`/api/documents?workspaceId=${workspaceId}`);
    if (res.ok) {
      const data = (await res.json()) as { documents: Doc[]; storage: typeof storage };
      setDocs(data.documents);
      setStorage(data.storage);
    }
  }, [workspaceId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    form.append("workspaceId", workspaceId);
    form.append("documentType", docType);
    const res = await fetch("/api/documents/upload", { method: "POST", body: form });
    setUploading(false);
    e.target.value = "";
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Upload failed");
      return;
    }
    await load();
  }

  async function onDelete(id: string) {
    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (res.ok) await load();
  }

  const pct = Math.min(100, Math.round((storage.usedBytes / storage.limitBytes) * 100));
  const atLimit = storage.usedBytes >= storage.limitBytes;

  const grouped = DOCUMENT_TYPES.map((t) => ({
    type: t,
    items: docs.filter((d) => d.documentType === t),
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload a document</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <select
              className="h-10 rounded-md border border-border bg-white px-3 text-sm"
              value={docType}
              onChange={(e) => setDocType(e.target.value as DocumentType)}
            >
              {DOCUMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABELS[t]}
                </option>
              ))}
            </select>
            <label className="inline-flex">
              <input
                type="file"
                className="hidden"
                accept=".pdf,.docx,.xlsx,.txt,.csv"
                onChange={onUpload}
                disabled={uploading || atLimit}
              />
              <span className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md bg-brand px-4 text-sm font-medium text-white hover:bg-brand-600">
                <UploadCloud className="h-4 w-4" />
                {uploading ? "Uploading…" : "Choose file"}
              </span>
            </label>
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {formatBytes(storage.usedBytes)} of {formatBytes(storage.limitBytes)} used
              </span>
              <span>{pct}%</span>
            </div>
            <div className="mt-1 h-2 w-full rounded-full bg-muted">
              <div
                className={`h-2 rounded-full ${atLimit ? "bg-danger" : "bg-brand"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            {atLimit && (
              <p className="mt-1 text-xs text-danger">
                Storage limit reached. Upgrade your plan to add more documents.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {grouped.map((group) => (
        <Card key={group.type}>
          <CardHeader>
            <CardTitle className="text-base">{TYPE_LABELS[group.type]}</CardTitle>
          </CardHeader>
          <CardContent>
            {group.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No documents in this category.</p>
            ) : (
              <ul className="divide-y divide-border">
                {group.items.map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium">{doc.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatBytes(doc.sizeBytes)} ·{" "}
                        {new Date(doc.uploadDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="muted">{TYPE_LABELS[doc.documentType]}</Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(doc.id)}
                        aria-label="Delete document"
                      >
                        <Trash2 className="h-4 w-4 text-danger" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
