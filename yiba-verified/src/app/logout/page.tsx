"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthState } from "@/components/auth/AuthState";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    signOut({ redirect: false }).then(() => {
      router.push("/login");
    });
  }, [router]);

  return (
    <AuthLayout>
      <AuthCard>
        <AuthState
          variant="loading"
          title="Signing you out…"
          description="Please wait while we securely sign you out."
        />
      </AuthCard>
    </AuthLayout>
  );
}
