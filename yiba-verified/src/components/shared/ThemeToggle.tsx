"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  variant?: "icon" | "icon-sm";
  className?: string;
  "aria-label"?: string;
};

/**
 * Toggles between light and dark mode. Uses resolvedTheme to switch
 * the currently displayed theme (works with system preference too).
 */
export function ThemeToggle({
  variant = "icon",
  className,
  "aria-label": ariaLabel,
}: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Avoid hydration mismatch: render same icon (Moon) until mounted
  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "shrink-0 rounded-lg border border-transparent text-muted-foreground",
          variant === "icon-sm" && "h-9 w-9",
          className
        )}
        aria-label={ariaLabel ?? "Toggle theme"}
        disabled
      >
        <Moon className="h-4 w-4" strokeWidth={1.5} aria-hidden />
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "shrink-0 rounded-lg border border-transparent text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground",
        variant === "icon-sm" && "h-9 w-9",
        className
      )}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={ariaLabel ?? (isDark ? "Switch to light mode" : "Switch to dark mode")}
    >
      {isDark ? (
        <Sun className="h-4 w-4" strokeWidth={1.5} aria-hidden />
      ) : (
        <Moon className="h-4 w-4" strokeWidth={1.5} aria-hidden />
      )}
    </Button>
  );
}
