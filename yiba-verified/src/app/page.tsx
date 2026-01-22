import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Shield, FileCheck, Users, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { GradientShell, DotGrid, Glow } from "@/components/shared/Backgrounds";

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

const HERO_UNDERLINE = (
  <span className="relative inline-block">
    <span className="relative z-10">ensure quality</span>
    <span className="absolute left-0 right-0 bottom-1 h-[0.2em] bg-gradient-to-r from-primary/60 to-primary/80 rounded-full" aria-hidden />
  </span>
);

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingNav />
      <main className="flex-1">
        {/* Hero */}
        <GradientShell as="section" className="py-20 sm:py-24 md:py-32">
          <Glow position="top-right" />
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
            <div className="mx-auto max-w-3xl text-center">
              <Badge variant="secondary" className="mb-6 rounded-full px-4 py-1.5 text-xs font-medium border-border/60">
                QCTO-ready • Verified compliance
              </Badge>
              <h1 className="text-[2.5rem] font-bold leading-[1.15] tracking-tight text-foreground sm:text-4xl md:text-5xl lg:text-[3.25rem]">
                Streamline compliance, {HERO_UNDERLINE}
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto">
                Yiba Verified empowers institutions to manage QCTO compliance
                requirements with confidence. Track readiness, manage learners,
                and maintain regulatory standards all in one platform.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button asChild size="lg" className="btn-primary-premium rounded-xl px-8 h-12 text-base font-semibold">
                  <Link href="/contact">Request Demo</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-xl px-8 h-12 text-base font-medium border-2 border-border hover:bg-muted/60 hover:border-foreground/20 transition-colors duration-200">
                  <Link href="/how-it-works">Learn More</Link>
                </Button>
              </div>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary"><FileCheck className="h-4 w-4" strokeWidth={1.5} /></span>
                  QCTO-aligned
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary"><Shield className="h-4 w-4" strokeWidth={1.5} /></span>
                  Secure & compliant
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary"><Users className="h-4 w-4" strokeWidth={1.5} /></span>
                  Built for institutions
                </span>
              </div>
            </div>
          </div>
        </GradientShell>

        {/* Proof / metrics strip */}
        <section className="py-8 border-y border-border/60 bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-center gap-12 text-center">
              <div>
                <p className="text-2xl font-semibold text-foreground">QCTO</p>
                <p className="text-sm text-muted-foreground">Aligned</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">SAQA</p>
                <p className="text-sm text-muted-foreground">Compliant</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">Secure</p>
                <p className="text-sm text-muted-foreground">By design</p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature grid */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Everything you need for compliance
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Comprehensive tools designed for QCTO institutions, reviewers, and learners.
              </p>
            </div>
            <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
              {[
                { title: "Institutional Management", desc: "Complete oversight of institutional readiness, documentation, and compliance status.", icon: FileCheck },
                { title: "QCTO Review & Approval", desc: "Streamlined review workflows for QCTO staff to evaluate and approve institutional submissions.", icon: Shield },
                { title: "Learner Progress Tracking", desc: "Monitor learner progress, manage profiles, and maintain comprehensive records for compliance.", icon: Users },
              ].map(({ title, desc, icon: Icon }) => (
                <Card key={title} className="group relative border-[var(--border-subtle)] bg-card transition-all duration-200 hover:shadow-[var(--shadow-float)] hover:-translate-y-0.5 hover:border-primary/25 dark:hover:border-primary/30">
                  <CardHeader>
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                      <Icon className="h-5 w-5" strokeWidth={1.5} />
                    </div>
                    <CardTitle className="text-foreground">{title}</CardTitle>
                    <CardDescription>{desc}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild variant="link" className="p-0 text-primary font-medium group-hover:underline">
                      <Link href="/features" className="inline-flex items-center">Learn more <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={1.5} aria-hidden /></Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Security / trust */}
        <section className="py-20 sm:py-28 border-t border-border/60 bg-muted/20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Security & trust first
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Role-based access, audit trails, and compliance‑ready data handling.
              </p>
            </div>
            <div className="mx-auto mt-12 flex flex-wrap justify-center gap-6">
              {["Role-based access control", "Full audit trails", "Secure document storage", "QCTO-ready workflows"].map((item) => (
                <span key={item} className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card px-4 py-2 text-sm text-foreground shadow-[var(--shadow-soft)]">
                  <Check className="h-4 w-4 text-primary" strokeWidth={1.5} /> {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative overflow-hidden py-20 sm:py-28 bg-muted/40 border-t border-border/60">
          <DotGrid className="opacity-[var(--pattern-opacity)]" />
          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Ready to get started?
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Contact us today to schedule a demo and see how Yiba Verified can transform your compliance processes.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button asChild size="lg" className="btn-primary-premium rounded-xl px-8 h-12 text-base font-semibold">
                  <Link href="/contact">Get in Touch</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-xl px-8 h-12 text-base font-medium border-2 border-border hover:bg-muted/60 hover:border-foreground/20 transition-colors duration-200">
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
