"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { GlobalLoading } from "@/components/shared/GlobalLoading";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="yiba-theme" disableTransitionOnChange>
        <GlobalLoading />
        {children}
        <Toaster />
      </ThemeProvider>
    </SessionProvider>
  );
}
