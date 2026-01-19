import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
  className?: string;
  variant?: "default" | "destructive" | "warning";
}

/**
 * ErrorMessage Component
 * 
 * Displays user-friendly error messages with consistent styling.
 */
export function ErrorMessage({
  message,
  onDismiss,
  className,
  variant = "destructive",
}: ErrorMessageProps) {
  const variantStyles = {
    default: "bg-muted text-foreground border-border",
    destructive: "bg-destructive/10 text-destructive border-destructive/20",
    warning: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-200",
  };

  return (
    <div
      className={cn(
        "rounded-md border p-4 flex items-start gap-3",
        variantStyles[variant],
        className
      )}
    >
      <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-medium">Error</p>
        <p className="text-sm mt-1">{message}</p>
      </div>
      {onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 flex-shrink-0"
          onClick={onDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
