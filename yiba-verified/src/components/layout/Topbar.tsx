"use client";

import { useState, useEffect } from "react";
import { Menu, Search, FileText, ChevronDown, ChevronLeft, ChevronRight, Bug } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/rbac";
import { GlobalSearch } from "@/components/shared/GlobalSearch";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { AccountMenu } from "@/components/account/AccountMenu";
import { ProfileCompletenessWidget } from "@/components/shared/ProfileCompletenessWidget";
import { NotificationBell } from "@/components/notifications";
import { ReportIssueModal } from "@/components/shared/ReportIssueModal";
import { InstitutionContextSwitcher } from "@/components/institution/InstitutionContextSwitcher";
import type { InstitutionDisplay } from "@/lib/currentInstitution";

type TopbarProps = {
  userName: string;
  userId?: string;
  userImage?: string | null;
  userRole: Role;
  onMenuClick: () => void;
  sidebarCollapsed?: boolean;
  onSidebarCollapse?: () => void;
  /** When set, top bar content is inset by this many px on desktop (so content sits to the right of sidebar) */
  sidebarWidth?: number;
  institutions?: InstitutionDisplay[];
  currentInstitutionId?: string | null;
};

const roleLabels: Record<Role, string> = {
  PLATFORM_ADMIN: "Platform Admin",
  QCTO_USER: "QCTO User",
  QCTO_SUPER_ADMIN: "QCTO Super Admin",
  QCTO_ADMIN: "QCTO Admin",
  QCTO_REVIEWER: "QCTO Reviewer",
  QCTO_AUDITOR: "QCTO Auditor",
  QCTO_VIEWER: "QCTO Viewer",
  INSTITUTION_ADMIN: "Institution Admin",
  INSTITUTION_STAFF: "Institution Staff",
  STUDENT: "Student",
  ADVISOR: "Advisor",
  FACILITATOR: "Facilitator",
};

/** Slim pill styles per role: light uses role color; dark uses white pill so it doesn't match header bg */
const rolePillClasses: Record<Role, string> = {
  PLATFORM_ADMIN: "bg-black font-bold text-white border border-white dark:bg-black dark:text-white dark:border-white",
  QCTO_USER: "bg-blue-500/20 text-blue-700 dark:bg-white/10 dark:text-white dark:border dark:border-white/20",
  QCTO_SUPER_ADMIN: "bg-blue-600/25 text-blue-800 dark:bg-white/10 dark:text-white dark:border dark:border-white/20",
  QCTO_ADMIN: "bg-blue-500/20 text-blue-700 dark:bg-white/10 dark:text-white dark:border dark:border-white/20",
  QCTO_REVIEWER: "bg-teal-500/20 text-teal-700 dark:bg-white/10 dark:text-white dark:border dark:border-white/20",
  QCTO_AUDITOR: "bg-teal-500/20 text-teal-700 dark:bg-white/10 dark:text-white dark:border dark:border-white/20",
  QCTO_VIEWER: "bg-slate-500/20 text-slate-700 dark:bg-white/10 dark:text-white dark:border dark:border-white/20",
  INSTITUTION_ADMIN: "bg-emerald-500/20 text-emerald-700 dark:bg-white/10 dark:text-white dark:border dark:border-white/20",
  INSTITUTION_STAFF: "bg-slate-500/15 text-slate-600 dark:bg-white/10 dark:text-white dark:border dark:border-white/20",
  STUDENT: "bg-amber-500/20 text-amber-800 dark:bg-white/10 dark:text-white dark:border dark:border-white/20",
  ADVISOR: "bg-purple-500/20 text-purple-700 dark:bg-white/10 dark:text-white dark:border dark:border-white/20",
  FACILITATOR: "bg-indigo-500/20 text-indigo-700 dark:bg-white/10 dark:text-white dark:border dark:border-white/20",
};

// Helper to get user initials for avatar
const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export function Topbar({ userName, userId, userImage, userRole, onMenuClick, sidebarCollapsed = false, onSidebarCollapse, sidebarWidth, institutions, currentInstitutionId }: TopbarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);
  // Avoid hydration mismatch: server and first client render use "Ctrl"; after mount we switch to "⌘" on Mac.
  const [shortcutKey, setShortcutKey] = useState("Ctrl");

  useEffect(() => {
    setShortcutKey(/Mac|iPhone|iPod|iPad/i.test(navigator.platform) ? "⌘" : "Ctrl");
  }, []);

  // Keyboard shortcut: ⌘K / Ctrl+K (Topbar is only used in AppShell where user is authenticated)
  useEffect(() => {
    if (!userName) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [userName]);

  const userInitials = getInitials(userName);

  return (
    <header
      className={cn(
        "sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b border-border/60 bg-card/90 backdrop-blur-md px-6 min-w-0 overflow-hidden shadow-[var(--shadow-soft)] dark:bg-card/80",
        typeof sidebarWidth === "number" && "lg:pl-[var(--sidebar-width)]"
      )}
    >
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden h-9 w-9 border-transparent text-foreground hover:bg-muted transition-colors duration-200 flex-shrink-0"
        onClick={onMenuClick}
        aria-label="Toggle menu"
      >
        <Menu className="h-4 w-4" strokeWidth={1.5} />
      </Button>

      {/* Desktop: Sidebar collapse button - pill for visibility and affordance */}
      {onSidebarCollapse && (
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "hidden lg:flex h-9 w-9 flex-shrink-0 rounded-full border border-border bg-muted/80 hover:bg-muted text-foreground hover:text-foreground dark:bg-muted/60 dark:border-border dark:hover:bg-muted/80 transition-colors duration-200 lg:ml-3"
          )}
          onClick={onSidebarCollapse}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
          ) : (
            <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
          )}
        </Button>
      )}

      {/* Page title area - Left side; institution context switcher when multi-institution */}
      <div className="hidden lg:flex lg:flex-1 lg:items-center lg:gap-4 min-w-0">
        {institutions && institutions.length > 1 && (
          <InstitutionContextSwitcher
            institutions={institutions}
            currentInstitutionId={currentInstitutionId ?? null}
          />
        )}
      </div>

      {/* Right side: Search, Notifications, User profile */}
      <div className="flex items-center justify-end gap-3 flex-shrink-0 min-w-0">
        {/* Search button - opens GlobalSearch */}
        <Button
          variant="ghost"
          onClick={() => setSearchOpen(true)}
          className="hidden md:flex h-9 items-center gap-2 px-3 rounded-full border-2 border-border bg-muted/60 hover:bg-muted hover:border-border text-foreground transition-all duration-200"
        >
          <Search className="h-4 w-4" strokeWidth={1.5} />
          <span className="text-sm font-medium">Search...</span>
          <kbd className="hidden lg:inline-flex ml-2 px-1.5 py-0.5 rounded bg-card/80 border border-border text-xs font-mono text-muted-foreground font-semibold">
            {shortcutKey}K
          </kbd>
        </Button>

        {/* Mobile search button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSearchOpen(true)}
          className="md:hidden h-9 w-9 border-transparent text-foreground hover:bg-muted transition-colors duration-200"
          aria-label="Search"
        >
          <Search className="h-4 w-4" strokeWidth={1.5} />
        </Button>

        {/* Theme: light / dark */}
        <ThemeToggle variant="icon-sm" aria-label="Toggle light or dark mode" />

        {/* Report Issue Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIssueOpen(true)}
          className="h-9 w-9 border-transparent text-foreground hover:bg-muted transition-colors duration-200"
          title="Report an issue"
        >
          <Bug className="h-4 w-4" strokeWidth={1.5} />
        </Button>

        {/* Notification Bell */}
        <NotificationBell viewerRole={userRole} />

        {/* API Documentation Link - Platform Admin only */}
        {userRole === "PLATFORM_ADMIN" && (
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="h-9 w-9 border-transparent text-foreground hover:bg-muted transition-colors duration-200"
            title="API Documentation"
          >
            <Link href="/api-docs">
              <FileText className="h-4 w-4" strokeWidth={1.5} />
            </Link>
          </Button>
        )}

        {/* Profile Completeness */}
        <ProfileCompletenessWidget />

        {/* User Profile - Account Menu */}
        <AccountMenu
          role={userRole}
          align="end"
          side="bottom"
          trigger={
            <div className="flex items-center gap-2">
              {/* Avatar with initials */}
              {/* Avatar with initials or image */}
              <div className="hidden sm:flex sm:items-center sm:gap-2.5">
                {userImage ? (
                  <img
                    src={userImage}
                    alt={userName}
                    className="h-9 w-9 rounded-full object-cover shadow-sm transition-all duration-200 hover:shadow-md border border-border/50"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-blue-600 text-xs font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:shadow-md">
                    {userInitials}
                  </div>
                )}
                <div className="hidden lg:flex lg:flex-col lg:items-start lg:gap-0.5">
                  <span className="text-sm font-semibold text-foreground dark:text-white leading-tight">{userName}</span>
                  <span
                    data-role-pill
                    className={cn(
                      "inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-medium leading-tight",
                      rolePillClasses[userRole]
                    )}
                  >
                    {roleLabels[userRole]}
                  </span>
                </div>
              </div>
              {/* Mobile: Just show avatar */}
              {userImage ? (
                <img
                  src={userImage}
                  alt={userName}
                  className="h-9 w-9 rounded-full object-cover shadow-sm transition-all duration-200 hover:shadow-md sm:hidden border border-border/50"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-blue-600 text-xs font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:shadow-md sm:hidden">
                  {userInitials}
                </div>
              )}
              {/* Down arrow indicator */}
              <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block" strokeWidth={1.5} />
            </div>
          }
        />
      </div>

      {/* Global Search Modal */}
      {userName && (
        <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} role={userRole} />
      )}

      {/* Report Issue Modal */}
      <ReportIssueModal open={issueOpen} onOpenChange={setIssueOpen} />
    </header>
  );
}
