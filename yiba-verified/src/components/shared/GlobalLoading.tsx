"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface GlobalLoadingProps {
  /**
   * Minimum delay before showing loading indicator (prevents flash)
   */
  minDelay?: number;
  /**
   * Custom className
   */
  className?: string;
}

/**
 * Global loading indicator that shows during route transitions
 * Uses Next.js App Router pathname changes to detect navigation
 * 
 * Note: Next.js 13+ App Router doesn't have router events like Pages Router.
 * This component uses pathname changes as a proxy for navigation.
 * For more advanced loading states, consider using React Suspense boundaries.
 */
export function GlobalLoading({ minDelay = 150, className }: GlobalLoadingProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    // Show loading indicator when pathname or search params change
    setIsLoading(true);
    
    const timer = setTimeout(() => {
      if (isLoading) {
        setShowLoader(true);
      }
    }, minDelay);

    // Hide loading when navigation completes
    const hideTimer = setTimeout(() => {
      setIsLoading(false);
      setShowLoader(false);
    }, 100);

    return () => {
      clearTimeout(timer);
      clearTimeout(hideTimer);
    };
  }, [pathname, searchParams, isLoading, minDelay]);

  // Don't show loader for very fast navigations
  if (!showLoader) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-50 h-1 bg-transparent pointer-events-none",
        className
      )}
      aria-label="Loading"
      role="status"
    >
      <div className="relative h-full w-full overflow-hidden">
        {/* Progress bar */}
        <div className="absolute inset-0 bg-primary/10" />
        <div
          className="absolute inset-y-0 left-0 bg-primary transition-all duration-500 ease-out animate-pulse"
          style={{
            width: showLoader ? "100%" : "0%",
          }}
        />
      </div>
    </div>
  );
}

/**
 * Simple loading spinner component
 * Use this for inline loading states
 */
export function LoadingSpinner({ 
  size = "md", 
  className 
}: { 
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <Loader2
      className={cn("animate-spin text-primary", sizeClasses[size], className)}
      strokeWidth={1.5}
      aria-label="Loading"
    />
  );
}

/**
 * Loading overlay component
 * Use this for blocking loading states (e.g., during form submission)
 */
export function LoadingOverlay({ 
  message = "Loading...",
  show = true 
}: { 
  message?: string;
  show?: boolean;
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size="lg" />
        {message && (
          <p className="text-sm text-muted-foreground">{message}</p>
        )}
      </div>
    </div>
  );
}
