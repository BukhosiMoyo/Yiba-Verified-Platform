"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  FileQuestion,
  BarChart3,
  Activity,
  GraduationCap,
  ClipboardList,
  ClipboardCheck,
  FolderOpen,
  Eye,
  Flag,
  Award,
  Bell,
  Mail,
  Upload,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  User,
  ChevronUp,
  Settings,
  Shield,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/rbac";
import type { NavItem } from "./nav";
import { filterNavItems } from "./nav";
import { AccountMenu } from "@/components/account/AccountMenu";

// Icon mapping from iconKey string to Lucide icon component
const ICONS: Record<string, LucideIcon> = {
  "layout-dashboard": LayoutDashboard,
  "building-2": Building2,
  users: Users,
  "file-text": FileText,
  "file-question": FileQuestion,
  upload: Upload,
  "chart-column": BarChart3,
  "bar-chart-3": BarChart3,
  activity: Activity,
  "graduation-cap": GraduationCap,
  "clipboard-list": ClipboardList,
  "clipboard-check": ClipboardCheck,
  "folder-open": FolderOpen,
  eye: Eye,
  flag: Flag,
  award: Award,
  bell: Bell,
  mail: Mail,
  settings: Settings,
  shield: Shield,
  user: User,
};

// Map role to home dashboard path
const getRoleHomePath = (role: Role): string => {
  switch (role) {
    case "PLATFORM_ADMIN":
      return "/platform-admin";
    case "INSTITUTION_ADMIN":
    case "INSTITUTION_STAFF":
      return "/institution";
    case "QCTO_USER":
    case "QCTO_SUPER_ADMIN":
    case "QCTO_ADMIN":
    case "QCTO_REVIEWER":
    case "QCTO_AUDITOR":
    case "QCTO_VIEWER":
      return "/qcto";
    case "STUDENT":
      return "/student";
    default:
      return "/";
  }
};

/**
 * Check if a navigation item is active based on current pathname
 * - Root section links (e.g., "/platform-admin") only match exact pathname
 * - Sub-route links (e.g., "/platform-admin/institutions") match exact or children
 */
function isActive(href: string, pathname: string, allItems: NavItem[]): boolean {
  if (pathname === href) return true;
  const isRootSection = allItems.some(
    (item) => item.href !== href && item.href.startsWith(href + "/")
  );
  if (isRootSection) return false;
  return pathname.startsWith(href + "/");
}

/** Parent is active if path matches its href or any child's path. */
function isParentActive(item: NavItem, pathname: string): boolean {
  const base = item.href.split("?")[0];
  if (pathname === base || pathname.startsWith(base + "/")) return true;
  if (item.children) {
    return item.children.some((c) => {
      const p = c.href.split("?")[0];
      return pathname === p;
    });
  }
  return false;
}

/** Child is active when path and filter param (status or province) match. */
function isChildActive(
  child: NavItem,
  pathname: string,
  filterVal: string | null,
  paramKey: "status" | "province" = "status"
): boolean {
  const [p, q] = child.href.split("?");
  const childVal = q ? new URLSearchParams(q).get(paramKey) : null;
  if (pathname !== p) return false;
  return childVal === null ? !filterVal : filterVal === childVal;
}

type SidebarProps = {
  items: NavItem[];
  role: Role;
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
};

export function Sidebar({ items, role, isOpen, onClose, userName = "User" }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status");
  const provinceParam = searchParams.get("province");
  const [collapsed, setCollapsed] = useState(false);
  const [groupExpanded, setGroupExpanded] = useState<Set<string>>(() => new Set());
  const [groupCollapsed, setGroupCollapsed] = useState<Set<string>>(() => new Set());

  const isGroupOpen = (href: string, item: NavItem) => {
    const active = isParentActive(item, pathname);
    if (groupCollapsed.has(href)) return false;
    if (groupExpanded.has(href) || active) return true;
    return false;
  };
  const toggleGroup = (href: string, item: NavItem) => {
    const open = isGroupOpen(href, item);
    if (open) {
      setGroupCollapsed((s) => new Set(s).add(href));
    } else {
      setGroupCollapsed((s) => {
        const n = new Set(s);
        n.delete(href);
        return n;
      });
      setGroupExpanded((s) => new Set(s).add(href));
    }
  };

  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Filter items based on role capabilities
  const filteredItems = filterNavItems(role, items);
  
  // Get home path for current role
  const homePath = getRoleHomePath(role);

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div
      className={cn(
        "flex h-full flex-col bg-gradient-to-b from-card via-card to-muted/20 transition-[width] duration-250 ease-in-out overflow-hidden dark:from-card dark:via-card dark:to-muted/30",
        collapsed && !isMobile ? "w-[72px]" : "w-[280px]",
        !collapsed && !isMobile && "rounded-r-2xl border-r border-border/80"
      )}
    >
      {/* Logo/Brand - Clickable */}
      <div className={cn("flex h-20 items-center justify-between", collapsed && !isMobile ? "px-2" : "px-6")}>
        <Link
          href={homePath}
          className={cn(
            "flex items-center transition-all duration-250 ease-in-out flex-shrink-0",
            collapsed && !isMobile ? "w-9" : "min-w-0"
          )}
          onClick={onClose}
        >
          {collapsed && !isMobile ? (
            <img src="/Yiba%20Verified%20Icon.webp" alt="Yiba Verified" className="h-9 w-9 object-contain" />
          ) : (
            <img src="/Yiba%20Verified%20Logo.webp" alt="Yiba Verified" className="h-8 max-w-[180px] object-contain object-left" />
          )}
        </Link>
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 border-transparent text-primary hover:bg-primary/15 transition-colors duration-150"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
            ) : (
              <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
            )}
          </Button>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className={cn(
        "flex-1 pb-4",
        collapsed && !isMobile ? "px-2" : "px-3"
      )}>
        <nav className="relative space-y-1">
          {filteredItems.map((item) => {
            const hasChildren = item.children && item.children.length > 0 && !(collapsed && !isMobile);
            const active = hasChildren
              ? isParentActive(item, pathname)
              : isActive(item.href, pathname, filteredItems);
            const Icon = item.iconKey ? ICONS[item.iconKey] : undefined;
            const groupOpen = hasChildren && isGroupOpen(item.href, item);

            // Group with dropdown (parent + children)
            if (hasChildren) {
              return (
                <div key={item.href} className="relative z-10">
                  <div
                    data-nav-item
                    className={cn(
                      "group relative flex items-center rounded-lg h-10 text-sm font-medium transition-colors duration-150 ease-out z-10 focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-background",
                      collapsed && !isMobile ? "justify-center px-0" : "gap-1 pr-1 pl-3",
                      active
                        ? collapsed && !isMobile
                          ? "bg-transparent text-primary"
                          : "bg-primary/10 border border-primary/20 text-primary shadow-[0_1px_0_rgba(0,0,0,0.03)] dark:shadow-none z-20"
                        : "text-muted-foreground hover:bg-muted/70"
                    )}
                  >
                    {active && !collapsed && !isMobile && (
                      <div className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-primary transition-all duration-200 ease-out" />
                    )}
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "flex min-w-0 flex-1 items-center gap-3 focus:outline-none",
                        collapsed && !isMobile && "justify-center px-0"
                      )}
                    >
                      {Icon && (
                        <div
                          className={cn(
                            "relative flex flex-shrink-0 items-center justify-center rounded-lg transition-all duration-200 ease-out",
                            collapsed && !isMobile ? "h-9 w-9 mx-auto" : "h-9 w-9",
                            collapsed && !isMobile && active && "bg-primary/15 ring-1 ring-primary/30"
                          )}
                        >
                          {active && collapsed && !isMobile && (
                            <div className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-r-full bg-primary" />
                          )}
                          <Icon
                            className={cn("h-5 w-5 transition-colors duration-200 ease-out", active ? "text-primary" : "text-muted-foreground")}
                            strokeWidth={1.5}
                          />
                        </div>
                      )}
                      <span
                        className={cn(
                          "truncate transition-all duration-250 ease-in-out whitespace-nowrap",
                          collapsed && !isMobile ? "opacity-0 w-0 max-w-0 overflow-hidden -translate-x-1" : "opacity-100 max-w-full translate-x-0"
                        )}
                      >
                        {item.label}
                      </span>
                      {item.badge !== undefined && !active && (
                        <span
                          className={cn(
                            "inline-flex h-5 min-w-[20px] flex-shrink-0 items-center justify-center rounded-full px-1.5 text-xs font-semibold",
                            item.badge === 0 ? "bg-muted text-muted-foreground" : "bg-destructive text-destructive-foreground",
                            collapsed && !isMobile && "opacity-0 w-0 overflow-hidden"
                          )}
                        >
                          {item.badge > 99 ? "99+" : item.badge}
                        </span>
                      )}
                    </Link>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleGroup(item.href, item);
                      }}
                      className={cn(
                        "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
                        collapsed && !isMobile && "hidden"
                      )}
                      aria-expanded={groupOpen}
                      aria-label={groupOpen ? "Collapse" : "Expand"}
                    >
                      {groupOpen ? <ChevronDown className="h-4 w-4" strokeWidth={2} /> : <ChevronRight className="h-4 w-4" strokeWidth={2} />}
                    </button>
                  </div>
                  {groupOpen && (
                    <div className="mt-0.5 space-y-0.5 border-l border-border py-1 pl-4 ml-3">
                      {item.children!.map((child) => {
                        const filterVal = item.childParam === "province" ? provinceParam : statusParam;
                        const childActive = isChildActive(child, pathname, filterVal, item.childParam || "status");
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={onClose}
                            className={cn(
                              "block rounded-md py-1.5 pl-3 text-sm transition-colors",
                              childActive ? "font-medium text-primary bg-primary/10" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                          >
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            // Simple link (no children or sidebar collapsed)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className="block relative z-10 focus:outline-none"
              >
                <div
                  data-nav-item
                  className={cn(
                    "group relative flex items-center rounded-lg h-10 text-sm font-medium transition-colors duration-150 ease-out z-10 focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-background",
                    collapsed && !isMobile ? "justify-center px-0" : "gap-3 px-3",
                    active
                      ? collapsed && !isMobile
                        ? "bg-transparent text-primary"
                        : "bg-primary/10 border border-primary/20 text-primary shadow-[0_1px_0_rgba(0,0,0,0.03)] dark:shadow-none z-20"
                      : "text-muted-foreground hover:bg-muted/70"
                  )}
                >
                  {active && !collapsed && !isMobile && (
                    <div className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-primary transition-all duration-200 ease-out" />
                  )}
                  {Icon && (
                    <div
                      className={cn(
                        "relative flex flex-shrink-0 items-center justify-center rounded-lg transition-all duration-200 ease-out",
                        collapsed && !isMobile ? "h-9 w-9 mx-auto" : "h-9 w-9",
                        collapsed && !isMobile && active && "bg-primary/15 ring-1 ring-primary/30"
                      )}
                    >
                      {active && collapsed && !isMobile && (
                        <div className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-r-full bg-primary" />
                      )}
                      <Icon className={cn("h-5 w-5 transition-colors duration-200 ease-out", active ? "text-primary" : "text-muted-foreground")} strokeWidth={1.5} />
                    </div>
                  )}
                  <span
                    className={cn(
                      "truncate transition-all duration-250 ease-in-out whitespace-nowrap min-w-0",
                      collapsed && !isMobile ? "opacity-0 w-0 max-w-0 overflow-hidden -translate-x-1" : "opacity-100 max-w-full translate-x-0"
                    )}
                  >
                    {item.label}
                  </span>
                  {item.badge !== undefined && !active && (
                    <span
                      className={cn(
                        "inline-flex items-center justify-center rounded-full text-xs font-semibold min-w-[20px] h-5 px-1.5 transition-all duration-250 ease-in-out",
                        item.badge === 0 ? "bg-muted text-muted-foreground" : "bg-destructive text-destructive-foreground",
                        collapsed && !isMobile ? "opacity-0 w-0 overflow-hidden -translate-x-1" : "opacity-100 translate-x-0"
                      )}
                    >
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Account Section - Bottom */}
      <div className={cn(
        "border-t border-border/60 px-3 py-3",
        collapsed && !isMobile && "px-2"
      )}>
        <AccountMenu
          role={role}
          align="start"
          side="right"
          trigger={
            collapsed && !isMobile ? (
              /* Collapsed: Show avatar only */
              <div className="flex items-center justify-center">
                <div className="h-9 w-9 flex items-center justify-center rounded-full bg-gradient-to-br from-primary to-blue-600 text-xs font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:shadow-md">
                  {getInitials(userName)}
                </div>
              </div>
            ) : (
              /* Expanded: Show user info with chevron */
              <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-200 hover:bg-muted cursor-pointer group">
                <div className="h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-full bg-gradient-to-br from-primary to-blue-600 text-xs font-semibold text-primary-foreground shadow-sm transition-all duration-200 group-hover:shadow-md">
                  {getInitials(userName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{userName}</p>
                  <p className="text-xs text-muted-foreground truncate">Account</p>
                </div>
                <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform duration-200" strokeWidth={1.5} />
              </div>
            )
          }
        />
      </div>
    </div>
  );

  // Desktop: always visible sidebar with collapse support
  // Mobile: sheet overlay
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block">
        <SidebarContent isMobile={false} />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent 
          side="left" 
          className="w-[280px] p-0 transition-transform duration-200 ease-out"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <SidebarContent isMobile={true} />
        </SheetContent>
      </Sheet>
    </>
  );
}
