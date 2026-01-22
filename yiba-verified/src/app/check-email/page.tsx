"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthState } from "@/components/auth/AuthState";
import { Button } from "@/components/ui/button";
import { Mail, Loader2 } from "lucide-react";

function CheckEmailContent() {
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

export default function CheckEmailPage() {
  return (
    <Suspense
      fallback={
        <AuthLayout>
          <AuthCard>
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          </AuthCard>
        </AuthLayout>
      }
    >
      <CheckEmailContent />
    </Suspense>
  );
}
