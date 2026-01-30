import type { Metadata } from "next";
import Link from "next/link";
import { Shield, Lock, Eye, FileCheck, Server, Users, ClipboardCheck, RefreshCw, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { GradientShell } from "@/components/shared/Backgrounds";

export const metadata: Metadata = {
  title: "Security & Compliance - Yiba Verified",
  description:
    "Learn about Yiba Verified's security measures, compliance standards, and data protection practices for QCTO institutions.",
  openGraph: {
    title: "Security & Compliance - Yiba Verified",
    description:
      "Learn about Yiba Verified's security measures, compliance standards, and data protection practices for QCTO institutions.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Security & Compliance - Yiba Verified",
    description:
      "Learn about Yiba Verified's security measures, compliance standards, and data protection practices for QCTO institutions.",
  },
};

const securityMeasures = [
  {
    icon: Lock,
    title: "Data Encryption",
    description: "All data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption protocols.",
  },
  {
    icon: Users,
    title: "Access Controls",
    description: "Role-based access control ensures users only access data and features appropriate to their role.",
  },
  {
    icon: Shield,
    title: "Secure Authentication",
    description: "Industry-standard authentication with secure password hashing and session management.",
  },
  {
    icon: Eye,
    title: "Audit Logging",
    description: "Comprehensive audit trails track all system activities for security and compliance monitoring.",
  },
];

const complianceStandards = [
  {
    icon: FileCheck,
    title: "QCTO Requirements",
    description: "Built specifically to meet QCTO regulatory requirements and quality assurance standards.",
  },
  {
    icon: Server,
    title: "POPIA Compliant",
    description: "Fully compliant with the Protection of Personal Information Act (POPIA) for data privacy.",
  },
  {
    icon: ClipboardCheck,
    title: "Documentation Standards",
    description: "Maintains rigorous standards for documentation, record-keeping, and evidence management.",
  },
  {
    icon: RefreshCw,
    title: "Regular Audits",
    description: "Continuous security assessments and compliance reviews ensure ongoing adherence to standards.",
  },
];

const trustBadges = [
  { label: "POPIA Compliant", sublabel: "Data Protection" },
  { label: "QCTO Aligned", sublabel: "Quality Assurance" },
  { label: "256-bit Encryption", sublabel: "Data Security" },
  { label: "99.9% Uptime", sublabel: "Reliability" },
  { label: "Role-Based Access", sublabel: "Access Control" },
  { label: "Full Audit Trail", sublabel: "Transparency" },
];

const commitments = [
  "Your data is never sold or shared with third parties",
  "All data is stored in secure, compliant data centers",
  "Regular penetration testing and vulnerability assessments",
  "Dedicated security team monitoring 24/7",
  "Incident response plan with defined SLAs",
  "Employee security training and background checks",
];

export default function SecurityPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNav />
      <main className="flex-1">
        {/* Hero */}
        <GradientShell as="section" className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <Badge variant="secondary" className="mb-6 rounded-full px-4 py-1.5 text-xs font-medium border-border/60">
                Enterprise-grade security
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                Security & Compliance
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                Your data security and regulatory compliance are our top
                priorities. Built for government and enterprise trust.
              </p>
            </div>
          </div>
        </GradientShell>

        {/* Trust Badges */}
        <section className="py-12 border-b border-border/60 bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
              {trustBadges.map((badge) => (
                <div key={badge.label} className="text-center">
                  <div className="flex justify-center mb-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Shield className="h-7 w-7" strokeWidth={1.5} />
                    </div>
                  </div>
                  <p className="font-semibold text-foreground text-sm">{badge.label}</p>
                  <p className="text-xs text-muted-foreground">{badge.sublabel}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Security Measures */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Security Measures
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Multi-layered security architecture designed to protect your sensitive data.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-2">
              {securityMeasures.map((item) => {
                const Icon = item.icon;
                return (
                  <Card key={item.title} className="border-[var(--border-subtle)] bg-card transition-all duration-200 hover:shadow-[var(--shadow-float)] hover:-translate-y-0.5">
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Icon className="h-6 w-6" strokeWidth={1.5} />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{item.title}</CardTitle>
                          <CardDescription className="mt-2 text-base">
                            {item.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Compliance Standards */}
        <section className="py-20 sm:py-28 bg-muted/30 border-y border-border/60">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Compliance Standards
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Meeting and exceeding regulatory requirements for education and government sectors.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-2">
              {complianceStandards.map((item) => {
                const Icon = item.icon;
                return (
                  <Card key={item.title} className="border-[var(--border-subtle)] bg-card transition-all duration-200 hover:shadow-[var(--shadow-float)] hover:-translate-y-0.5">
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-500/10 text-green-600 dark:text-green-400">
                          <Icon className="h-6 w-6" strokeWidth={1.5} />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{item.title}</CardTitle>
                          <CardDescription className="mt-2 text-base">
                            {item.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Our Commitments */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Our Security Commitments
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  We take a proactive approach to security, continuously improving our
                  practices to stay ahead of emerging threats.
                </p>
                <div className="mt-8">
                  <Button asChild size="lg" className="btn-primary-premium rounded-xl px-8">
                    <Link href="/contact">Request Security Details</Link>
                  </Button>
                </div>
              </div>
              <div>
                <Card className="border-[var(--border-subtle)] bg-card">
                  <CardContent className="pt-6">
                    <ul className="space-y-4">
                      {commitments.map((commitment) => (
                        <li key={commitment} className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" strokeWidth={1.5} />
                          <span className="text-foreground">{commitment}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 sm:py-28 bg-muted/30 border-t border-border/60">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Have security questions?
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Our team is happy to discuss our security practices in detail
                and answer any questions you may have.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button asChild size="lg" className="btn-primary-premium rounded-xl px-8 h-12 text-base font-semibold">
                  <Link href="/contact">Contact Us</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-xl px-8 h-12 text-base font-medium border-2">
                  <Link href="/privacy-policy">Privacy Policy</Link>
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
