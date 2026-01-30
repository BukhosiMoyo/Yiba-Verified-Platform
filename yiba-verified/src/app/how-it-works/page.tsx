import type { Metadata } from "next";
import Link from "next/link";
import { Building2, FileCheck, Search, BarChart3, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { YourJourneySection } from "@/components/marketing/YourJourneySection";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { GradientShell } from "@/components/shared/Backgrounds";

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

const steps = [
  {
    number: 1,
    icon: Building2,
    title: "Institution Setup",
    subtitle: "Create your account and configure your profile",
    description:
      "Administrators set up institutional information, upload required documentation, and configure access for staff members. Get your team onboarded quickly with our guided setup process.",
    highlights: ["Quick account creation", "Team member invitations", "Document upload"],
  },
  {
    number: 2,
    icon: FileCheck,
    title: "Readiness Documentation",
    subtitle: "Prepare and submit Programme Delivery Readiness documentation",
    description:
      "Using our structured forms, institutions complete readiness assessments and upload supporting evidence to the secure evidence vault. Our guided workflow ensures nothing is missed.",
    highlights: ["Structured forms", "Evidence vault", "Progress tracking"],
  },
  {
    number: 3,
    icon: Search,
    title: "QCTO Review",
    subtitle: "Reviewers evaluate submissions and make decisions",
    description:
      "Reviewers access submissions through dedicated dashboards, review documentation, and make approval or revision decisions with full audit trails. Real-time notifications keep everyone informed.",
    highlights: ["Dedicated dashboards", "Decision workflows", "Audit trails"],
  },
  {
    number: 4,
    icon: BarChart3,
    title: "Ongoing Management",
    subtitle: "Continuous monitoring and compliance maintenance",
    description:
      "Institutions manage learner profiles, track progress, and maintain compliance records while QCTO monitors overall system health and compliance metrics across all institutions.",
    highlights: ["Learner tracking", "Progress monitoring", "Compliance reports"],
  },
];

export default function HowItWorksPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNav />
      <main className="flex-1">
        {/* Hero */}
        <GradientShell as="section" className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <Badge variant="secondary" className="mb-6 rounded-full px-4 py-1.5 text-xs font-medium border-border/60">
                Simple • Structured • Streamlined
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                How It Works
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                A streamlined process designed to simplify QCTO compliance
                management for everyone involved.
              </p>
            </div>
          </div>
        </GradientShell>

        {/* Visual Timeline Steps */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                The Compliance Journey
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                From initial setup to ongoing management, we guide you every step of the way.
              </p>
            </div>

            <div className="relative">
              {/* Timeline line - hidden on mobile, visible on md+ */}
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/20 via-primary to-primary/20 hidden md:block transform -translate-x-1/2" />

              <div className="space-y-12 md:space-y-0">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const isEven = index % 2 === 0;

                  return (
                    <div key={step.number} className="relative md:grid md:grid-cols-2 md:gap-8 md:items-center md:py-12">
                      {/* Timeline dot */}
                      <div className="absolute left-1/2 top-0 md:top-1/2 transform -translate-x-1/2 md:-translate-y-1/2 hidden md:flex">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg shadow-lg z-10">
                          {step.number}
                        </div>
                      </div>

                      {/* Content - alternating sides on desktop */}
                      <div className={`${isEven ? 'md:pr-16 md:text-right' : 'md:col-start-2 md:pl-16'}`}>
                        <Card className="relative border-[var(--border-subtle)] bg-card transition-all duration-200 hover:shadow-[var(--shadow-float)] hover:-translate-y-0.5">
                          <CardHeader>
                            <div className={`flex items-center gap-4 ${isEven ? 'md:flex-row-reverse' : ''}`}>
                              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                                <Icon className="h-6 w-6" strokeWidth={1.5} />
                              </div>
                              <div className={isEven ? 'md:text-right' : ''}>
                                <Badge variant="outline" className="mb-2 md:hidden">Step {step.number}</Badge>
                                <CardTitle className="text-xl">{step.title}</CardTitle>
                                <CardDescription className="text-base mt-1">
                                  {step.subtitle}
                                </CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className={`text-muted-foreground mb-4 ${isEven ? 'md:text-right' : ''}`}>
                              {step.description}
                            </p>
                            <div className={`flex flex-wrap gap-2 ${isEven ? 'md:justify-end' : ''}`}>
                              {step.highlights.map((highlight) => (
                                <span
                                  key={highlight}
                                  className="inline-flex items-center gap-1.5 rounded-full bg-primary/5 px-3 py-1 text-xs font-medium text-primary"
                                >
                                  <CheckCircle2 className="h-3 w-3" /> {highlight}
                                </span>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Empty column for alternating layout */}
                      {isEven ? <div className="hidden md:block" /> : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* User-Specific Flows */}
        <section className="py-20 sm:py-28 bg-muted/30 border-y border-border/60">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <YourJourneySection />
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Ready to simplify your compliance?
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Get started today and experience the difference Yiba Verified makes.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button asChild size="lg" className="btn-primary-premium rounded-xl px-8 h-12 text-base font-semibold">
                  <Link href="/contact">Request a Demo</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-xl px-8 h-12 text-base font-medium border-2">
                  <Link href="/features">Explore Features</Link>
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
