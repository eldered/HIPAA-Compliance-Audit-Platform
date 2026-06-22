"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  FileSearch,
  FilePlus2,
  FolderOpen,
  Settings,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/audits", label: "Audit History", icon: FileSearch },
  { href: "/audits/new", label: "Run New Audit", icon: FilePlus2 },
  { href: "/documents", label: "Documents", icon: FolderOpen },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-border bg-white">
      <div className="flex h-16 items-center gap-2 border-b border-border px-6 font-bold text-brand">
        <ShieldCheck className="h-6 w-6" />
        VivAudit
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-brand text-white" : "text-muted-foreground hover:bg-muted",
              )}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="flex items-center gap-3 border-t border-border px-6 py-4 text-sm text-muted-foreground hover:text-foreground"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </aside>
  );
}
