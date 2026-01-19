"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthState } from "@/components/auth/AuthState";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

export default function CheckEmailPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  return (
    <AuthLayout>
      <AuthCard>
        <AuthState
          variant="info"
          icon={<Mail className="h-5 w-5" strokeWidth={1.5} />}
          title="Check your email"
          description={
            <>
              {email ? (
                <>
                  We've sent a password reset link to <strong>{email}</strong>.
                  <br />
                  If you don't see it, check your spam folder.
                </>
              ) : (
                <>
                  We've sent a password reset link to your email address.
                  <br />
                  If you don't see it, check your spam folder.
                </>
              )}
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
