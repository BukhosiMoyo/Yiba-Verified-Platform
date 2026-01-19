import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export const metadata: Metadata = {
  title: "Yiba Verified - QCTO Compliance & Oversight Platform",
  description:
    "Streamline QCTO compliance with our comprehensive platform. Manage institutional readiness, track learner progress, and ensure regulatory compliance.",
  openGraph: {
    title: "Yiba Verified - QCTO Compliance & Oversight Platform",
    description:
      "Streamline QCTO compliance with our comprehensive platform. Manage institutional readiness, track learner progress, and ensure regulatory compliance.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Yiba Verified - QCTO Compliance & Oversight Platform",
    description:
      "Streamline QCTO compliance with our comprehensive platform. Manage institutional readiness, track learner progress, and ensure regulatory compliance.",
  },
};

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNav />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-background py-20 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <Badge variant="secondary" className="mb-4">
                QCTO Compliance Platform
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
                Streamline Compliance, Ensure Quality
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                Yiba Verified empowers institutions to manage QCTO compliance
                requirements with confidence. Track readiness, manage learners,
                and maintain regulatory standards all in one platform.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Button asChild size="lg">
                  <Link href="/contact">Request Demo</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/how-it-works">Learn More</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Preview */}
        <section className="py-20 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Everything you need for compliance
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Comprehensive tools designed for QCTO institutions, reviewers,
                and learners.
              </p>
            </div>
            <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Institutional Management</CardTitle>
                  <CardDescription>
                    Complete oversight of institutional readiness, documentation,
                    and compliance status.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="link" className="p-0">
                    <Link href="/features">Learn more →</Link>
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>QCTO Review & Approval</CardTitle>
                  <CardDescription>
                    Streamlined review workflows for QCTO staff to evaluate and
                    approve institutional submissions.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="link" className="p-0">
                    <Link href="/features">Learn more →</Link>
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Learner Progress Tracking</CardTitle>
                  <CardDescription>
                    Monitor learner progress, manage profiles, and maintain
                    comprehensive records for compliance.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="link" className="p-0">
                    <Link href="/features">Learn more →</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-muted py-20 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Ready to get started?
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Contact us today to schedule a demo and see how Yiba Verified
                can transform your compliance processes.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Button asChild size="lg">
                  <Link href="/contact">Get in Touch</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/login">Sign In</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
