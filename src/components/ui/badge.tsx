import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";
import type { RiskSeverity } from "@/types/domain";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-brand text-white",
        success: "border-transparent bg-success/10 text-success-fg",
        danger: "border-transparent bg-danger/10 text-danger-fg",
        warning: "border-transparent bg-amber-100 text-amber-800",
        muted: "border-transparent bg-muted text-muted-foreground",
        outline: "border-border text-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

/** Map a HIPAA risk severity to a badge variant for consistent coloring. */
export function severityVariant(severity: RiskSeverity): BadgeProps["variant"] {
  switch (severity) {
    case "CRITICAL":
    case "HIGH":
      return "danger";
    case "MEDIUM":
      return "warning";
    case "LOW":
      return "muted";
  }
}

export { Badge, badgeVariants };
