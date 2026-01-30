import type { Metadata } from "next";
import { Mail, Clock, MessageSquare } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { ContactForm } from "@/components/marketing/ContactForm";
import { GradientShell } from "@/components/shared/Backgrounds";

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

const contactInfo = [
  {
    icon: Mail,
    title: "Email Us",
    description: "Send us an email anytime",
    value: "hello@yibaverified.co.za",
    href: "mailto:hello@yibaverified.co.za",
  },
  {
    icon: Clock,
    title: "Response Time",
    description: "We typically respond within",
    value: "24 hours",
    href: null,
  },
  {
    icon: MessageSquare,
    title: "Support",
    description: "Existing customers can access",
    value: "Dashboard Support",
    href: null,
  },
];

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNav />
      <main className="flex-1">
        {/* Hero */}
        <GradientShell as="section" className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <Badge variant="secondary" className="mb-6 rounded-full px-4 py-1.5 text-xs font-medium border-border/60">
                We&apos;d love to hear from you
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                Get in Touch
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                Ready to transform your QCTO compliance processes? Contact us
                today to schedule a demo or learn more about Yiba Verified.
              </p>
            </div>
          </div>
        </GradientShell>

        {/* Main Content */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-5">
              {/* Contact Form - Takes 3 columns */}
              <div className="lg:col-span-3">
                <Card className="border-[var(--border-subtle)] bg-card shadow-[var(--shadow-card)]">
                  <CardHeader>
                    <CardTitle className="text-2xl">Send us a message</CardTitle>
                    <CardDescription className="text-base">
                      Fill out the form below and we&apos;ll get back to you as soon as possible.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ContactForm />
                  </CardContent>
                </Card>
              </div>

              {/* Contact Info Sidebar - Takes 2 columns */}
              <div className="lg:col-span-2 space-y-6">
                {contactInfo.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Card key={item.title} className="border-[var(--border-subtle)] bg-card">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Icon className="h-6 w-6" strokeWidth={1.5} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">{item.title}</h3>
                            <p className="text-sm text-muted-foreground mb-1">
                              {item.description}
                            </p>
                            {item.href ? (
                              <a
                                href={item.href}
                                className="text-sm font-medium text-primary hover:underline"
                              >
                                {item.value}
                              </a>
                            ) : (
                              <p className="text-sm font-medium text-foreground">{item.value}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {/* Quick Links */}
                <Card className="border-[var(--border-subtle)] bg-muted/30">
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Links</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <a
                      href="/how-it-works"
                      className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      → How Yiba Verified Works
                    </a>
                    <a
                      href="/features"
                      className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      → Explore Features
                    </a>
                    <a
                      href="/security"
                      className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      → Security & Compliance
                    </a>
                    <a
                      href="/pricing"
                      className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      → Pricing Information
                    </a>
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
