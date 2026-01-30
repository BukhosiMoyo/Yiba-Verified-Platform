import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { GradientShell } from "@/components/shared/Backgrounds";
import { Shield, Target, Users, Lightbulb } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Yiba Verified, our mission to transform QCTO compliance and oversight in South Africa, and the team behind the platform.",
  openGraph: {
    title: "About Us - Yiba Verified",
    description:
      "Learn about Yiba Verified, our mission to transform QCTO compliance and oversight in South Africa.",
    type: "website",
  },
};

const values = [
  {
    icon: Shield,
    title: "Trust & Integrity",
    description:
      "We build systems that ensure transparency and trust between institutions, regulators, and learners.",
  },
  {
    icon: Target,
    title: "Compliance Excellence",
    description:
      "We simplify complex regulatory requirements, making compliance achievable for every institution.",
  },
  {
    icon: Users,
    title: "Learner-Centered",
    description:
      "Every feature we build ultimately serves the goal of better outcomes for South African learners.",
  },
  {
    icon: Lightbulb,
    title: "Innovation",
    description:
      "We leverage modern technology to solve long-standing challenges in education oversight.",
  },
];

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNav />
      <main className="flex-1">
        {/* Hero Section */}
        <GradientShell>
          <section className="py-20 sm:py-32">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-3xl text-center">
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                  Transforming QCTO Compliance in{" "}
                  <span className="text-primary">South Africa</span>
                </h1>
                <p className="mt-6 text-lg leading-8 text-muted-foreground sm:text-xl">
                  Yiba Verified is on a mission to make quality assurance in education
                  transparent, efficient, and accessible for every institution and learner.
                </p>
              </div>
            </div>
          </section>
        </GradientShell>

        {/* Mission Section */}
        <section className="py-16 sm:py-24 bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl">
              <h2 className="text-2xl font-bold sm:text-3xl mb-6">Our Mission</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  The Quality Council for Trades and Occupations (QCTO) plays a vital role
                  in ensuring that South African educational institutions meet the highest
                  standards. However, the compliance process has traditionally been complex,
                  paper-heavy, and time-consuming for all parties involved.
                </p>
                <p>
                  Yiba Verified was created to change that. We provide a digital platform
                  that streamlines the entire compliance journey—from institutional readiness
                  documentation to QCTO review workflows and learner progress tracking.
                </p>
                <p>
                  Our goal is simple: make compliance easier so institutions can focus on
                  what matters most—educating South Africa&apos;s next generation of skilled
                  professionals.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold sm:text-3xl">Our Values</h2>
              <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
                These principles guide everything we do at Yiba Verified.
              </p>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {values.map((value) => (
                <div
                  key={value.title}
                  className="relative p-6 bg-card border border-border rounded-xl hover:shadow-card transition-shadow duration-200"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                    <value.icon className="h-6 w-6 text-primary" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Who We Serve Section */}
        <section className="py-16 sm:py-24 bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center mb-12">
              <h2 className="text-2xl font-bold sm:text-3xl">Who We Serve</h2>
              <p className="mt-4 text-muted-foreground">
                Yiba Verified brings together all stakeholders in the QCTO compliance ecosystem.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="p-6 bg-card border border-border rounded-xl">
                <h3 className="text-lg font-semibold mb-3">Educational Institutions</h3>
                <p className="text-sm text-muted-foreground">
                  Colleges, training providers, and assessment centres seeking to demonstrate
                  readiness and maintain compliance with QCTO requirements.
                </p>
              </div>
              <div className="p-6 bg-card border border-border rounded-xl">
                <h3 className="text-lg font-semibold mb-3">QCTO Personnel</h3>
                <p className="text-sm text-muted-foreground">
                  Reviewers, auditors, and administrators who oversee institutional compliance
                  and ensure quality standards are met across the sector.
                </p>
              </div>
              <div className="p-6 bg-card border border-border rounded-xl">
                <h3 className="text-lg font-semibold mb-3">Learners</h3>
                <p className="text-sm text-muted-foreground">
                  Students and trainees who benefit from verified, quality-assured education
                  and clear visibility into their learning journey.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold sm:text-3xl mb-4">
                Ready to Transform Your Compliance Process?
              </h2>
              <p className="text-muted-foreground mb-8">
                Join institutions across South Africa who are simplifying their QCTO compliance
                journey with Yiba Verified.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="btn-primary-premium rounded-xl px-8">
                  <Link href="/contact">Request a Demo</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-xl px-8">
                  <Link href="/how-it-works">Learn How It Works</Link>
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
