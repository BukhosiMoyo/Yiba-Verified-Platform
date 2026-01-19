import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

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

export default function SecurityPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNav />
      <main className="flex-1">
        <section className="bg-background py-20 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
                Security & Compliance
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                Your data security and regulatory compliance are our top
                priorities.
              </p>
            </div>

            <div className="mx-auto mt-16 max-w-5xl space-y-12">
              {/* Security Measures */}
              <div>
                <h2 className="mb-8 text-2xl font-bold">Security Measures</h2>
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Data Encryption</CardTitle>
                      <CardDescription>
                        All data is encrypted in transit and at rest using
                        industry-standard encryption protocols.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Access Controls</CardTitle>
                      <CardDescription>
                        Role-based access control ensures users only access data
                        and features appropriate to their role.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Authentication</CardTitle>
                      <CardDescription>
                        Secure authentication mechanisms protect user accounts
                        and system access.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Audit Logging</CardTitle>
                      <CardDescription>
                        Comprehensive audit trails track all system activities
                        for security and compliance monitoring.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </div>
              </div>

              <Separator />

              {/* Compliance */}
              <div>
                <h2 className="mb-8 text-2xl font-bold">Compliance Standards</h2>
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>QCTO Requirements</CardTitle>
                      <CardDescription>
                        Built specifically to meet QCTO regulatory requirements
                        and standards.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Data Protection</CardTitle>
                      <CardDescription>
                        Compliant with applicable data protection regulations
                        and privacy standards.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Documentation Standards</CardTitle>
                      <CardDescription>
                        Maintains standards for documentation, record-keeping,
                        and evidence management.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Regular Audits</CardTitle>
                      <CardDescription>
                        Regular security audits and compliance reviews ensure
                        ongoing adherence to standards.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </div>
              </div>
            </div>

            <div className="mt-16 text-center">
              <Button asChild size="lg">
                <Link href="/contact">Learn More</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
