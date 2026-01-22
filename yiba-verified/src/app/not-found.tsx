import Link from "next/link";
import { getServerSession } from "next-auth";
import { Home, LayoutDashboard, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthState } from "@/components/auth/AuthState";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { authOptions } from "@/lib/auth";
import type { Role } from "@/lib/rbac";
import { GoBackButton } from "@/components/shared/GoBackButton";

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
};

function getDashboardHref(role: string | undefined): string {
  if (role && role in roleDashboardHref) {
    return roleDashboardHref[role as Role];
  }
  return "/account";
}

export default async function NotFoundPage() {
  const session = await getServerSession(authOptions);
  const isAuthenticated = !!session?.user;
  const role = session?.user?.role;
  const dashboardHref = getDashboardHref(role);

  // For authenticated users, show a more integrated experience
  if (isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            <AuthCard>
              <AuthState
                variant="error"
                icon={<HelpCircle className="h-6 w-6" strokeWidth={1.5} />}
                title="Page Not Found"
                description={
                  <>
                    The page you're looking for doesn't exist or has been moved.
                    <br />
                    <br />
                    If you believe this is an error, please contact support.
                  </>
                }
                actions={
                  <div className="flex flex-col gap-3 w-full">
                    <Button asChild className="w-full h-10 font-semibold">
                      <Link href={dashboardHref}>
                        <LayoutDashboard className="h-4 w-4 mr-2" strokeWidth={1.5} aria-hidden />
                        Go to Dashboard
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full h-10">
                      <Link href="/">
                        <Home className="h-4 w-4 mr-2" strokeWidth={1.5} aria-hidden />
                        Go Home
                      </Link>
                    </Button>
                    <GoBackButton variant="ghost" className="w-full h-10" />
                  </div>
                }
              />
            </AuthCard>
          </div>
        </div>
      </div>
    );
  }

  // For unauthenticated users, show marketing-style 404
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingNav />
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <AuthCard>
            <AuthState
              variant="error"
              icon={<HelpCircle className="h-6 w-6" strokeWidth={1.5} />}
              title="Page Not Found"
              description={
                <>
                  The page you're looking for doesn't exist or has been moved.
                  <br />
                  <br />
                  If you believe this is an error, please{" "}
                  <Link href="/contact" className="text-primary hover:underline font-medium">
                    contact support
                  </Link>
                  .
                </>
              }
              actions={
                <div className="flex flex-col gap-3 w-full">
                  <Button asChild className="w-full h-10 font-semibold">
                    <Link href="/">
                      <Home className="h-4 w-4 mr-2" strokeWidth={1.5} aria-hidden />
                      Go Home
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full h-10">
                    <Link href="/login">
                      Sign In
                    </Link>
                  </Button>
                </div>
              }
            />
          </AuthCard>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
