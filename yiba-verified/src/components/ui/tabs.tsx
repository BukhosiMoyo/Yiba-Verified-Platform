"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
  baseId: string;
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined);

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({ value, onValueChange, children, className }: TabsProps) {
  const baseId = React.useId();
  const baseIdSafe = baseId.replace(/:/g, "");
  return (
    <TabsContext.Provider value={{ value, onValueChange, baseId: baseIdSafe }}>
      <div className={cn("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
        className
      )}
    >
      {children}
    </div>
  );
}

function slug(value: string) {
  return value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export function TabsTrigger({
  value,
  children,
  className,
  activeVariant = "default",
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
  activeVariant?: "default" | "primary";
}) {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error("TabsTrigger must be used within Tabs");

  const isActive = context.value === value;
  const suffix = slug(value);
  const triggerId = `${context.baseId}-trigger-${suffix}`;
  const panelId = `${context.baseId}-panel-${suffix}`;

  const activeStyles =
    activeVariant === "primary" && isActive
      ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
      : isActive
        ? "bg-card text-foreground shadow-sm"
        : "text-muted-foreground hover:text-foreground hover:bg-muted/70";

  function handleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    const k = e.key;
    if (k !== "ArrowLeft" && k !== "ArrowRight" && k !== "Home" && k !== "End") return;
    const list = e.currentTarget.closest('[role="tablist"]');
    if (!list) return;
    const tabs = Array.from(list.querySelectorAll<HTMLElement>('[role="tab"]'));
    const i = tabs.findIndex((t) => t === e.currentTarget);
    if (i < 0) return;
    let next: HTMLElement;
    if (k === "ArrowRight" || k === "End") {
      next = k === "End" ? tabs[tabs.length - 1]! : tabs[i + 1] ?? tabs[0]!;
    } else {
      next = k === "Home" ? tabs[0]! : tabs[i - 1] ?? tabs[tabs.length - 1]!;
    }
    e.preventDefault();
    const v = next.getAttribute("data-value");
    if (v && context) {
      context.onValueChange(v);
      next.focus();
    }
  }

  return (
    <button
      type="button"
      role="tab"
      id={triggerId}
      aria-selected={isActive}
      aria-controls={panelId}
      data-value={value}
      tabIndex={isActive ? 0 : -1}
      onClick={() => context.onValueChange(value)}
      onKeyDown={handleKeyDown}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        activeStyles,
        className
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  children,
  className,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error("TabsContent must be used within Tabs");

  if (context.value !== value) return null;

  const suffix = slug(value);
  const panelId = `${context.baseId}-panel-${suffix}`;
  const triggerId = `${context.baseId}-trigger-${suffix}`;

  return (
    <div
      role="tabpanel"
      id={panelId}
      aria-labelledby={triggerId}
      className={cn("mt-6", className)}
    >
      {children}
    </div>
  );
}
