"use client";

import { useState, useEffect } from "react";
import { Menu, Search, FileText, ChevronDown } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/rbac";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { GlobalSearch } from "@/components/shared/GlobalSearch";
import { AccountMenu } from "@/components/account/AccountMenu";

type TopbarProps = {
  userName: string;
  userRole: Role;
  onMenuClick: () => void;
};

const roleLabels: Record<Role, string> = {
  PLATFORM_ADMIN: "Platform Admin",
  QCTO_USER: "QCTO User",
  INSTITUTION_ADMIN: "Institution Admin",
  INSTITUTION_STAFF: "Institution Staff",
  STUDENT: "Student",
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

export function Topbar({ userName, userRole, onMenuClick }: TopbarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
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
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b border-gray-200/60 bg-white px-6 min-w-0 overflow-hidden">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden h-9 w-9 border-transparent text-blue-700 hover:text-blue-800 hover:bg-blue-50/80 transition-colors duration-200 flex-shrink-0"
        onClick={onMenuClick}
        aria-label="Toggle menu"
      >
        <Menu className="h-4 w-4" strokeWidth={1.5} />
      </Button>

      {/* Page title area - Left side (optional, can be customized per page) */}
      <div className="hidden lg:flex lg:flex-1 lg:items-center lg:gap-4 min-w-0">
        {/* This space is reserved for page titles if needed */}
      </div>

      {/* Right side: Search, Notifications, User profile */}
      <div className="flex items-center justify-end gap-3 flex-shrink-0 min-w-0">
        {/* Search button - opens GlobalSearch */}
        <Button
          variant="ghost"
          onClick={() => setSearchOpen(true)}
          className="hidden md:flex h-9 items-center gap-2 px-3 rounded-full border-2 border-blue-300 bg-blue-50/60 hover:bg-blue-50/80 hover:border-blue-400 text-blue-700 hover:text-blue-800 transition-all duration-200"
        >
          <Search className="h-4 w-4" strokeWidth={1.5} />
          <span className="text-sm font-medium">Search...</span>
          <kbd className="hidden lg:inline-flex ml-2 px-1.5 py-0.5 rounded bg-white/80 border border-blue-300 text-xs font-mono text-blue-700 font-semibold">
            {shortcutKey}K
          </kbd>
        </Button>

        {/* Mobile search button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSearchOpen(true)}
          className="md:hidden h-9 w-9 border-transparent text-blue-700 hover:text-blue-800 hover:bg-blue-50/80 transition-colors duration-200"
          aria-label="Search"
        >
          <Search className="h-4 w-4" strokeWidth={1.5} />
        </Button>

        {/* Notification Bell */}
        <NotificationBell />

        {/* API Documentation Link - Platform Admin only */}
        {userRole === "PLATFORM_ADMIN" && (
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="h-9 w-9 border-transparent text-blue-700 hover:text-blue-800 hover:bg-blue-50/80 transition-colors duration-200"
            title="API Documentation"
          >
            <Link href="/api-docs">
              <FileText className="h-4 w-4" strokeWidth={1.5} />
            </Link>
          </Button>
        )}

        {/* User Profile - Account Menu */}
        <AccountMenu
          role={userRole}
          align="end"
          side="bottom"
          trigger={
            <div className="flex items-center gap-2">
              {/* Avatar with initials */}
              <div className="hidden sm:flex sm:items-center sm:gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:shadow-md">
                  {userInitials}
                </div>
                <div className="hidden lg:flex lg:flex-col lg:gap-0.5">
                  <span className="text-sm font-semibold text-gray-900 leading-tight">{userName}</span>
                  <span className="text-xs text-gray-500 leading-tight">{roleLabels[userRole]}</span>
                </div>
              </div>
              {/* Mobile: Just show avatar */}
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:shadow-md sm:hidden">
                {userInitials}
              </div>
              {/* Down arrow indicator */}
              <ChevronDown className="h-4 w-4 text-blue-700 hidden sm:block" strokeWidth={1.5} />
            </div>
          }
        />
      </div>

      {/* Global Search Modal */}
      {userName && (
        <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} role={userRole} />
      )}
    </header>
  );
}
