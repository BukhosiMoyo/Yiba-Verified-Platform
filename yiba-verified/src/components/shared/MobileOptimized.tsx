"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * MobileOptimized Component
 * 
 * Provides responsive spacing and layout optimizations for mobile devices.
 */
export function MobileOptimized({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6", className)}>
      {children}
    </div>
  );
}

/**
 * ResponsiveGrid Component
 * 
 * Grid that adapts from 1 column (mobile) to multiple columns (desktop).
 */
export function ResponsiveGrid({
  children,
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 4,
  className,
}: {
  children: ReactNode;
  cols?: { mobile?: number; tablet?: number; desktop?: number };
  gap?: 2 | 4 | 6 | 8;
  className?: string;
}) {
  const gridCols = {
    mobile: cols.mobile || 1,
    tablet: cols.tablet || 2,
    desktop: cols.desktop || 3,
  };

  return (
    <div
      className={cn(
        `grid grid-cols-${gridCols.mobile} md:grid-cols-${gridCols.tablet} lg:grid-cols-${gridCols.desktop}`,
        `gap-${gap}`,
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * ResponsiveText Component
 * 
 * Text with responsive font sizes.
 */
export function ResponsiveText({
  as: Component = "p",
  children,
  size = "base",
  className,
}: {
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span";
  children: ReactNode;
  size?: "sm" | "base" | "lg" | "xl" | "2xl" | "3xl";
  className?: string;
}) {
  const sizeClasses = {
    sm: "text-sm md:text-base",
    base: "text-base md:text-lg",
    lg: "text-lg md:text-xl",
    xl: "text-xl md:text-2xl",
    "2xl": "text-2xl md:text-3xl",
    "3xl": "text-3xl md:text-4xl",
  };

  const componentClasses = {
    h1: "font-bold",
    h2: "font-semibold",
    h3: "font-semibold",
    h4: "font-medium",
    p: "",
    span: "",
  };

  return (
    <Component
      className={cn(
        sizeClasses[size],
        componentClasses[Component],
        className
      )}
    >
      {children}
    </Component>
  );
}

/**
 * TouchFriendlyButton Component
 * 
 * Button with increased touch target size for mobile.
 */
export function TouchFriendlyButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "min-h-[44px] min-w-[44px] px-4 py-2 md:px-3 md:py-1.5",
        "text-base md:text-sm",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
