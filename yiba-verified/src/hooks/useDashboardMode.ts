"use client";

import { useState, useEffect } from "react";

export type DashboardMode = "lite" | "advanced";

const STORAGE_KEY = "yv_dashboard_mode";
const DEFAULT_MODE: DashboardMode = "lite";

/**
 * Hook to manage dashboard mode state with localStorage persistence
 * SSR-safe: Only reads/writes to localStorage on client-side
 */
export function useDashboardMode() {
  const [mode, setMode] = useState<DashboardMode>(DEFAULT_MODE);
  const [isHydrated, setIsHydrated] = useState(false);

  // Read from localStorage on mount (client-side only)
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === "lite" || stored === "advanced") {
          setMode(stored);
        }
      } catch (error) {
        console.error("Failed to read dashboard mode from localStorage:", error);
      }
      setIsHydrated(true);
    }
  }, []);

  // Update mode and persist to localStorage
  const updateMode = (newMode: DashboardMode) => {
    setMode(newMode);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, newMode);
      } catch (error) {
        console.error("Failed to write dashboard mode to localStorage:", error);
      }
    }
  };

  return {
    mode,
    setMode: updateMode,
    isHydrated,
  };
}