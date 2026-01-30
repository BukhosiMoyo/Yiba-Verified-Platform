"use client";

import { Suspense } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";
import { Loader2 } from "lucide-react";
import InviteReviewContent from "./InviteReviewClient";

export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <AuthLayout>
          <AuthCard title="Validating invite…" subtitle="Please wait">
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          </AuthCard>
        </AuthLayout>
      }
    >
      <InviteReviewContent />
    </Suspense>
  );
}
