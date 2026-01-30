"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthState } from "@/components/auth/AuthState";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { Role } from "@/lib/rbac";

const roleRedirects: Record<Role, string> = {
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

function AcceptCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const token = searchParams.get("token");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      setLoading(false);
      return;
    }
    if (status !== "authenticated" || !token) {
      if (!token) setError("Invalid link — no token provided.");
      setLoading(false);
      return;
    }

    const run = async () => {
      try {
        const res = await fetch("/api/invites/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to accept invitation");
          setLoading(false);
          return;
        }
        const role = session?.user?.role as Role | undefined;
        if (role && roleRedirects[role]) {
          if (role === "STUDENT") {
            const onboardingRes = await fetch("/api/student/onboarding/status");
            const onboardingData = await onboardingRes.json();
            if (onboardingData.data && !onboardingData.data.completed) {
              router.push("/student/onboarding");
            } else {
              router.push(roleRedirects[role]);
            }
          } else {
            router.push(roleRedirects[role]);
          }
          router.refresh();
        } else {
          router.push("/unauthorized");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [status, token, session?.user?.role, router]);

  if (status === "unauthenticated") {
    return (
      <AuthLayout>
        <AuthCard>
          <AuthState
            variant="info"
            title="Sign in required"
            description="Please sign in with the email that received the invitation, then try the link again."
            actions={
              <Button asChild className="w-full h-10">
                <a href="/login">Sign in</a>
              </Button>
            }
          />
        </AuthCard>
      </AuthLayout>
    );
  }

  if (error && !loading) {
    return (
      <AuthLayout>
        <AuthCard>
          <AuthState
            variant="error"
            title="Could not accept"
            description={error}
            actions={
              <div className="flex flex-col gap-2 mt-4">
                <Button onClick={() => router.push("/institution")} className="w-full h-10">
                  Go to dashboard
                </Button>
                <Button variant="outline" onClick={() => router.push("/invite?token=" + encodeURIComponent(token ?? ""))} className="w-full h-10">
                  Try again
                </Button>
              </div>
            }
          />
        </AuthCard>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <AuthCard title="Accepting invitation..." subtitle="Linking your account">
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AuthCard>
    </AuthLayout>
  );
}

export default function AcceptCallbackPage() {
  return (
    <Suspense
      fallback={
        <AuthLayout>
          <AuthCard title="Loading...">
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </AuthCard>
        </AuthLayout>
      }
    >
      <AcceptCallbackContent />
    </Suspense>
  );
}
