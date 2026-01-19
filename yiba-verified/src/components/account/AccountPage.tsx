import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type AccountPageProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function AccountPage({
  title,
  subtitle,
  actions,
  children,
}: AccountPageProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex-shrink-0">{actions}</div>}
      </div>

      {/* Content */}
      <div className="space-y-6">{children}</div>
    </div>
  );
}

type AccountSectionProps = {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function AccountSection({
  title,
  description,
  children,
  className,
}: AccountSectionProps) {
  // Check if this is a danger zone section by checking className for red colors
  const isDangerZone = className?.includes("red") || title?.toLowerCase().includes("danger");
  
  return (
    <Card className={className}>
      <div className="p-6 space-y-4">
        {(title || description) && (
          <div className="space-y-1">
            {title && (
              <h3 className={cn(
                "text-lg font-semibold",
                isDangerZone ? "text-red-900 dark:text-red-100" : "text-gray-900"
              )}>
                {title}
              </h3>
            )}
            {description && (
              <p className={cn(
                "text-sm",
                isDangerZone ? "text-red-700 dark:text-red-300" : "text-gray-500"
              )}>
                {description}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
    </Card>
  );
}