"use client";

import { ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AccountSidebar } from "./AccountSidebar";
import type { Role } from "@/lib/rbac";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAccountNavItems } from "./nav";

import type { VerificationLevel } from "@/lib/verification";

type AccountLayoutProps = {
  children: ReactNode;
  currentUserRole: Role;
  userName: string;
  userEmail?: string;
  userImage?: string | null;
  verificationLevel?: VerificationLevel;
};

export function AccountLayout({
  children,
  currentUserRole,
  userName,
  userEmail,
  userImage,
  verificationLevel,
}: AccountLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const navItems = getAccountNavItems(currentUserRole);

  const activeItem = navItems.find((item) => pathname.startsWith(item.href)) || navItems[0];

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Mobile Navigation Dropdown */}
      <div className="lg:hidden w-full mb-2">
        <Select
          value={activeItem?.href}
          onValueChange={(value) => router.push(value)}
        >
          <SelectTrigger className="w-full bg-card">
            <div className="flex items-center gap-2">
              {activeItem && <activeItem.icon className="h-4 w-4 text-muted-foreground" />}
              <SelectValue placeholder="Select section" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {navItems.map((item) => (
              <SelectItem key={item.href} value={item.href}>
                <div className="flex items-center gap-2">
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                  <span>{item.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop Account Sidebar */}
      <aside className="hidden lg:block w-[280px] flex-shrink-0">
        <AccountSidebar
          userName={userName}
          userRole={currentUserRole}
          userEmail={userEmail}
          userImage={userImage}
          verificationLevel={verificationLevel}
        />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}