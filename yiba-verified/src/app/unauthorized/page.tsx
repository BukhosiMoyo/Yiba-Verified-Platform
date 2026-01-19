"use client";

import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthState } from "@/components/auth/AuthState";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <AuthLayout>
      <AuthCard>
        <AuthState
          variant="error"
          title="Access Denied"
          description={
            <>
              You don't have permission to access this area.
              <br />
              If you believe this is an error, please contact your administrator.
            </>
          }
          actions={
            <Button asChild className="w-full h-10 font-semibold">
              <Link href="/login">Back to Sign In</Link>
            </Button>
          }
        />
      </AuthCard>
    </AuthLayout>
  );
}
