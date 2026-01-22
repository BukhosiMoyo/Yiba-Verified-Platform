import type { Metadata } from "next";
import Link from "next/link";
import type { ComponentType } from "react";
import { FileText, FolderOpen, Users, ClipboardList, Eye, BarChart3, User, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { GradientShell } from "@/components/shared/Backgrounds";

export const metadata: Metadata = {
  title: "Features - Yiba Verified",
  description:
    "Discover the comprehensive features of Yiba Verified. Institutional management, QCTO review workflows, learner tracking, and compliance tools.",
  openGraph: {
    title: "Features - Yiba Verified",
    description:
      "Discover the comprehensive features of Yiba Verified. Institutional management, QCTO review workflows, learner tracking, and compliance tools.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Features - Yiba Verified",
    description:
      "Discover the comprehensive features of Yiba Verified. Institutional management, QCTO review workflows, learner tracking, and compliance tools.",
  },
};

function FeatureCard({
  title,
  desc,
  icon: Icon,
}: {
  title: string;
  desc: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
}) {
  return (
    <Card className="group border-[var(--border-subtle)] bg-card transition-all duration-200 hover:shadow-[var(--shadow-float)] hover:-translate-y-0.5 hover:border-primary/25 dark:hover:border-primary/30">
      <CardHeader>
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
          <Icon className="h-5 w-5" strokeWidth={1.5} />
        </div>
        <CardTitle className="text-foreground">{title}</CardTitle>
        <CardDescription>{desc}</CardDescription>
      </CardHeader>
    </Card>
  );
}

export default function FeaturesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingNav />
      <main className="flex-1">
        <GradientShell as="section" className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="text-[2.25rem] font-bold leading-tight tracking-tight text-foreground sm:text-4xl md:text-5xl">
                Powerful Features for Compliance
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                Everything you need to manage QCTO compliance requirements efficiently and effectively.
              </p>
            </div>

            <div className="mx-auto mt-16 max-w-5xl space-y-20">
              {/* Institutional */}
              <div>
                <div className="mb-8">
                  <Badge variant="secondary" className="mb-4 rounded-full border-border/60">For Institutions</Badge>
                  <h2 className="text-2xl font-bold text-foreground">Institutional Management</h2>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <FeatureCard title="Readiness Documentation" desc="Manage and submit Programme Delivery Readiness documentation with ease." icon={FileText} />
                  <FeatureCard title="Evidence Vault" desc="Securely store and organize compliance evidence and supporting documents." icon={FolderOpen} />
                  <FeatureCard title="Learner Management" desc="Create, update, and manage learner profiles and records in one centralized system." icon={Users} />
                  <FeatureCard title="Submission Tracking" desc="Track the status of submissions and reviews in real-time." icon={ClipboardList} />
                </div>
              </div>

              <Separator className="bg-border/60" />

              {/* QCTO */}
              <div>
                <div className="mb-8">
                  <Badge variant="secondary" className="mb-4 rounded-full border-border/60">For QCTO Reviewers</Badge>
                  <h2 className="text-2xl font-bold text-foreground">Review & Approval</h2>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <FeatureCard title="Review Workflows" desc="Streamlined workflows for reviewing and evaluating institutional submissions." icon={Eye} />
                  <FeatureCard title="Decision Management" desc="Make informed decisions with comprehensive review tools and documentation." icon={ClipboardList} />
                  <FeatureCard title="Audit Trails" desc="Complete audit logs of all review activities and decisions." icon={FileText} />
                  <FeatureCard title="Dashboard Insights" desc="High-level overview of pending reviews and system activity." icon={BarChart3} />
                </div>
              </div>

              <Separator className="bg-border/60" />

              {/* Learner */}
              <div>
                <div className="mb-8">
                  <Badge variant="secondary" className="mb-4 rounded-full border-border/60">For Learners</Badge>
                  <h2 className="text-2xl font-bold text-foreground">Learner Portal</h2>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <FeatureCard title="Profile Management" desc="View and manage personal profile information and credentials." icon={User} />
                  <FeatureCard title="Progress Tracking" desc="Monitor learning progress and completion status." icon={TrendingUp} />
                </div>
              </div>
            </div>

            <div className="mt-16 text-center">
              <Button asChild size="lg" className="btn-primary-premium rounded-xl px-8">
                <Link href="/contact">Request Demo</Link>
              </Button>
            </div>
          </div>
        </GradientShell>
      </main>
      <MarketingFooter />
    </div>
  );
}
