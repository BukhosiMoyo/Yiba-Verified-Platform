"use client";

import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthState } from "@/components/auth/AuthState";
import { Button } from "@/components/ui/button";

export default function ResetSuccessPage() {
  return (
    <AuthLayout>
      <AuthCard>
        <AuthState
          variant="success"
          title="Password updated"
          description="Your password has been changed successfully. You can sign in now with your new password."
          actions={
            <Button asChild className="w-full h-10 font-semibold">
              <Link href="/login">Continue to Sign In</Link>
            </Button>
          }
        />
      </AuthCard>
    </AuthLayout>
  );
}
