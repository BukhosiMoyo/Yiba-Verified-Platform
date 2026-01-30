"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface InstitutionOnboardingLayoutWrapperProps {
  children: ReactNode;
  withAppShell: ReactNode;
}

export function InstitutionOnboardingLayoutWrapper({
  children,
  withAppShell,
}: InstitutionOnboardingLayoutWrapperProps) {
  const pathname = usePathname();
  const isOnboardingPage = pathname.startsWith("/institution/onboarding");

  if (isOnboardingPage) {
    return <>{children}</>;
  }

  return <>{withAppShell}</>;
}
