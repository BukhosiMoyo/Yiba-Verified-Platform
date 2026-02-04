"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LogIn, LayoutDashboard, ChevronDown, BookOpen, Menu, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  ADVISOR: "/advisor",
  FACILITATOR: "/facilitator/dashboard",
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

type NavLink = {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
};

const navLinks: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/institutions", label: "Find institutions" },
  {
    label: "Talent",
    href: "/talent",
    children: [
      { href: "/talent", label: "Browse Candidates" },
      { href: "/contact", label: "For Employers" },
    ]
  },
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
];

export function MarketingNav() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated" && !!session?.user;
  const role = session?.user?.role as Role | undefined;
  const userName = session?.user?.name ?? undefined;
  const dashboardHref = getDashboardHref(role);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70 dark:bg-background/70 dark:supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <Image src="/Yiba%20Verified%20Logo.webp" alt="Yiba Verified" width={160} height={32} className="h-8 w-auto max-w-[160px] object-contain object-left dark:hidden" sizes="160px" priority loading="eager" />
              <Image src="/YIBA%20VERIFIED%20DARK%20MODE%20LOGO.webp" alt="Yiba Verified" width={160} height={32} className="h-8 w-auto max-w-[160px] object-contain object-left hidden dark:block" sizes="160px" priority loading="eager" />
            </Link>

            <div className="hidden md:flex md:items-center md:gap-0.5">
              {navLinks.map((link) => {
                const active = link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);

                if (link.children) {
                  return (
                    <DropdownMenu key={link.label}>
                      <DropdownMenuTrigger className={`flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium transition-colors duration-200 outline-none ${active ? "bg-muted/80 text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        }`}>
                        {link.label}
                        <ChevronDown className="h-3 w-3 opacity-50" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="center" className="w-[160px]">
                        {link.children.map((child) => (
                          <DropdownMenuItem key={child.href} asChild>
                            <Link href={child.href} className="w-full cursor-pointer">
                              {child.label}
                            </Link>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                }

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-full px-3 py-2 text-sm font-medium transition-colors duration-200 ${active ? "bg-muted/80 text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      }`}
                  >
                    {link.label}
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

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center gap-2">
              <ThemeToggle variant="icon-sm" aria-label="Toggle light or dark mode" />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors duration-200"
                aria-expanded={mobileMenuOpen}
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" strokeWidth={1.5} />
                ) : (
                  <Menu className="h-5 w-5" strokeWidth={1.5} />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      <div
        className={`fixed inset-0 top-16 z-40 md:hidden transition-opacity duration-200 ${mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-background/95 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />

        {/* Menu content */}
        <div
          className={`relative bg-background border-b border-border shadow-lg transform transition-transform duration-200 ${mobileMenuOpen ? "translate-y-0" : "-translate-y-4"
            }`}
        >
          <div className="px-4 py-6 space-y-1">
            {navLinks.map((link) => {
              const active = link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);

              if (link.children) {
                return (
                  <div key={link.label} className="space-y-1">
                    <div className="px-4 py-2 text-sm font-semibold text-muted-foreground">
                      {link.label}
                    </div>
                    <div className="pl-4 border-l border-border ml-4 space-y-1">
                      {link.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block rounded-lg px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/60 transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block rounded-lg px-4 py-3 text-base font-medium transition-colors duration-200 ${active
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-muted/60"
                    }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}

            {/* Divider */}
            <div className="my-4 border-t border-border" />

            {/* Auth section */}
            <div className="space-y-3 pt-2">
              {isAuthenticated && role ? (
                <>
                  <Button asChild variant="default" className="w-full btn-primary-premium rounded-lg gap-2 font-medium h-11">
                    <Link href={dashboardHref}>
                      <LayoutDashboard className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                      Go to Dashboard
                    </Link>
                  </Button>
                  <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-muted/40">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-blue-600 text-sm font-semibold text-primary-foreground shadow-sm">
                      {getInitials(userName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{userName || "User"}</p>
                      <p className="text-xs text-muted-foreground capitalize">{role?.toLowerCase().replace(/_/g, " ")}</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Button asChild variant="default" className="w-full btn-primary-premium rounded-lg gap-2 font-medium h-11">
                    <Link href="/login">
                      <LogIn className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                      Sign in
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full rounded-lg gap-2 font-medium h-11">
                    <Link href="/contact">
                      Request Demo
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
