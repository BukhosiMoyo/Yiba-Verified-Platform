"use client";

import { ReactNode, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useTour } from "@/components/tour/TourProvider";
import { WelcomeModal } from "@/components/onboarding/WelcomeModal";
import { AnnouncementLoginModal } from "@/components/shared/AnnouncementLoginModal";
import { ViewAsUserBanner } from "@/components/shared/ViewAsUserBanner";
import { ImpersonationHeartbeat } from "@/components/shared/ImpersonationHeartbeat";
import { ImpersonationSessionWarning } from "@/components/shared/ImpersonationSessionWarning";
import { FixedShellBackground, GradientShell } from "@/components/shared/Backgrounds";
import type { Role } from "@/lib/rbac";
import type { NavItem } from "./nav";
import { cn } from "@/lib/utils";
import type { InstitutionDisplay } from "@/lib/currentInstitution";

type AppShellProps = {
  children: ReactNode;
  navigationItems: NavItem[];
  currentUserRole: Role;
  userName?: string;
  userId?: string;
  userImage?: string | null;
  // View As User props
  viewingAsUserId?: string | null;
  viewingAsRole?: Role | null;
  viewingAsUserName?: string | null;
  originalUserName?: string;
  originalRole?: Role;
  // Multi-institution: show context switcher in header when user has multiple institutions
  institutions?: InstitutionDisplay[];
  currentInstitutionId?: string | null;
};

export function AppShell({
  children,
  navigationItems,
  currentUserRole,
  userName = "User",
  userId,
  userImage,
  viewingAsUserId,
  viewingAsRole,
  viewingAsUserName,
  originalUserName,
  originalRole,
  institutions,
  currentInstitutionId,
}: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [welcomeModalOpen, setWelcomeModalOpen] = useState(false);
  const [showAnnouncementsAfterWelcome, setShowAnnouncementsAfterWelcome] = useState(false);
  const { startTour } = useTour();

  // Show welcome modal: once per login (session), up to 5 times total (lifetime).
  useEffect(() => {
    if (typeof window === "undefined") return;

    const welcomeCount = parseInt(localStorage.getItem("yv_welcome_count") || "0", 10);
    const shownThisSession = sessionStorage.getItem("yv_welcome_shown_this_session") === "1";
    const maxShows = 1;

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
    startTour(currentUserRole);
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

  const sidebarWidthPx = sidebarCollapsed ? 72 : 280;
  const pathname = usePathname();
  const isProfilePage = pathname === "/student/profile";

  // Collapse main sidebar when entering student profile (profile has its own inner sidebar).
  useEffect(() => {
    if (pathname === "/student/profile") setSidebarCollapsed(true);
  }, [pathname]);

  return (
    <div className="relative flex flex-col h-screen overflow-hidden bg-muted/20">
      {/* Fixed background layer: gradient + dot grid (does not scroll with content) */}
      <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden>
        <FixedShellBackground />
      </div>

      {/* Top bar: full width behind sidebar (z-10); content inset by sidebar width on desktop */}
      <div
        className="absolute top-0 left-0 right-0 h-16 z-10"
        style={{ "--sidebar-width": `${sidebarWidthPx}px` } as React.CSSProperties}
      >
        <Topbar
          userName={userName}
          userId={userId}
          userImage={userImage}
          userRole={currentUserRole}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          sidebarCollapsed={sidebarCollapsed}
          onSidebarCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          sidebarWidth={sidebarWidthPx}
          institutions={institutions}
          currentInstitutionId={currentInstitutionId}
        />
      </div>

      {/* Sidebar: full height, overlaps top bar (z-20); desktop part is absolute inside Sidebar */}
      <Sidebar
        items={navigationItems}
        role={currentUserRole}
        viewingAsRole={viewingAsRole}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userName={userName}
        userImage={userImage}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />

      {/* Main content area: below top bar, right of sidebar (above fixed background) */}
      <div
        className={cn(
          "relative z-[1] flex-1 min-h-0 flex flex-col pt-16 lg:transition-[margin] lg:duration-[350ms] lg:ease-[cubic-bezier(0.32,0.72,0,1)]",
          sidebarCollapsed ? "lg:ml-[72px]" : "lg:ml-[280px]"
        )}
      >
        {/* Page content: no decoration (background is fixed layer); consistent container */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <GradientShell as="div" decoration="none" className="min-h-full bg-transparent">
            <div
              className={cn(
                "mx-auto w-full py-8 px-[10px] sm:px-6 md:px-8 box-border",
                isProfilePage ? "max-w-6xl" : "max-w-[1600px]"
              )}
            >
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
                        const data = await response.json();
                        // Redirect to original user's dashboard
                        const redirectTo = data.redirectTo || "/platform-admin";
                        window.location.href = redirectTo;
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

      {/* Impersonation heartbeat (keeps session alive when impersonating) */}
      <ImpersonationHeartbeat />

      {/* Impersonation session warnings (expiration and inactivity) */}
      <ImpersonationSessionWarning />
    </div>
  );
}
