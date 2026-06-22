import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";

/**
 * Authenticated shell for the SaaS dashboard. Middleware already blocks
 * unauthenticated access; this is a defense-in-depth check (R1.7).
 * The onboarding route lives under this group but renders without the nav.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="flex">
      <DashboardNav />
      <div className="flex-1">
        <main className="container py-8">{children}</main>
      </div>
    </div>
  );
}
