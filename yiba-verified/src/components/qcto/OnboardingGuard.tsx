"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Client component to handle onboarding redirect
 * This prevents redirect loops by checking the pathname on the client side
 */
export function OnboardingGuard({ 
  onboardingCompleted, 
  userRole 
}: { 
  onboardingCompleted: boolean;
  userRole: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Skip for super admin and platform admin
    if (userRole === "QCTO_SUPER_ADMIN" || userRole === "PLATFORM_ADMIN") {
      return;
    }

    // Prevent multiple redirects
    if (hasRedirected.current) {
      return;
    }

    // If onboarding is not completed and we're not on the onboarding page, redirect
    if (!onboardingCompleted && pathname !== "/qcto/onboarding" && !pathname.includes("/qcto/onboarding")) {
      hasRedirected.current = true;
      router.push("/qcto/onboarding");
      return;
    }
    
    // If onboarding is completed and we're on the onboarding page, redirect to dashboard
    if (onboardingCompleted && (pathname === "/qcto/onboarding" || pathname.includes("/qcto/onboarding"))) {
      hasRedirected.current = true;
      router.push("/qcto");
      return;
    }
  }, [onboardingCompleted, pathname, userRole, router]);

  return null;
}
