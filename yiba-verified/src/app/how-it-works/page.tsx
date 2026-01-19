import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export const metadata: Metadata = {
  title: "How It Works - Yiba Verified",
  description:
    "Learn how Yiba Verified streamlines QCTO compliance workflows. From institutional submissions to QCTO review and approval.",
  openGraph: {
    title: "How It Works - Yiba Verified",
    description:
      "Learn how Yiba Verified streamlines QCTO compliance workflows. From institutional submissions to QCTO review and approval.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "How It Works - Yiba Verified",
    description:
      "Learn how Yiba Verified streamlines QCTO compliance workflows. From institutional submissions to QCTO review and approval.",
  },
};

export default function HowItWorksPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNav />
      <main className="flex-1">
        <section className="bg-background py-20 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
                How It Works
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                A streamlined process designed to simplify QCTO compliance
                management for everyone involved.
              </p>
            </div>

            <div className="mx-auto mt-16 max-w-4xl space-y-12">
              {/* Step 1 */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <Badge variant="default" className="h-8 w-8 items-center justify-center rounded-full p-0 text-sm">
                      1
                    </Badge>
                    <CardTitle className="text-2xl">Institution Setup</CardTitle>
                  </div>
                  <CardDescription className="text-base">
                    Institutions create accounts and configure their profiles
                    within the platform.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Administrators set up institutional information, upload
                    required documentation, and configure access for staff
                    members.
                  </p>
                </CardContent>
              </Card>

              {/* Step 2 */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <Badge variant="default" className="h-8 w-8 items-center justify-center rounded-full p-0 text-sm">
                      2
                    </Badge>
                    <CardTitle className="text-2xl">Readiness Documentation</CardTitle>
                  </div>
                  <CardDescription className="text-base">
                    Institutions prepare and submit Programme Delivery Readiness
                    documentation.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Using our structured forms, institutions complete readiness
                    assessments and upload supporting evidence to the secure
                    evidence vault.
                  </p>
                </CardContent>
              </Card>

              {/* Step 3 */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <Badge variant="default" className="h-8 w-8 items-center justify-center rounded-full p-0 text-sm">
                      3
                    </Badge>
                    <CardTitle className="text-2xl">QCTO Review</CardTitle>
                  </div>
                  <CardDescription className="text-base">
                    QCTO reviewers evaluate submissions and make decisions.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Reviewers access submissions through dedicated dashboards,
                    review documentation, and make approval or revision
                    decisions with full audit trails.
                  </p>
                </CardContent>
              </Card>

              {/* Step 4 */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <Badge variant="default" className="h-8 w-8 items-center justify-center rounded-full p-0 text-sm">
                      4
                    </Badge>
                    <CardTitle className="text-2xl">Ongoing Management</CardTitle>
                  </div>
                  <CardDescription className="text-base">
                    Continuous monitoring and management of learners and
                    compliance status.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Institutions manage learner profiles, track progress, and
                    maintain compliance records while QCTO monitors overall
                    system health and compliance metrics.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="mt-16 text-center">
              <Button asChild size="lg">
                <Link href="/contact">Get Started</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
