"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export function PlatformAdminOnboardingWizard() {
  const { update: updateSession } = useSession();
  const [acknowledged, setAcknowledged] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const handleSubmit = async () => {
    if (!acknowledged) {
      toast.error("Please acknowledge the responsibilities");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/platform-admin/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = typeof result?.error === "string" ? result.error : "Failed to complete onboarding";
        throw new Error(message);
      }

      await updateSession({ onboarding_completed: true });
      toast.success("Onboarding completed successfully!");
      // Full page navigation so the new JWT cookie is sent; avoids middleware redirect back to onboarding
      window.location.href = "/platform-admin";
    } catch (error: any) {
      console.error("Failed to complete onboarding:", error);
      toast.error(error.message || "Failed to complete onboarding");
    } finally {
      setIsSubmitting(false);
    }
  };

  const overlay = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="platform-admin-onboarding-title"
    >
      {/* Blurred backdrop: covers entire viewport including sidebar/topbar, blocks interaction */}
      <div
        className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-xl"
        aria-hidden="true"
      />
      <div className="relative z-10 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <Card className="overflow-hidden border-0 shadow-xl dark:shadow-2xl dark:shadow-black/40 bg-card dark:bg-zinc-900/95 ring-1 ring-border/80 dark:ring-white/10">
          {/* Welcoming header: soft gradient, works in light + dark */}
          <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-transparent dark:from-primary/20 dark:via-primary/10 dark:to-transparent border-b border-border/60 dark:border-white/10 px-6 pt-8 pb-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 dark:bg-primary/25 text-primary ring-2 ring-primary/20 dark:ring-primary/30">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle id="platform-admin-onboarding-title" className="text-xl sm:text-2xl text-foreground dark:text-white">
                  Platform Admin Onboarding
                </CardTitle>
                <CardDescription className="mt-1.5 text-base text-muted-foreground dark:text-zinc-400">
                  Welcome to Yiba Verified! As a Platform Admin, you have full access to the system.
                </CardDescription>
              </div>
            </div>
          </div>

          <CardContent className="space-y-6 p-6 pt-6">
            {/* Responsibilities: soft panel */}
            <div className="rounded-xl bg-muted/50 dark:bg-white/5 border border-border/50 dark:border-white/10 p-4 space-y-3">
              <h3 className="font-semibold text-foreground dark:text-white flex items-center gap-2">
                <span className="text-primary dark:text-primary">Your Responsibilities</span>
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground dark:text-zinc-400">
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60 dark:bg-primary/80" aria-hidden />
                  <span>Manage all users and institutions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60 dark:bg-primary/80" aria-hidden />
                  <span>Configure system settings and announcements</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60 dark:bg-primary/80" aria-hidden />
                  <span>Monitor system health and audit logs</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60 dark:bg-primary/80" aria-hidden />
                  <span>Provide support to QCTO and institution users</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60 dark:bg-primary/80" aria-hidden />
                  <span>Ensure data security and compliance</span>
                </li>
              </ul>
            </div>

            {/* Key Features: soft panel */}
            <div className="rounded-xl bg-muted/50 dark:bg-white/5 border border-border/50 dark:border-white/10 p-4 space-y-3">
              <h3 className="font-semibold text-foreground dark:text-white">Key Features</h3>
              <ul className="space-y-2 text-sm text-muted-foreground dark:text-zinc-400">
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500/70 dark:bg-emerald-400/60" aria-hidden />
                  <span>View and manage all institutions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500/70 dark:bg-emerald-400/60" aria-hidden />
                  <span>Create and manage user accounts</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500/70 dark:bg-emerald-400/60" aria-hidden />
                  <span>View as any user for support purposes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500/70 dark:bg-emerald-400/60" aria-hidden />
                  <span>Access comprehensive audit logs</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500/70 dark:bg-emerald-400/60" aria-hidden />
                  <span>Manage system-wide announcements</span>
                </li>
              </ul>
            </div>

            {/* Acknowledgment */}
            <div className="rounded-xl bg-muted/40 dark:bg-white/5 border border-border/50 dark:border-white/10 p-4 pt-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="acknowledge"
                  checked={acknowledged}
                  onCheckedChange={(checked) => setAcknowledged(checked === true)}
                  className="mt-0.5 border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary dark:data-[state=checked]:bg-primary dark:data-[state=checked]:border-primary"
                />
                <Label htmlFor="acknowledge" className="text-sm cursor-pointer text-foreground dark:text-zinc-200 leading-snug">
                  I acknowledge that I understand my responsibilities as a Platform Admin and will use
                  my access privileges responsibly.
                </Label>
              </div>
            </div>

            {/* CTA */}
            <div className="flex justify-end pt-2">
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !acknowledged}
                className="min-w-[180px] bg-primary hover:bg-primary/90 text-primary-foreground dark:bg-primary dark:hover:bg-primary/90 dark:text-primary-foreground shadow-md hover:shadow-lg transition-all"
              >
                {isSubmitting ? "Completing..." : "Complete Onboarding"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Portal into body so overlay sits above sidebar and topbar (they live in AppShell; z-[100] wins)
  if (!mounted || typeof document === "undefined") {
    return (
      <div className="max-w-2xl mx-auto py-8 opacity-0 pointer-events-none">
        <Card>
          <CardHeader>
            <CardTitle>Platform Admin Onboarding</CardTitle>
            <CardDescription>Loading…</CardDescription>
          </CardHeader>
          <CardContent />
        </Card>
      </div>
    );
  }

  return createPortal(overlay, document.body);
}
