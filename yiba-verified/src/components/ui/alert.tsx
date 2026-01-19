"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { X, CheckCircle2, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 transition-all duration-150",
  {
    variants: {
      variant: {
        default: "border-gray-200/60 bg-gray-50 text-gray-900",
        success: "border-green-200/60 bg-green-50/50 text-green-900",
        warning: "border-amber-200/60 bg-amber-50/50 text-amber-900",
        error: "border-red-200/60 bg-red-50/50 text-red-900",
        info: "border-blue-200/60 bg-blue-50/50 text-blue-900",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const alertIconVariants = cva("h-5 w-5 shrink-0", {
  variants: {
    variant: {
      default: "text-gray-600",
      success: "text-green-600",
      warning: "text-amber-600",
      error: "text-red-600",
      info: "text-blue-600",
    },
  },
});

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  title?: string;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  action?: React.ReactNode;
}

/**
 * Alert Component
 * 
 * Inline alert component for displaying success, warning, error, and info messages.
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <Alert variant="success" title="Saved" description="Your changes have been saved." />
 * 
 * // With dismiss button
 * <Alert 
 *   variant="warning" 
 *   title="Warning" 
 *   description="This action cannot be undone."
 *   dismissible
 *   onDismiss={() => setShowAlert(false)}
 * />
 * 
 * // With action button
 * <Alert 
 *   variant="error" 
 *   title="Error" 
 *   description="Failed to save changes."
 *   action={<Button size="sm">Retry</Button>}
 * />
 * 
 * // Custom icon
 * <Alert 
 *   variant="info" 
 *   title="Info" 
 *   description="New features available."
 *   icon={<CustomIcon />}
 * />
 * ```
 */
const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      className,
      variant,
      title,
      description,
      icon,
      dismissible,
      onDismiss,
      action,
      ...props
    },
    ref
  ) => {
    const [isDismissed, setIsDismissed] = React.useState(false);

    const handleDismiss = () => {
      setIsDismissed(true);
      if (onDismiss) {
        onDismiss();
      }
    };

    // Get default icon based on variant
    const getDefaultIcon = () => {
      switch (variant) {
        case "success":
          return <CheckCircle2 className={cn(alertIconVariants({ variant }))} strokeWidth={1.5} />;
        case "warning":
          return <AlertTriangle className={cn(alertIconVariants({ variant }))} strokeWidth={1.5} />;
        case "error":
          return <AlertCircle className={cn(alertIconVariants({ variant }))} strokeWidth={1.5} />;
        case "info":
          return <Info className={cn(alertIconVariants({ variant }))} strokeWidth={1.5} />;
        default:
          return <Info className={cn(alertIconVariants({ variant: "default" }))} strokeWidth={1.5} />;
      }
    };

    const displayIcon = icon !== undefined ? icon : getDefaultIcon();

    if (isDismissed) {
      return null;
    }

    return (
      <div
        ref={ref}
        role="alert"
        aria-live={variant === "error" ? "assertive" : "polite"}
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          {displayIcon && (
            <div className="mt-0.5 shrink-0">
              {displayIcon}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            {title && (
              <h4 className={cn(
                "text-sm font-semibold leading-tight mb-1",
                variant === "success" && "text-green-900",
                variant === "warning" && "text-amber-900",
                variant === "error" && "text-red-900",
                variant === "info" && "text-blue-900",
                variant === "default" && "text-gray-900"
              )}>
                {title}
              </h4>
            )}
            {description && (
              <div className={cn(
                "text-sm leading-relaxed",
                variant === "success" && "text-green-700/80",
                variant === "warning" && "text-amber-700/80",
                variant === "error" && "text-red-700/80",
                variant === "info" && "text-blue-700/80",
                variant === "default" && "text-gray-600"
              )}>
                {description}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-start gap-2 shrink-0">
            {action && (
              <div className="mt-0.5">
                {action}
              </div>
            )}
            {dismissible && (
              <button
                type="button"
                className="h-6 w-6 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 transition-colors duration-150 flex items-center justify-center"
                onClick={handleDismiss}
                aria-label="Dismiss alert"
              >
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
);
Alert.displayName = "Alert";

export { Alert, alertVariants };
