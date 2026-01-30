"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Check, Shield, FileCheck } from "lucide-react";

export function InviteDeclinedClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const inviteLink = token ? `/invite?token=${encodeURIComponent(token)}` : "/invite";

  return (
    <AuthLayout>
      <div className="w-full max-w-[480px] space-y-8 pb-8">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-foreground">Invitation declined</h1>
          <p className="text-muted-foreground text-sm mt-2">
            You've declined this invitation. No problem — you can change your mind anytime.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-4 shadow-sm">
          <h2 className="text-base font-semibold text-foreground">Why Yiba Verified?</h2>
          <ul className="text-muted-foreground text-sm space-y-3">
            <li className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Shield className="h-4 w-4" strokeWidth={1.5} />
              </span>
              <span>QCTO-recognised platform for qualification verification and accreditation</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileCheck className="h-4 w-4" strokeWidth={1.5} />
              </span>
              <span>Manage Form 5 readiness and interact with QCTO reviewers in one place</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground text-center">
            Changed your mind? You can still accept the invitation — the link remains valid until it expires.
          </p>
          <Button asChild className="w-full h-11 font-semibold">
            <Link href={inviteLink}>
              <Check className="h-4 w-4 mr-2" />
              Accept invitation
            </Link>
          </Button>
          <Button asChild variant="ghost" className="w-full">
            <Link href="/login">Back to sign in</Link>
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
}
