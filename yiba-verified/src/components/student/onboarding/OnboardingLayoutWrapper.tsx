"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface OnboardingLayoutWrapperProps {
  children: ReactNode;
  withAppShell: ReactNode;
}

export function OnboardingLayoutWrapper({ children, withAppShell }: OnboardingLayoutWrapperProps) {
  const pathname = usePathname();
  const isOnboardingPage = pathname === "/student/onboarding";

  if (isOnboardingPage) {
    return <>{children}</>;
  }

  return <>{withAppShell}</>;
}
