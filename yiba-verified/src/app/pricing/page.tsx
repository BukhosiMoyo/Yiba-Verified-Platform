import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

const bullets = [
  "Full platform access",
  "Dedicated support",
  "Training and onboarding",
  "Ongoing maintenance and updates",
  "SLA guarantees",
];

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingNav />
      <main className="flex-1">
        <GradientShell as="section" className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="text-[2.25rem] font-bold leading-tight tracking-tight text-foreground sm:text-4xl md:text-5xl">
                Pricing
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                Flexible pricing plans designed to meet the needs of institutions of all sizes.
              </p>
            </div>

            <div className="mx-auto mt-16 max-w-4xl">
              <Card className="border-[var(--border-subtle)] bg-card shadow-[var(--shadow-card)] transition-all duration-200 hover:shadow-[var(--shadow-float)] hover:border-primary/20">
                <CardHeader className="text-center">
                  <Badge variant="secondary" className="mx-auto mb-4 rounded-full border-border/60">
                    Request Demo
                  </Badge>
                  <CardTitle className="text-3xl text-foreground">Custom Pricing</CardTitle>
                  <CardDescription className="text-base">
                    Contact us to discuss pricing tailored to your institution's needs and requirements.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    {bullets.map((item) => (
                      <div key={item} className="flex items-center gap-3">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Check className="h-3 w-3" strokeWidth={1.5} />
                        </span>
                        <span className="text-sm text-foreground">{item}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-4">
                    <Button asChild size="lg" className="w-full btn-primary-premium rounded-xl">
                      <Link href="/contact">Request Demo</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="mt-12 text-center">
                <p className="text-muted-foreground">
                  Have questions about pricing?{" "}
                  <Link href="/contact" className="font-medium text-primary hover:underline">
                    Contact our team
                  </Link>{" "}
                  to discuss your specific needs.
                </p>
              </div>
            </div>
          </div>
        </GradientShell>
      </main>
      <MarketingFooter />
    </div>
  );
}
