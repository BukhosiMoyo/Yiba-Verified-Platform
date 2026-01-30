import type { Metadata } from "next";
import Link from "next/link";
import { Check, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { GradientShell } from "@/components/shared/Backgrounds";

export const metadata: Metadata = {
  title: "Pricing - Yiba Verified",
  description:
    "Request a demo to learn about Yiba Verified pricing and find the right plan for your institution's QCTO compliance needs.",
  openGraph: {
    title: "Pricing - Yiba Verified",
    description:
      "Request a demo to learn about Yiba Verified pricing and find the right plan for your institution's QCTO compliance needs.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing - Yiba Verified",
    description:
      "Request a demo to learn about Yiba Verified pricing and find the right plan for your institution's QCTO compliance needs.",
  },
};

const platformFeatures = [
  "Full platform access for all team members",
  "Unlimited readiness documentation submissions",
  "Learner management and progress tracking",
  "Secure evidence vault with document storage",
  "Complete audit trails and compliance reporting",
];

const supportFeatures = [
  "Dedicated account manager",
  "Priority email and phone support",
  "Personalized onboarding and training",
  "Quarterly business reviews",
  "Custom integration support",
];

const faqs = [
  {
    question: "How is pricing determined?",
    answer:
      "Pricing is based on several factors including the size of your institution, number of learners, and specific feature requirements. We work with each institution to create a pricing plan that fits their budget and needs.",
  },
  {
    question: "Is there a minimum contract period?",
    answer:
      "We typically work with annual contracts to ensure proper onboarding and support. However, we're flexible and can discuss shorter terms for pilot programs or specific use cases.",
  },
  {
    question: "What's included in the onboarding process?",
    answer:
      "Our onboarding includes platform setup, data migration assistance, user training sessions for your team, and documentation of your specific workflows. We ensure your team is fully prepared before going live.",
  },
  {
    question: "Are there any additional costs?",
    answer:
      "Your subscription includes all core platform features, support, and regular updates. Custom integrations, additional training sessions, or specialized development may incur additional costs, which we discuss upfront.",
  },
  {
    question: "Do you offer discounts for multiple institutions?",
    answer:
      "Yes, we offer volume discounts for organizations managing multiple institutions or training centers. Contact us to discuss group pricing options.",
  },
  {
    question: "What happens to our data if we cancel?",
    answer:
      "Upon cancellation, we provide a complete data export in standard formats. Your data remains accessible for 30 days after contract end, after which it's securely deleted per our data retention policy.",
  },
  {
    question: "Is there a free trial available?",
    answer:
      "We offer personalized demos where you can see the platform in action with your specific use cases. For qualified institutions, we can arrange a limited pilot program to evaluate the platform.",
  },
  {
    question: "How do updates and new features work?",
    answer:
      "All platform updates, security patches, and new features are included in your subscription at no additional cost. We release updates regularly and notify users of significant new features.",
  },
];

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingNav />
      <main className="flex-1">
        {/* Hero & Pricing Card */}
        <GradientShell as="section" className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <Badge variant="secondary" className="mb-6 rounded-full px-4 py-1.5 text-xs font-medium border-border/60">
                Tailored for your institution
              </Badge>
              <h1 className="text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl md:text-6xl">
                Simple, Transparent Pricing
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                Custom pricing plans designed to meet the needs of institutions of all sizes.
                No hidden fees. No surprises.
              </p>
            </div>

            <div className="mx-auto mt-16 max-w-4xl">
              <Card className="border-[var(--border-subtle)] bg-card shadow-[var(--shadow-card)] transition-all duration-200 hover:shadow-[var(--shadow-float)] hover:border-primary/20 overflow-hidden">
                <div className="grid md:grid-cols-2">
                  {/* Platform Features */}
                  <div className="p-8 border-b md:border-b-0 md:border-r border-border">
                    <h3 className="text-lg font-semibold text-foreground mb-6">Platform Features</h3>
                    <div className="space-y-4">
                      {platformFeatures.map((item) => (
                        <div key={item} className="flex items-start gap-3">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary mt-0.5">
                            <Check className="h-3 w-3" strokeWidth={2} />
                          </span>
                          <span className="text-sm text-foreground">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Support Features */}
                  <div className="p-8">
                    <h3 className="text-lg font-semibold text-foreground mb-6">Support & Services</h3>
                    <div className="space-y-4">
                      {supportFeatures.map((item) => (
                        <div key={item} className="flex items-start gap-3">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500/10 text-green-600 dark:text-green-400 mt-0.5">
                            <Check className="h-3 w-3" strokeWidth={2} />
                          </span>
                          <span className="text-sm text-foreground">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* CTA Section */}
                <div className="bg-muted/30 p-8 border-t border-border">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div>
                      <p className="text-2xl font-bold text-foreground">Custom Pricing</p>
                      <p className="text-muted-foreground">Tailored to your institution&apos;s needs</p>
                    </div>
                    <Button asChild size="lg" className="btn-primary-premium rounded-xl px-8 h-12 w-full sm:w-auto">
                      <Link href="/contact">Request a Demo</Link>
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </GradientShell>

        {/* FAQ Section */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <div className="flex justify-center mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <HelpCircle className="h-6 w-6" strokeWidth={1.5} />
                </div>
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Frequently Asked Questions
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Everything you need to know about pricing and plans.
              </p>
            </div>

            <div className="mx-auto max-w-3xl">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`} className="border-border">
                    <AccordionTrigger className="text-left font-medium hover:no-underline py-5">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-5">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            <div className="mt-12 text-center">
              <p className="text-muted-foreground">
                Still have questions?{" "}
                <Link href="/contact" className="font-medium text-primary hover:underline">
                  Contact our team
                </Link>{" "}
                and we&apos;ll be happy to help.
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 bg-muted/30 border-t border-border/60">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Ready to get started?
              </h2>
              <p className="mt-4 text-muted-foreground">
                Schedule a personalized demo and see how Yiba Verified can transform your compliance processes.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button asChild size="lg" className="btn-primary-premium rounded-xl px-8 h-12 text-base font-semibold">
                  <Link href="/contact">Request Demo</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-xl px-8 h-12 text-base font-medium border-2">
                  <Link href="/features">View Features</Link>
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
