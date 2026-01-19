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
        "bg-white rounded-2xl border border-gray-200/60 shadow-sm p-7 sm:p-8",
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
                <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
              )}
              {subtitle && (
                <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
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
