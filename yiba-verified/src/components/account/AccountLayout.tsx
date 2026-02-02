"use client";

import { ReactNode, useState } from "react";
import { AccountSidebar } from "./AccountSidebar";
import type { Role } from "@/lib/rbac";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex gap-6">
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

      {/* Mobile Sidebar Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden fixed top-20 left-4 z-20 h-9 w-9 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
        onClick={() => setSidebarOpen(true)}
      >
        <Menu className="h-4 w-4" />
      </Button>

      {/* Mobile Account Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-[280px] p-0">
          <AccountSidebar
            userName={userName}
            userRole={currentUserRole}
            userEmail={userEmail}
            userImage={userImage}
            verificationLevel={verificationLevel}
          />
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}