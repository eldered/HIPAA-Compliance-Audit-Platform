import type { Metadata } from "next";
import { Lock, KeyRound, FileLock2, ServerCog } from "lucide-react";

export const metadata: Metadata = {
  title: "Security & Privacy",
  description: "How VivAudit protects your practice's data: encryption, access control, and HIPAA-aligned practices.",
};

const ITEMS = [
  { icon: Lock, title: "Encryption everywhere", body: "Data is encrypted in transit (TLS) and at rest." },
  { icon: KeyRound, title: "Access control", body: "Sessions use httpOnly secure cookies; every record is scoped to its owner." },
  { icon: FileLock2, title: "Secure uploads", body: "File type and size are validated; documents are stored with randomized keys and served via signed URLs." },
  { icon: ServerCog, title: "Audit trails", body: "Access to sensitive documents is logged for accountability." },
];

export default function SecurityPage() {
  return (
    <div className="section">
      <div className="container max-w-3xl">
        <h1 className="text-4xl font-bold">Security &amp; Privacy</h1>
        <p className="mt-4 text-muted-foreground">
          VivAudit is built for the trust healthcare practices require. We follow HIPAA-aligned
          security practices and are pursuing SOC 2 Type II for enterprise customers.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {ITEMS.map((item) => (
            <div key={item.title} className="rounded-lg border border-border bg-white p-6">
              <item.icon className="h-6 w-6 text-brand" />
              <h2 className="mt-3 font-semibold">{item.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-10 text-sm text-muted-foreground">
          VivAudit assists with HIPAA compliance assessment and does not constitute legal advice.
          For binding compliance determinations, consult qualified counsel.
        </p>
      </div>
    </div>
  );
}
