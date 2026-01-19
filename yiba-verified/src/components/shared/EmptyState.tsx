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
        "flex flex-col items-center justify-center py-16 px-6 text-center rounded-xl border border-gray-200/60 bg-gray-50/30",
        className
      )}
    >
      {/* Icon Container */}
      {icon && (
        <div className="mb-5 flex items-center justify-center">
          <div className="rounded-full p-3 bg-gray-100 text-gray-400">
            {icon}
          </div>
        </div>
      )}

      {/* Title */}
      <h3 className="text-base font-semibold text-gray-900 mb-2">{title}</h3>

      {/* Description */}
      {description && (
        <p className="text-sm text-gray-500 mb-6 max-w-md leading-relaxed">
          {description}
        </p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3">
          {action && (
            <Button asChild size="sm">
              <Link href={action.href}>{action.label}</Link>
            </Button>
          )}
          {secondaryAction && (
            <Button variant="ghost" size="sm" asChild>
              <Link href={secondaryAction.href} className="text-gray-600 hover:text-gray-900">
                {secondaryAction.label}
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
