import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getPrimaryWorkspace } from "@/server/services/dashboard-data";
import { DocumentManager } from "@/components/dashboard/document-manager";

export default async function DocumentsPage() {
  const session = await getSession();
  const workspace = await getPrimaryWorkspace(session!.user.id);
  if (!workspace) redirect("/onboarding");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Documents</h1>
        <p className="text-sm text-muted-foreground">
          Upload and organize the documentation your audits analyze.
        </p>
      </div>
      <DocumentManager workspaceId={workspace.id} />
    </div>
  );
}
