"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthState } from "@/components/auth/AuthState";
import { Button } from "@/components/ui/button";
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

export default function SignupPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Redirect if user is already logged in
  if (status === "authenticated" && session?.user?.role) {
    const role = session.user.role as Role;
    if (role && roleRedirects[role]) {
      router.replace(roleRedirects[role]);
      return null;
    }
  }

  return (
    <AuthLayout>
      <AuthCard>
        <AuthState
          variant="info"
          title="Registration is invite-only"
          description="Please contact your institution administrator or platform admin to receive an invitation link to join Yiba Verified."
          actions={
            <div className="flex flex-col gap-3 mt-4">
              <Button
                onClick={() => router.push("/login")}
                className="w-full h-10"
              >
                Back to Sign In
              </Button>
            </div>
          }
        />
      </AuthCard>
    </AuthLayout>
  );
}
