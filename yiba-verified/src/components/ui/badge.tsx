import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-500/25 dark:text-blue-200 hover:bg-blue-200/80 dark:hover:bg-blue-500/35",
        secondary:
          "border-border bg-muted text-muted-foreground hover:bg-muted/80 dark:border-border dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted/80",
        destructive:
          "border-transparent bg-destructive/15 text-destructive dark:bg-destructive/25 dark:text-red-200 hover:bg-destructive/20 dark:hover:bg-destructive/30",
        success:
          "border-transparent bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/25 dark:text-emerald-200 hover:bg-emerald-500/20 dark:hover:bg-emerald-500/30",
        warning:
          "border-transparent bg-amber-500/15 text-amber-700 dark:bg-amber-500/25 dark:text-amber-200 hover:bg-amber-500/20 dark:hover:bg-amber-500/30",
        outline:
          "border-border bg-transparent text-muted-foreground hover:bg-muted/60 dark:border-border dark:text-muted-foreground dark:hover:bg-muted/60",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
