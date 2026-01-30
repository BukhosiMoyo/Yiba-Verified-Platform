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
  const isEditCvPage = pathname?.startsWith("/student/profile/edit");

  if (isOnboardingPage || isEditCvPage) {
    return <>{children}</>;
  }

  return <>{withAppShell}</>;
}
