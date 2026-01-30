import { getImpersonationSessionByToken, updateImpersonationActivity, getDashboardRouteForRole } from "@/lib/impersonation";
import { ImpersonationLoginClient } from "@/components/shared/ImpersonationLoginClient";

interface PageProps {
  params: Promise<{ token: string }>;
}

/**
 * GET /view-as/[token]
 * 
 * Impersonation login page. Validates token and creates a session for the target user.
 */
export default async function ImpersonationLoginPage({ params }: PageProps) {
  const { token } = await params;

  try {
    // Validate token and get session
    const session = await getImpersonationSessionByToken(token);

    // Update activity timestamp
    await updateImpersonationActivity(session.id);

    // Get dashboard route for target user
    const dashboardRoute = getDashboardRouteForRole(session.target_user.role);

    // Return client component that will handle the login
    return (
      <ImpersonationLoginClient
        token={token}
        targetUserId={session.target_user.user_id}
        targetUserEmail={session.target_user.email}
        targetUserRole={session.target_user.role}
        dashboardRoute={dashboardRoute}
        expiresAt={session.expires_at.toISOString()}
      />
    );
  } catch (error: any) {
    // If token is invalid/expired, show error page
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <div className="max-w-md w-full mx-4">
          <div className="bg-card border border-destructive/50 rounded-lg p-6 shadow-lg">
            <h1 className="text-2xl font-bold text-destructive mb-2">Invalid or Expired Link</h1>
            <p className="text-muted-foreground mb-4">
              {error.message || "This impersonation link is invalid or has expired."}
            </p>
            <p className="text-sm text-muted-foreground">
              Please contact your administrator to generate a new link.
            </p>
          </div>
        </div>
      </div>
    );
  }
}
