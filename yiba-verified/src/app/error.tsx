"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { AlertTriangle, Home, LayoutDashboard, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthState } from "@/components/auth/AuthState";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import type { Role } from "@/lib/rbac";

const roleDashboardHref: Record<Role, string> = {
  PLATFORM_ADMIN: "/platform-admin",
  QCTO_USER: "/qcto",
  QCTO_SUPER_ADMIN: "/qcto",
  QCTO_ADMIN: "/qcto",
  QCTO_REVIEWER: "/qcto",
  QCTO_AUDITOR: "/qcto",
  QCTO_VIEWER: "/qcto",
  INSTITUTION_ADMIN: "/institution",
  INSTITUTION_STAFF: "/institution",
  STUDENT: "/student",
  ADVISOR: "/advisor",
  FACILITATOR: "/facilitator/dashboard",
};

function getDashboardHref(role: string | undefined): string {
  if (role && role in roleDashboardHref) {
    return roleDashboardHref[role as Role];
  }
  return "/account";
}

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated" && !!session?.user;
  const role = session?.user?.role as Role | undefined;
  const dashboardHref = getDashboardHref(role);

  // Log error for debugging (only in development)
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("Application error:", error);
    }
  }, [error]);

  // Report error to platform admin dashboard (fire-and-forget, one attempt)
  useEffect(() => {
    const path =
      typeof window !== "undefined" ? window.location?.pathname : undefined;
    fetch("/api/errors/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: error?.message ?? "Unknown error",
        digest: error?.digest,
        path,
      }),
    }).catch(() => {
      // Ignore; do not block or retry
    });
  }, [error]);

  // For authenticated users
  if (isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            <AuthCard>
              <AuthState
                variant="error"
                icon={<AlertTriangle className="h-6 w-6" strokeWidth={1.5} />}
                title="Something Went Wrong"
                description={
                  <>
                    An unexpected error occurred. Our team has been notified.
                    <br />
                    <br />
                    Please try again, or contact support if the problem persists.
                  </>
                }
                actions={
                  <div className="flex flex-col gap-3 w-full">
                    <Button onClick={reset} className="w-full h-10 font-semibold">
                      <RefreshCw className="h-4 w-4 mr-2" strokeWidth={1.5} aria-hidden />
                      Try Again
                    </Button>
                    <Button asChild variant="outline" className="w-full h-10">
                      <Link href={dashboardHref ?? "/"}>
                        <LayoutDashboard className="h-4 w-4 mr-2" strokeWidth={1.5} aria-hidden />
                        Go to Dashboard
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" className="w-full h-10">
                      <Link href="/">
                        <Home className="h-4 w-4 mr-2" strokeWidth={1.5} aria-hidden />
                        Go Home
                      </Link>
                    </Button>
                  </div>
                }
              />
            </AuthCard>
          </div>
        </div>
      </div>
    );
  }

  // For unauthenticated users
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingNav />
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <AuthCard>
            <AuthState
              variant="error"
              icon={<AlertTriangle className="h-6 w-6" strokeWidth={1.5} />}
              title="Something Went Wrong"
              description={
                <>
                  An unexpected error occurred. Our team has been notified.
                  <br />
                  <br />
                  Please try again, or{" "}
                  <Link href="/contact" className="text-primary hover:underline font-medium">
                    contact support
                  </Link>{" "}
                  if the problem persists.
                </>
              }
              actions={
                <div className="flex flex-col gap-3 w-full">
                  <Button onClick={reset} className="w-full h-10 font-semibold">
                    <RefreshCw className="h-4 w-4 mr-2" strokeWidth={1.5} aria-hidden />
                    Try Again
                  </Button>
                  <Button asChild variant="outline" className="w-full h-10">
                    <Link href="/">
                      <Home className="h-4 w-4 mr-2" strokeWidth={1.5} aria-hidden />
                      Go Home
                    </Link>
                  </Button>
                </div>
              }
            />
          </AuthCard>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
