"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getAccountNavItems } from "./accountNav";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/rbac";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

type AccountMenuProps = {
  role: Role;
  trigger: React.ReactNode;
  align?: "start" | "end";
  side?: "top" | "bottom" | "left" | "right";
};

export function AccountMenu({
  role,
  trigger,
  align = "end",
  side = "bottom",
}: AccountMenuProps) {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const navItems = getAccountNavItems(role);
  const isAccountPageActive = pathname?.startsWith("/account");

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    // Check if this is an impersonation session and complete it
    try {
      const response = await fetch("/api/view-as/logout", {
        method: "POST",
      });
      // Continue with logout even if impersonation logout fails
    } catch (error) {
      console.error("Failed to complete impersonation session:", error);
    }

    await signOut({ redirect: false });
    router.push("/login");
  };

  const isItemActive = (href: string): boolean => {
    if (pathname === href) return true;
    // Check if pathname starts with href (for nested routes)
    return pathname?.startsWith(href + "/") ?? false;
  };

  const triggerClassName = cn(
    "cursor-pointer transition-colors duration-150",
    isAccountPageActive && "[&_span:not([data-role-pill])]:text-blue-700 [&_p]:text-blue-700 [&_svg]:text-blue-700"
  );

  // Defer Radix DropdownMenu until after mount to avoid hydration mismatch from
  // Radix's auto-generated IDs differing between server and client (e.g. when
  // multiple AccountMenus exist in Sidebar desktop + mobile).
  if (!mounted) {
    return <div className={triggerClassName}>{trigger}</div>;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className={triggerClassName}>
          {trigger}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        side={side}
        className="w-56 rounded-xl border-gray-200/60 bg-white shadow-lg"
        sideOffset={8}
      >
        {navItems
          .filter((item) => item && item.href) // Safety: filter out items without href
          .map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item.href);

            return (
              <DropdownMenuItem
                key={item.href}
                asChild
                className={cn(
                  "cursor-pointer transition-colors duration-150",
                  active && "bg-blue-50/60 text-blue-700"
                )}
              >
                <Link href={item.href || "#"} className="flex items-center gap-2">
                <Icon
                  className={cn(
                    "h-4 w-4 transition-colors duration-150",
                    active ? "text-blue-700" : "text-gray-500"
                  )}
                  strokeWidth={1.5}
                />
                <span>{item.label}</span>
              </Link>
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator className="my-1 bg-gray-200/60" />
        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700 flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" strokeWidth={1.5} />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}