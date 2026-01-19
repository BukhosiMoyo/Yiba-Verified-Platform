import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

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

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNav />
      <main className="flex-1">
        <section className="bg-background py-20 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
                Pricing
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                Flexible pricing plans designed to meet the needs of
                institutions of all sizes.
              </p>
            </div>

            <div className="mx-auto mt-16 max-w-4xl">
              <Card className="border-2">
                <CardHeader className="text-center">
                  <Badge variant="secondary" className="mx-auto mb-4">
                    Request Demo
                  </Badge>
                  <CardTitle className="text-3xl">Custom Pricing</CardTitle>
                  <CardDescription className="text-base">
                    Contact us to discuss pricing tailored to your institution's
                    needs and requirements.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span className="text-sm">Full platform access</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span className="text-sm">Dedicated support</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span className="text-sm">Training and onboarding</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span className="text-sm">Ongoing maintenance and updates</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span className="text-sm">SLA guarantees</span>
                    </div>
                  </div>
                  <div className="pt-4">
                    <Button asChild size="lg" className="w-full">
                      <Link href="/contact">Request Demo</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="mt-12 text-center">
                <p className="text-muted-foreground">
                  Have questions about pricing?{" "}
                  <Link href="/contact" className="font-medium text-foreground underline">
                    Contact our team
                  </Link>{" "}
                  to discuss your specific needs.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
