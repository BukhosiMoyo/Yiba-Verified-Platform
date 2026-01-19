import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export const metadata: Metadata = {
  title: "Contact Us - Yiba Verified",
  description:
    "Get in touch with the Yiba Verified team. Request a demo, ask questions, or learn more about our QCTO compliance platform.",
  openGraph: {
    title: "Contact Us - Yiba Verified",
    description:
      "Get in touch with the Yiba Verified team. Request a demo, ask questions, or learn more about our QCTO compliance platform.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Us - Yiba Verified",
    description:
      "Get in touch with the Yiba Verified team. Request a demo, ask questions, or learn more about our QCTO compliance platform.",
  },
};

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNav />
      <main className="flex-1">
        <section className="bg-background py-20 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
                Get in Touch
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                Ready to transform your QCTO compliance processes? Contact us
                today to schedule a demo or learn more about Yiba Verified.
              </p>
            </div>

            <div className="mx-auto mt-16 max-w-4xl">
              <div className="grid gap-8 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Request a Demo</CardTitle>
                    <CardDescription>
                      Schedule a personalized demonstration of Yiba Verified
                      tailored to your institution's needs.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 text-sm text-muted-foreground">
                      Our team will show you how Yiba Verified can streamline
                      your compliance workflows and help you meet QCTO
                      requirements more efficiently.
                    </p>
                    <Button asChild className="w-full">
                      <a href="mailto:info@yibaverified.com?subject=Demo Request">
                        Schedule Demo
                      </a>
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>General Inquiries</CardTitle>
                    <CardDescription>
                      Have questions or need more information? We're here to
                      help.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 text-sm text-muted-foreground">
                      Reach out with any questions about features, pricing,
                      implementation, or support.
                    </p>
                    <Button asChild variant="outline" className="w-full">
                      <a href="mailto:info@yibaverified.com">Send Email</a>
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-12">
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium">Email</p>
                        <a
                          href="mailto:info@yibaverified.com"
                          className="text-sm text-muted-foreground hover:text-foreground"
                        >
                          info@yibaverified.com
                        </a>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Support</p>
                        <p className="text-sm text-muted-foreground">
                          For technical support, please contact your account
                          manager or use the support channels available in your
                          dashboard.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
