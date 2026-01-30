"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import type { Role } from "@/lib/rbac";

type ImpersonationLoginClientProps = {
  token: string;
  targetUserId: string;
  targetUserEmail: string;
  targetUserRole: Role;
  dashboardRoute: string;
  expiresAt: string;
};

/**
 * Client component that handles the actual login via NextAuth
 * This is needed because signIn() is a client-side function
 */
export function ImpersonationLoginClient({
  token,
  targetUserId,
  targetUserEmail,
  targetUserRole,
  dashboardRoute,
  expiresAt,
}: ImpersonationLoginClientProps) {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const performLogin = async () => {
      try {
        // Use NextAuth's signIn with the impersonation provider
        const result = await signIn("impersonation", {
          token,
          redirect: false,
        });

        if (result?.error) {
          throw new Error(result.error);
        }

        if (result?.ok) {
          setStatus("success");
          // Redirect to dashboard
          window.location.href = dashboardRoute;
        } else {
          throw new Error("Login failed");
        }
      } catch (err: any) {
        console.error("Impersonation login error:", err);
        setError(err.message || "Failed to login");
        setStatus("error");
      }
    };

    performLogin();
  }, [token, dashboardRoute]);

  // Set up heartbeat to keep session alive (every 5 minutes)
  useEffect(() => {
    if (status !== "success") return;

    const heartbeatInterval = setInterval(async () => {
      try {
        await fetch("/api/view-as/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
      } catch (error) {
        console.error("Heartbeat failed:", error);
        // Don't show error to user, just log it
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(heartbeatInterval);
  }, [status, token]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <div className="max-w-md w-full mx-4 text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <h1 className="text-2xl font-bold mb-2">Logging in...</h1>
          <p className="text-muted-foreground">
            Logging in as {targetUserEmail}
          </p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <div className="max-w-md w-full mx-4">
          <Alert
            variant="error"
            icon={<AlertCircle className="h-4 w-4" />}
            title="Login Failed"
            description={<p className="text-sm">{error}</p>}
          />
        </div>
      </div>
    );
  }

  return null;
}
