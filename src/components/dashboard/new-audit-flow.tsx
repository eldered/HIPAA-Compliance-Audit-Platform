"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AUDIT_TYPES, type AuditType, type DocumentType } from "@/types/domain";

interface Doc {
  id: string;
  fileName: string;
  documentType: DocumentType;
}

const AUDIT_TYPE_LABELS: Record<AuditType, string> = {
  FULL: "Full audit (all HIPAA areas)",
  FOCUSED: "Focused (weighted to high-impact controls)",
  QUICK_CHECK: "Quick check (access & encryption first)",
};

export function NewAuditFlow({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const [docs, setDocs] = React.useState<Doc[]>([]);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [auditType, setAuditType] = React.useState<AuditType>("FULL");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/documents?workspaceId=${workspaceId}`);
      if (res.ok) {
        const data = (await res.json()) as { documents: Doc[] };
        setDocs(data.documents);
      }
    })();
  }, [workspaceId]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function start() {
    setError(null);
    setSubmitting(true);
    const res = await fetch("/api/audits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspaceId,
        documentIds: Array.from(selected),
        auditType,
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Could not start the audit.");
      return;
    }
    router.push("/audits");
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>1. Select documents</CardTitle>
        </CardHeader>
        <CardContent>
          {docs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No documents yet.{" "}
              <Link href="/documents" className="text-brand hover:underline">
                Upload some first
              </Link>
              .
            </p>
          ) : (
            <ul className="space-y-2">
              {docs.map((doc) => (
                <li key={doc.id}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-md border border-border p-3 text-sm hover:bg-muted">
                    <input
                      type="checkbox"
                      checked={selected.has(doc.id)}
                      onChange={() => toggle(doc.id)}
                    />
                    <span className="font-medium">{doc.fileName}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {doc.documentType}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Choose audit type</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {AUDIT_TYPES.map((t) => (
            <label
              key={t}
              className="flex cursor-pointer items-center gap-3 rounded-md border border-border p-3 text-sm hover:bg-muted"
            >
              <input
                type="radio"
                name="auditType"
                checked={auditType === t}
                onChange={() => setAuditType(t)}
              />
              {AUDIT_TYPE_LABELS[t]}
            </label>
          ))}
        </CardContent>
      </Card>

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button disabled={selected.size === 0 || submitting} onClick={start}>
        {submitting ? "Starting audit…" : "Run audit"}
      </Button>
    </div>
  );
}
