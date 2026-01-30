"use client";

import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthState } from "@/components/auth/AuthState";
import { Button } from "@/components/ui/button";

export default function AccountDeactivatedPage() {
  return (
    <AuthLayout>
      <AuthCard>
        <AuthState
          variant="warning"
          title="Account deactivated"
          description="Your account is currently disabled. Please contact your administrator or support to restore access."
          actions={
            <div className="space-y-3 w-full">
              <Button asChild className="w-full h-10 font-semibold">
                <Link href="/login">Back to Sign In</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full h-10 font-semibold"
              >
                <a href="mailto:support@yibaverified.co.za">Contact support</a>
              </Button>
            </div>
          }
        />
      </AuthCard>
    </AuthLayout>
  );
}
