"use client";

import React from "react";
import { cn } from "@/lib/utils";

/**
 * FixedShellBackground — Same gradient + dot grid as GradientShell, but for use as a
 * fixed viewport layer (e.g. in AppShell). Renders no wrapper; parent must use
 * fixed inset-0 z-0 pointer-events-none. Light/dark behavior matches GradientShell.
 */
export function FixedShellBackground() {
  return (
    <>
      {/* Radial gradient */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background: [
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(37, 99, 235, 0.08), transparent)",
            "radial-gradient(ellipse 60% 40% at 100% 0%, rgba(37, 99, 235, 0.04), transparent)",
            "radial-gradient(ellipse 60% 40% at 0% 100%, rgba(37, 99, 235, 0.03), transparent)",
          ].join(", "),
        }}
        aria-hidden
      />
      {/* Dot grid: light mode */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] opacity-15 dark:hidden"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Ccircle cx='10' cy='10' r='1.5' fill='%2364748b' fill-opacity='0.7'/%3E%3C/svg%3E")`,
        }}
        aria-hidden
      />
      {/* Dot grid: dark mode */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-0 dark:opacity-[0.08]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Ccircle cx='12' cy='12' r='1.5' fill='%23fafafa' fill-opacity='0.4'/%3E%3C/svg%3E")`,
        }}
        aria-hidden
      />
    </>
  );
}

/**
 * GradientShell — Page wrapper with subtle radial gradient + soft dot pattern.
 * Use as outermost wrapper for a section or page. CSS + inline SVG only.
 * Pass decoration="none" to render only the content wrapper (no gradient/dots).
 */
export function GradientShell({
  children,
  className,
  as: Comp = "div",
  decoration = "default",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "main";
  /** "none" = content wrapper only, no gradient/dots (e.g. when using FixedShellBackground elsewhere) */
  decoration?: "default" | "none";
}) {
  return (
    <Comp className={cn("relative overflow-hidden", className)}>
      {decoration === "default" && (
        <>
          {/* Radial gradient: center glow, fades to background */}
          <div
            className="pointer-events-none absolute inset-0 z-0"
            style={{
              background: [
                "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(37, 99, 235, 0.08), transparent)",
                "radial-gradient(ellipse 60% 40% at 100% 0%, rgba(37, 99, 235, 0.04), transparent)",
                "radial-gradient(ellipse 60% 40% at 0% 100%, rgba(37, 99, 235, 0.03), transparent)",
              ].join(", "),
            }}
            aria-hidden
          />
          {/* Dot grid: light mode */}
          <div
            className="pointer-events-none absolute inset-0 z-[1] opacity-15 dark:hidden"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Ccircle cx='10' cy='10' r='1.5' fill='%2364748b' fill-opacity='0.7'/%3E%3C/svg%3E")`,
            }}
            aria-hidden
          />
          {/* Dot grid: dark mode (lighter dots) */}
          <div
            className="pointer-events-none absolute inset-0 z-0 opacity-0 dark:opacity-[0.08]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Ccircle cx='12' cy='12' r='1.5' fill='%23fafafa' fill-opacity='0.4'/%3E%3C/svg%3E")`,
            }}
            aria-hidden
          />
        </>
      )}
      <div className="relative z-[2]">{children}</div>
    </Comp>
  );
}

/**
 * DotGrid — Small SVG dot grid as a pseudo-element-style layer.
 * Place inside a `position: relative` parent. Covers the parent.
 */
export function DotGrid({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 z-0",
        "opacity-[var(--pattern-opacity,0.15)] dark:opacity-[var(--pattern-opacity,0.1)]",
        className
      )}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Ccircle cx='10' cy='10' r='1.2' fill='%2364748b' fill-opacity='0.4'/%3E%3C/svg%3E")`,
      }}
      aria-hidden
    />
  );
}

/**
 * Dark-mode variant of DotGrid (lighter dots for dark bg).
 */
export function DotGridDark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 z-0 hidden dark:block",
        "opacity-[var(--pattern-opacity,0.1)]",
        className
      )}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Ccircle cx='10' cy='10' r='1.2' fill='%23fafafa' fill-opacity='0.25'/%3E%3C/svg%3E")`,
      }}
      aria-hidden
    />
  );
}

/**
 * Glow — Corner glow blob (radial). Works in light and dark.
 * Optional position: top-left, top-right, bottom-left, bottom-right.
 */
export function Glow({
  position = "top-right",
  className,
}: {
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  className?: string;
}) {
  const positions = {
    "top-left": "left-0 top-0 -translate-x-1/2 -translate-y-1/2",
    "top-right": "right-0 top-0 translate-x-1/2 -translate-y-1/2",
    "bottom-left": "left-0 bottom-0 -translate-x-1/2 translate-y-1/2",
    "bottom-right": "right-0 bottom-0 translate-x-1/2 translate-y-1/2",
  };
  return (
    <div
      className={cn(
        "pointer-events-none absolute z-0 h-[480px] w-[480px] rounded-full",
        "bg-[radial-gradient(ellipse_80%_80%_at_50%_50%,rgba(37,99,235,0.12),transparent_70%)]",
        "dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_50%,rgba(37,99,235,0.08),transparent_70%)]",
        positions[position],
        className
      )}
      aria-hidden
    />
  );
}
