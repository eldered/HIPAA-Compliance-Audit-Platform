import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getPrimaryWorkspace } from "@/server/services/dashboard-data";
import { NewAuditFlow } from "@/components/dashboard/new-audit-flow";

export default async function NewAuditPage() {
  const session = await getSession();
  const workspace = await getPrimaryWorkspace(session!.user.id);
  if (!workspace) redirect("/onboarding");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Run a new audit</h1>
        <p className="text-sm text-muted-foreground">
          Select documents and an audit type. Processing runs in the background — you&apos;ll get
          an email when the report is ready.
        </p>
      </div>
      <NewAuditFlow workspaceId={workspace.id} />
    </div>
  );
}
