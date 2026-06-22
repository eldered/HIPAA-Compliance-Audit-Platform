import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="container flex flex-col gap-4 py-10 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 font-semibold text-brand">
          <ShieldCheck className="h-5 w-5" />
          VivAudit
        </div>
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} VivAudit. HIPAA Compliance Made Simple.
        </p>
        <nav className="flex gap-6 text-sm text-muted-foreground">
          <Link href="/pricing" className="hover:text-foreground">
            Pricing
          </Link>
          <Link href="/security" className="hover:text-foreground">
            Security &amp; Privacy
          </Link>
          <Link href="/login" className="hover:text-foreground">
            Log in
          </Link>
        </nav>
      </div>
    </footer>
  );
}
