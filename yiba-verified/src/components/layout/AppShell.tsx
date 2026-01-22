"use client";

import { ReactNode, useState, useEffect } from "react";
import { toast } from "sonner";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { WelcomeModal } from "@/components/onboarding/WelcomeModal";
import { AnnouncementLoginModal } from "@/components/shared/AnnouncementLoginModal";
import { ViewAsUserBanner } from "@/components/shared/ViewAsUserBanner";
import { GradientShell } from "@/components/shared/Backgrounds";
import type { Role } from "@/lib/rbac";
import type { NavItem } from "./nav";

type AppShellProps = {
  children: ReactNode;
  navigationItems: NavItem[];
  currentUserRole: Role;
  userName?: string;
  // View As User props
  viewingAsUserId?: string | null;
  viewingAsRole?: Role | null;
  viewingAsUserName?: string | null;
  originalUserName?: string;
  originalRole?: Role;
};

export function AppShell({
  children,
  navigationItems,
  currentUserRole,
  userName = "User",
  viewingAsUserId,
  viewingAsRole,
  viewingAsUserName,
  originalUserName,
  originalRole,
}: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [welcomeModalOpen, setWelcomeModalOpen] = useState(false);
  const [showAnnouncementsAfterWelcome, setShowAnnouncementsAfterWelcome] = useState(false);

  // Show welcome modal: once per login (session), up to 5 times total (lifetime).
  useEffect(() => {
    if (typeof window === "undefined") return;

    const welcomeCount = parseInt(localStorage.getItem("yv_welcome_count") || "0", 10);
    const shownThisSession = sessionStorage.getItem("yv_welcome_shown_this_session") === "1";
    const maxShows = 5;

    if (welcomeCount < maxShows && !shownThisSession) {
      const timer = setTimeout(() => {
        setWelcomeModalOpen(true);
        sessionStorage.setItem("yv_welcome_shown_this_session", "1");
      }, 500);
      return () => clearTimeout(timer);
    } else {
      // If welcome modal won't show, allow announcements immediately
      setShowAnnouncementsAfterWelcome(true);
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
    // If modal is being closed (not opened), increment count and show announcements
    if (!open && typeof window !== "undefined") {
      const currentCount = parseInt(localStorage.getItem("yv_welcome_count") || "0", 10);
      localStorage.setItem("yv_welcome_count", String(currentCount + 1));
      // Show announcements after welcome modal closes
      setShowAnnouncementsAfterWelcome(true);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-muted/20">
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

        {/* Page content: GradientShell for depth, consistent container (w-[90%] max-w-[1600px], ~40px padding) */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <GradientShell as="div" className="min-h-full bg-background">
            <div className="mx-auto w-[90%] max-w-[1600px] py-8 px-6 sm:px-8 md:px-[2.5rem] box-border">
              {/* View As User Banner */}
              {viewingAsUserId && viewingAsRole && viewingAsUserName && originalUserName && originalRole && (
                <ViewAsUserBanner
                  viewingAsUserId={viewingAsUserId}
                  viewingAsRole={viewingAsRole}
                  viewingAsUserName={viewingAsUserName}
                  originalUserName={originalUserName}
                  originalRole={originalRole}
                  onStop={async () => {
                    try {
                      const response = await fetch("/api/view-as/stop", {
                        method: "POST",
                      });
                      if (response.ok) {
                        window.location.reload();
                      } else {
                        toast.error("Failed to stop viewing as user");
                      }
                    } catch (error) {
                      console.error("Failed to stop viewing as user:", error);
                      toast.error("Failed to stop viewing as user");
                    }
                  }}
                />
              )}
              {children}
            </div>
          </GradientShell>
        </main>
      </div>

      {/* Welcome Modal (shows first if needed) */}
      <WelcomeModal
        open={welcomeModalOpen}
        onOpenChange={handleModalChange}
        onStartTour={handleStartTour}
        onSkip={handleSkip}
      />

      {/* Announcement popup (shows after welcome modal closes, or immediately if no welcome modal) */}
      <AnnouncementLoginModal enabled={showAnnouncementsAfterWelcome} />
    </div>
  );
}
