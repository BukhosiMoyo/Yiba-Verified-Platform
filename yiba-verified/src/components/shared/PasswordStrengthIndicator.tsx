"use client";

import { checkPasswordStrength, getStrengthColor, getStrengthLabel, type PasswordStrength } from "@/lib/password-strength";
import { cn } from "@/lib/utils";

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
  showFeedback?: boolean;
}

export function PasswordStrengthIndicator({
  password,
  className,
  showFeedback = true,
}: PasswordStrengthIndicatorProps) {
  if (!password) return null;

  const result = checkPasswordStrength(password);
  const colorClasses = getStrengthColor(result.strength);
  const label = getStrengthLabel(result.strength);

  // Calculate progress bar width (0-100%)
  const progressWidth = (result.score / 4) * 100;

  return (
    <div className={cn("space-y-2", className)}>
      {/* Strength bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium">Password strength:</span>
          <span className={cn("font-semibold px-2 py-0.5 rounded border", colorClasses)}>
            {label}
          </span>
        </div>
        <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-300 ease-out",
              result.strength === "weak" && "bg-red-500",
              result.strength === "fair" && "bg-orange-500",
              result.strength === "good" && "bg-yellow-500",
              result.strength === "strong" && "bg-green-500"
            )}
            style={{ width: `${progressWidth}%` }}
          />
        </div>
      </div>

      {/* Feedback */}
      {showFeedback && result.feedback.length > 0 && (
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium">To improve your password:</p>
          <ul className="list-disc list-inside space-y-0.5">
            {result.feedback.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Requirements checklist */}
      {showFeedback && password.length >= 8 && (
        <div className="text-xs space-y-1">
          <p className="font-medium text-muted-foreground">Requirements:</p>
          <div className="grid grid-cols-2 gap-1">
            <div className="flex items-center gap-1.5">
              <span className={password.length >= 8 ? "text-green-600" : "text-gray-400"}>
                {password.length >= 8 ? "✓" : "○"}
              </span>
              <span className={password.length >= 8 ? "text-foreground" : "text-muted-foreground"}>
                8+ characters
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={/[a-z]/.test(password) ? "text-green-600" : "text-gray-400"}>
                {/[a-z]/.test(password) ? "✓" : "○"}
              </span>
              <span className={/[a-z]/.test(password) ? "text-foreground" : "text-muted-foreground"}>
                Lowercase
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={/[A-Z]/.test(password) ? "text-green-600" : "text-gray-400"}>
                {/[A-Z]/.test(password) ? "✓" : "○"}
              </span>
              <span className={/[A-Z]/.test(password) ? "text-foreground" : "text-muted-foreground"}>
                Uppercase
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={/\d/.test(password) ? "text-green-600" : "text-gray-400"}>
                {/\d/.test(password) ? "✓" : "○"}
              </span>
              <span className={/\d/.test(password) ? "text-foreground" : "text-muted-foreground"}>
                Number
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? "text-green-600" : "text-gray-400"}>
                {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? "✓" : "○"}
              </span>
              <span className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? "text-foreground" : "text-muted-foreground"}>
                Special char
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
