"use client";

import { ReactNode, useState, useEffect } from "react";
import { toast } from "sonner";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { WelcomeModal } from "@/components/onboarding/WelcomeModal";
import { AnnouncementBanner } from "@/components/shared/AnnouncementBanner";
import type { Role } from "@/lib/rbac";
import type { NavItem } from "./nav";

type AppShellProps = {
  children: ReactNode;
  navigationItems: NavItem[];
  currentUserRole: Role;
  userName?: string;
};

export function AppShell({
  children,
  navigationItems,
  currentUserRole,
  userName = "User",
}: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [welcomeModalOpen, setWelcomeModalOpen] = useState(false);

  // Show welcome modal: once per login (session), up to 5 times total (lifetime)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const welcomeCount = parseInt(localStorage.getItem("yv_welcome_count") || "0", 10);
    const shownThisSession = sessionStorage.getItem("yv_welcome_shown_this_session") === "1";
    const maxShows = 5;

    if (welcomeCount < maxShows && !shownThisSession) {
      const timer = setTimeout(() => {
        setWelcomeModalOpen(true);
        sessionStorage.setItem("yv_welcome_shown_this_session", "1");
      }, 400);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleStartTour = () => {
    // For now, show a toast. Tour system can be implemented later
    toast.info("Tour coming soon! We're working on an interactive guide.");
    // Modal will close via onOpenChange, which will increment the count
  };

  const handleSkip = () => {
    // Modal will close via onOpenChange, which will increment the count
  };

  const handleModalChange = (open: boolean) => {
    setWelcomeModalOpen(open);
    // If modal is being closed (not opened), increment count
    if (!open && typeof window !== "undefined") {
      const currentCount = parseInt(localStorage.getItem("yv_welcome_count") || "0", 10);
      localStorage.setItem("yv_welcome_count", String(currentCount + 1));
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar
        items={navigationItems}
        role={currentUserRole}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userName={userName}
      />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <Topbar
          userName={userName}
          userRole={currentUserRole}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Announcement Banner */}
        <AnnouncementBanner />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="mx-auto w-[90%] max-w-[1600px] py-8 px-10 box-border">
            {children}
          </div>
        </main>
      </div>

      {/* Welcome Modal */}
      <WelcomeModal
        open={welcomeModalOpen}
        onOpenChange={handleModalChange}
        onStartTour={handleStartTour}
        onSkip={handleSkip}
      />
    </div>
  );
}
