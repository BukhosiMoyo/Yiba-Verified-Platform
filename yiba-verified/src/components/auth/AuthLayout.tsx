"use client";

import React from "react";
import Image from "next/image";
import { Shield, FileCheck, Lock } from "lucide-react";
import { DotGrid, DotGridDark } from "@/components/shared/Backgrounds";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

interface AuthLayoutProps {
  children: React.ReactNode;
}

const trustBullets = [
  { icon: Shield, text: "QCTO-aligned workflows" },
  { icon: FileCheck, text: "Full audit trails" },
  { icon: Lock, text: "Secure by design" },
];

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-muted/30 relative">
      {/* Global theme toggle — top-right on auth pages */}
      <div className="absolute right-4 top-4 z-20 lg:right-6 lg:top-6">
        <ThemeToggle variant="icon-sm" aria-label="Toggle light or dark mode" />
      </div>

      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left Column - Auth Content */}
        <div className="flex items-center justify-center px-6 py-12 lg:px-14">
          <div className="w-full max-w-[420px]">{children}</div>
        </div>

        {/* Right Column - Visual Panel */}
        <div className="hidden lg:flex flex-col relative overflow-hidden border-l border-border/60 bg-gradient-to-br from-[var(--bg-gradient-panel-start)] via-accent/20 to-[var(--bg-gradient-panel-end)] dark:via-primary/5">
          <DotGrid className="opacity-[var(--pattern-opacity)] dark:opacity-0" />
          <DotGridDark />
          <div className="flex-1 flex flex-col justify-center px-14 py-20 relative z-10">
            {/* Brand & Headline */}
            <div className="mb-10">
              <Image src="/Yiba%20Verified%20Logo.webp" alt="Yiba Verified" width={200} height={44} className="h-11 object-contain object-left mb-5 dark:hidden" sizes="200px" priority loading="eager" />
              <Image src="/YIBA%20VERIFIED%20DARK%20MODE%20LOGO.webp" alt="Yiba Verified" width={200} height={44} className="h-11 object-contain object-left mb-5 hidden dark:block" sizes="200px" priority loading="eager" />
              <h2 className="text-2xl font-semibold text-foreground mb-2">Yiba Verified</h2>
              <p className="text-base text-muted-foreground">
                Streamline your qualification verification. Manage documents, track submissions, and ensure compliance with ease.
              </p>
              {/* Trust bullets */}
              <ul className="mt-6 space-y-3">
                {trustBullets.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" strokeWidth={1.5} />
                    </span>
                    {text}
                  </li>
                ))}
              </ul>
            </div>

            {/* Mini product preview */}
            <div className="mt-8">
              <div className="rounded-2xl border border-border/70 bg-card/95 p-6 shadow-[var(--shadow-card)] backdrop-blur-sm dark:bg-card/90">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-3.5 bg-muted rounded-md w-28" />
                    <div className="h-3.5 bg-muted rounded-md w-16" />
                  </div>
                  <div className="h-28 rounded-xl border border-border/50 bg-muted/50 flex items-end justify-between p-3 gap-2">
                    <div className="flex-1 h-3/4 bg-primary/20 rounded-t-md" />
                    <div className="flex-1 h-2/3 bg-primary/20 rounded-t-md" />
                    <div className="flex-1 h-full bg-primary/25 rounded-t-md" />
                    <div className="flex-1 h-4/5 bg-primary/20 rounded-t-md" />
                    <div className="flex-1 h-3/4 bg-primary/20 rounded-t-md" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="h-12 bg-muted/80 rounded-lg border border-border/50" />
                    <div className="h-12 bg-muted/80 rounded-lg border border-border/50" />
                    <div className="h-12 bg-muted/80 rounded-lg border border-border/50" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
