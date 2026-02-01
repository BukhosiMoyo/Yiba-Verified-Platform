"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { SWRConfig } from "swr";
import { ReactNode, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { GlobalLoading } from "@/components/shared/GlobalLoading";
import { DebugReporter } from "@/components/debug/DebugReporter";
import { TourWrapper } from "@/components/tour/TourWrapper";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <SWRConfig
        value={{
          dedupingInterval: 5000,
          revalidateOnFocus: false,
        }}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="yiba-theme" disableTransitionOnChange>
          <DebugReporter />
          <Suspense fallback={null}>
            <GlobalLoading />
          </Suspense>
          <TourWrapper>
            {children}
          </TourWrapper>
          <Toaster />
        </ThemeProvider>
      </SWRConfig>
    </SessionProvider>
  );
}
