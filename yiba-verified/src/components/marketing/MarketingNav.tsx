"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn, LayoutDashboard, ChevronDown, BookOpen } from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { AccountMenu } from "@/components/account/AccountMenu";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
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
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated" && !!session?.user;
  const role = session?.user?.role as Role | undefined;
  const userName = session?.user?.name ?? undefined;
  const dashboardHref = getDashboardHref(role);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/features", label: "Features" },
    { href: "/how-it-works", label: "How it works" },
    { href: "/security", label: "Security" },
    { href: "/pricing", label: "Pricing" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70 dark:bg-background/70 dark:supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <img src="/Yiba%20Verified%20Logo.webp" alt="Yiba Verified" className="h-8 w-auto max-w-[160px] object-contain object-left" />
          </Link>

          <div className="hidden md:flex md:items-center md:gap-0.5">
            {navLinks.map(({ href, label }) => {
              const active = pathname === href || (href !== "/" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`rounded-full px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                    active ? "bg-muted/80 text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          <div className="hidden md:flex md:items-center md:gap-2">
            <ThemeToggle variant="icon-sm" aria-label="Toggle light or dark mode" />
            <Button asChild variant="outline" size="sm" className="rounded-lg gap-2 font-medium border-border hover:bg-muted/60">
              <Link href="/how-it-works">
                <BookOpen className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                Docs
              </Link>
            </Button>
            {isAuthenticated && role ? (
              <>
                <Button asChild variant="default" size="sm" className="btn-primary-premium rounded-lg gap-2 font-medium">
                  <Link href={dashboardHref}>
                    <LayoutDashboard className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                    Dashboard
                  </Link>
                </Button>
                <AccountMenu
                  role={role}
                  align="end"
                  side="bottom"
                  trigger={
                    <div className="flex items-center gap-1.5 cursor-pointer rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/60">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-blue-600 text-xs font-semibold text-primary-foreground shadow-sm">
                        {getInitials(userName)}
                      </div>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} aria-hidden />
                    </div>
                  }
                />
              </>
            ) : (
              <Button asChild variant="default" size="sm" className="btn-primary-premium rounded-lg gap-2 font-medium">
                <Link href="/login">
                  <LogIn className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                  Sign in
                </Link>
              </Button>
            )}
          </div>

          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle variant="icon-sm" aria-label="Toggle light or dark mode" />
            {isAuthenticated && role ? (
              <>
                <Button asChild variant="outline" size="sm" className="rounded-lg gap-2 font-medium">
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
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-blue-600 text-xs font-semibold text-primary-foreground shadow-sm">
                        {getInitials(userName)}
                      </div>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} aria-hidden />
                    </div>
                  }
                />
              </>
            ) : (
              <Button asChild variant="outline" size="sm" className="rounded-lg gap-2 font-medium">
                <Link href="/login">
                  <LogIn className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                  Sign in
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
