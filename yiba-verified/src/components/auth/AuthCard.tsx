import React from "react";
import { cn } from "@/lib/utils";

interface AuthCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function AuthCard({
  children,
  title,
  subtitle,
  header,
  footer,
  className,
}: AuthCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/70 bg-card p-8 sm:p-9 shadow-[var(--shadow-card)] dark:shadow-[var(--shadow-soft)] dark:border-border/80",
        className
      )}
    >
      {(title || subtitle || header) && (
        <div className="mb-6">
          {header ? (
            header
          ) : (
            <>
              {title && (
                <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
              )}
              {subtitle && (
                <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
              )}
            </>
          )}
        </div>
      )}
      <div>{children}</div>
      {footer && <div className="mt-6">{footer}</div>}
    </div>
  );
}
