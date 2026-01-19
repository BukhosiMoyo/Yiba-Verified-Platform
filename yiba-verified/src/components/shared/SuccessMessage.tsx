import { CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SuccessMessageProps {
  message: string;
  onDismiss?: () => void;
  className?: string;
}

/**
 * SuccessMessage Component
 * 
 * Displays user-friendly success messages with consistent styling.
 */
export function SuccessMessage({
  message,
  onDismiss,
  className,
}: SuccessMessageProps) {
  return (
    <div
      className={cn(
        "rounded-md border border-green-200 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200 dark:border-green-800 p-4 flex items-start gap-3",
        className
      )}
    >
      <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-medium">Success</p>
        <p className="text-sm mt-1">{message}</p>
      </div>
      {onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 flex-shrink-0 text-green-800 hover:text-green-900 hover:bg-green-100 dark:text-green-200"
          onClick={onDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
