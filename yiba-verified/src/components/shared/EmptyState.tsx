import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type EmptyStateVariant = "default" | "no-results" | "permission-limited";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    href: string;
  };
  secondaryAction?: {
    label: string;
    href: string;
  };
  icon?: ReactNode;
  variant?: EmptyStateVariant;
  className?: string;
}

/**
 * EmptyState Component
 * 
 * Premium empty state component for displaying when no data is available.
 * 
 * @example
 * ```tsx
 * <EmptyState
 *   title="No documents found"
 *   description="Upload your first document to get started."
 *   action={{ label: "Upload Document", href: "/upload" }}
 *   variant="no-results"
 * />
 * ```
 */
export function EmptyState({
  title,
  description,
  action,
  secondaryAction,
  icon,
  variant = "default",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-6 text-center rounded-xl border border-border bg-muted/30",
        className
      )}
    >
      {/* Icon Container */}
      {icon && (
        <div className="mb-5 flex items-center justify-center">
          <div className="rounded-full p-3 bg-muted text-muted-foreground">
            {icon}
          </div>
        </div>
      )}

      {/* Title */}
      <h3 className="text-base font-semibold text-foreground mb-2">{title}</h3>

      {/* Description */}
      {description && (
        <p className="text-sm text-muted-foreground mb-6 max-w-md leading-relaxed">
          {description}
        </p>
      )}

      {/* Actions - only render Link when href is a non-empty string to avoid undefined href */}
      {(action?.href && typeof action.href === "string" && action.href.length > 0) ||
      (secondaryAction?.href && typeof secondaryAction.href === "string" && secondaryAction.href.length > 0) ? (
        <div className="flex items-center gap-3">
          {action && typeof action.href === "string" && action.href.length > 0 && (
            <Button asChild size="sm">
              <Link href={action.href}>{action.label}</Link>
            </Button>
          )}
          {secondaryAction && typeof secondaryAction.href === "string" && secondaryAction.href.length > 0 && (
            <Button variant="ghost" size="sm" asChild>
              <Link href={secondaryAction.href} className="text-muted-foreground hover:text-foreground">
                {secondaryAction.label}
              </Link>
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}
