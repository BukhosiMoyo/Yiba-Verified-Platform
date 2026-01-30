import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Learn how Yiba Verified collects, uses, and protects your personal information. Our commitment to data privacy and POPIA compliance.",
  openGraph: {
    title: "Privacy Policy - Yiba Verified",
    description:
      "Learn how Yiba Verified collects, uses, and protects your personal information.",
    type: "website",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNav />
      <main className="flex-1">
        <section className="bg-background py-16 sm:py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Privacy Policy
              </h1>
              <p className="mt-4 text-muted-foreground">
                Last updated: January 2026
              </p>
            </div>

            <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
              <section>
                <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Yiba Verified (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting
                  your privacy and ensuring the security of your personal information. This
                  Privacy Policy explains how we collect, use, disclose, and safeguard your
                  information when you use our QCTO compliance and oversight platform.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  We comply with the Protection of Personal Information Act (POPIA) and other
                  applicable South African data protection laws.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">2. Information We Collect</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We collect information that you provide directly to us, including:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Account information (name, email address, organization details)</li>
                  <li>Professional credentials and qualifications</li>
                  <li>Learner information and academic records (as submitted by institutions)</li>
                  <li>Readiness documentation and compliance materials</li>
                  <li>Communication records and support inquiries</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">3. How We Use Your Information</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We use the information we collect to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Provide, maintain, and improve our platform services</li>
                  <li>Process and manage compliance documentation</li>
                  <li>Facilitate communication between institutions and QCTO</li>
                  <li>Send important notifications and updates</li>
                  <li>Ensure platform security and prevent fraud</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">4. Data Sharing and Disclosure</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We do not sell your personal information. We may share your information
                  with:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-4">
                  <li>QCTO and relevant regulatory bodies (as required for compliance)</li>
                  <li>Your affiliated institution (for learners and staff)</li>
                  <li>Service providers who assist in platform operations</li>
                  <li>Legal authorities when required by law</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">5. Data Security</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We implement industry-standard security measures to protect your information,
                  including encryption in transit and at rest, access controls, and regular
                  security audits. However, no method of transmission over the Internet is
                  100% secure, and we cannot guarantee absolute security.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">6. Data Retention</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We retain your personal information for as long as necessary to provide
                  our services and comply with legal obligations. Compliance documentation
                  may be retained for extended periods as required by QCTO regulations.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">7. Your Rights</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Under POPIA, you have the right to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Access your personal information</li>
                  <li>Request correction of inaccurate information</li>
                  <li>Request deletion of your information (subject to legal requirements)</li>
                  <li>Object to processing of your information</li>
                  <li>Lodge a complaint with the Information Regulator</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">8. Cookies and Tracking</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We use essential cookies to maintain your session and preferences.
                  We may also use analytics cookies to understand how our platform is used.
                  You can control cookie preferences through your browser settings.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">9. Changes to This Policy</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may update this Privacy Policy from time to time. We will notify you
                  of any material changes by posting the new policy on this page and updating
                  the &quot;Last updated&quot; date.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">10. Contact Us</h2>
                <p className="text-muted-foreground leading-relaxed">
                  If you have questions about this Privacy Policy or wish to exercise your
                  rights, please contact us at:
                </p>
                <div className="mt-4 p-4 bg-muted/40 rounded-lg">
                  <p className="text-sm">
                    <strong>Email:</strong>{" "}
                    <a
                      href="mailto:hello@yibaverified.co.za"
                      className="text-primary hover:underline"
                    >
                      hello@yibaverified.co.za
                    </a>
                  </p>
                  <p className="text-sm mt-2">
                    <strong>Subject:</strong> Privacy Inquiry
                  </p>
                </div>
              </section>
            </div>

            <div className="mt-12 pt-8 border-t border-border">
              <Link
                href="/"
                className="text-sm text-primary hover:underline"
              >
                &larr; Back to Home
              </Link>
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
