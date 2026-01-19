import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

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

export default function FeaturesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNav />
      <main className="flex-1">
        <section className="bg-background py-20 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
                Powerful Features for Compliance
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                Everything you need to manage QCTO compliance requirements
                efficiently and effectively.
              </p>
            </div>

            <div className="mx-auto mt-16 max-w-5xl space-y-16">
              {/* Institutional Features */}
              <div>
                <div className="mb-8">
                  <Badge variant="secondary" className="mb-4">
                    For Institutions
                  </Badge>
                  <h2 className="text-2xl font-bold">Institutional Management</h2>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Readiness Documentation</CardTitle>
                      <CardDescription>
                        Manage and submit Programme Delivery Readiness
                        documentation with ease.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Evidence Vault</CardTitle>
                      <CardDescription>
                        Securely store and organize compliance evidence and
                        supporting documents.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Learner Management</CardTitle>
                      <CardDescription>
                        Create, update, and manage learner profiles and records
                        in one centralized system.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Submission Tracking</CardTitle>
                      <CardDescription>
                        Track the status of submissions and reviews in
                        real-time.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </div>
              </div>

              <Separator />

              {/* QCTO Features */}
              <div>
                <div className="mb-8">
                  <Badge variant="secondary" className="mb-4">
                    For QCTO Reviewers
                  </Badge>
                  <h2 className="text-2xl font-bold">Review & Approval</h2>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Review Workflows</CardTitle>
                      <CardDescription>
                        Streamlined workflows for reviewing and evaluating
                        institutional submissions.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Decision Management</CardTitle>
                      <CardDescription>
                        Make informed decisions with comprehensive review tools
                        and documentation.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Audit Trails</CardTitle>
                      <CardDescription>
                        Complete audit logs of all review activities and
                        decisions.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Dashboard Insights</CardTitle>
                      <CardDescription>
                        High-level overview of pending reviews and system
                        activity.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </div>
              </div>

              <Separator />

              {/* Learner Features */}
              <div>
                <div className="mb-8">
                  <Badge variant="secondary" className="mb-4">
                    For Learners
                  </Badge>
                  <h2 className="text-2xl font-bold">Learner Portal</h2>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Profile Management</CardTitle>
                      <CardDescription>
                        View and manage personal profile information and
                        credentials.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Progress Tracking</CardTitle>
                      <CardDescription>
                        Monitor learning progress and completion status.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </div>
              </div>
            </div>

            <div className="mt-16 text-center">
              <Button asChild size="lg">
                <Link href="/contact">Request Demo</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
