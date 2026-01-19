"use client";

import Link from "next/link";
import { LogIn, LayoutDashboard, ChevronDown } from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { AccountMenu } from "@/components/account/AccountMenu";
import type { Role } from "@/lib/rbac";

const roleDashboardHref: Record<Role, string> = {
  PLATFORM_ADMIN: "/platform-admin",
  QCTO_USER: "/qcto",
  INSTITUTION_ADMIN: "/institution",
  INSTITUTION_STAFF: "/institution",
  STUDENT: "/student",
};

function getDashboardHref(role: string | undefined): string {
  if (role && role in roleDashboardHref) {
    return roleDashboardHref[role as Role];
  }
  return "/account";
}

function getInitials(name: string | null | undefined): string {
  if (!name || typeof name !== "string") return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function MarketingNav() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated" && !!session?.user;
  const role = session?.user?.role as Role | undefined;
  const userName = session?.user?.name ?? undefined;
  const dashboardHref = getDashboardHref(role);

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold">
              Yiba Verified
            </Link>
          </div>

          <div className="hidden md:flex md:items-center md:space-x-6">
            <Link
              href="/"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Home
            </Link>
            <Link
              href="/features"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Features
            </Link>
            <Link
              href="/how-it-works"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              How it works
            </Link>
            <Link
              href="/security"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Security
            </Link>
            <Link
              href="/pricing"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Pricing
            </Link>
            <Link
              href="/contact"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Contact
            </Link>
            {isAuthenticated && role ? (
              <>
                <Button asChild variant="default" size="sm" className="rounded-lg gap-2">
                  <Link href={dashboardHref}>
                    <LayoutDashboard className="h-4 w-4" aria-hidden />
                    Dashboard
                  </Link>
                </Button>
                <AccountMenu
                  role={role}
                  align="end"
                  side="bottom"
                  trigger={
                    <div className="flex items-center gap-1.5 cursor-pointer">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-xs font-semibold text-white">
                        {getInitials(userName)}
                      </div>
                      <ChevronDown className="h-4 w-4 text-gray-500" strokeWidth={1.5} aria-hidden />
                    </div>
                  }
                />
              </>
            ) : (
              <Button asChild variant="default" size="sm" className="rounded-lg gap-2">
                <Link href="/login">
                  <LogIn className="h-4 w-4" aria-hidden />
                  Login
                </Link>
              </Button>
            )}
          </div>

          <div className="md:hidden flex items-center gap-2">
            {isAuthenticated && role ? (
              <>
                <Button asChild variant="outline" size="sm" className="rounded-lg gap-2">
                  <Link href={dashboardHref}>
                    <LayoutDashboard className="h-4 w-4" aria-hidden />
                    Dashboard
                  </Link>
                </Button>
                <AccountMenu
                  role={role}
                  align="end"
                  side="bottom"
                  trigger={
                    <div className="flex items-center gap-1.5 cursor-pointer">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-xs font-semibold text-white">
                        {getInitials(userName)}
                      </div>
                      <ChevronDown className="h-4 w-4 text-gray-500" strokeWidth={1.5} aria-hidden />
                    </div>
                  }
                />
              </>
            ) : (
              <Button asChild variant="outline" size="sm" className="rounded-lg gap-2">
                <Link href="/login">
                  <LogIn className="h-4 w-4" aria-hidden />
                  Login
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
