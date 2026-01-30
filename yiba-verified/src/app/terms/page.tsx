import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms and conditions for using the Yiba Verified platform. Understand your rights and responsibilities.",
  openGraph: {
    title: "Terms of Service - Yiba Verified",
    description:
      "Terms and conditions for using the Yiba Verified platform.",
    type: "website",
  },
};

export default function TermsOfServicePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNav />
      <main className="flex-1">
        <section className="bg-background py-16 sm:py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Terms of Service
              </h1>
              <p className="mt-4 text-muted-foreground">
                Last updated: January 2026
              </p>
            </div>

            <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
              <section>
                <h2 className="text-xl font-semibold mb-4">1. Acceptance of Terms</h2>
                <p className="text-muted-foreground leading-relaxed">
                  By accessing or using Yiba Verified (&quot;the Platform&quot;), you agree to be
                  bound by these Terms of Service. If you do not agree to these terms, you
                  may not use the Platform. These terms apply to all users, including
                  institutions, QCTO personnel, and learners.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">2. Description of Service</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Yiba Verified is a QCTO compliance and oversight platform that enables:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-4">
                  <li>Institutional readiness documentation and management</li>
                  <li>QCTO review and approval workflows</li>
                  <li>Learner progress tracking and verification</li>
                  <li>Compliance monitoring and reporting</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">3. User Accounts</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  To use the Platform, you must:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Register for an account with accurate and complete information</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Promptly notify us of any unauthorized access</li>
                  <li>Be at least 18 years old or have parental/guardian consent</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  You are responsible for all activities that occur under your account.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">4. Acceptable Use</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  You agree not to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Submit false, misleading, or fraudulent information</li>
                  <li>Attempt to gain unauthorized access to the Platform</li>
                  <li>Interfere with the security or integrity of the Platform</li>
                  <li>Use the Platform for any unlawful purpose</li>
                  <li>Share your account credentials with others</li>
                  <li>Attempt to reverse engineer or copy the Platform</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">5. Institutional Responsibilities</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Institutions using the Platform agree to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-4">
                  <li>Provide accurate and current information for all submissions</li>
                  <li>Maintain proper authorization for staff and learner data</li>
                  <li>Comply with all applicable QCTO regulations and requirements</li>
                  <li>Respond promptly to review requests and feedback</li>
                  <li>Ensure all uploaded documents are authentic and unaltered</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">6. Intellectual Property</h2>
                <p className="text-muted-foreground leading-relaxed">
                  The Platform, including its design, features, and content, is owned by
                  Yiba Verified and protected by intellectual property laws. You may not
                  copy, modify, distribute, or create derivative works without our written
                  permission.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  You retain ownership of content you submit to the Platform, but grant us
                  a license to use it for providing and improving our services.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">7. Data and Privacy</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Your use of the Platform is subject to our{" "}
                  <Link href="/privacy-policy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                  , which describes how we collect, use, and protect your information.
                  By using the Platform, you consent to our data practices as described
                  in the Privacy Policy.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">8. Service Availability</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We strive to maintain high availability of the Platform but do not
                  guarantee uninterrupted access. We may temporarily suspend the Platform
                  for maintenance, updates, or emergency repairs. We will provide advance
                  notice when possible.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">9. Limitation of Liability</h2>
                <p className="text-muted-foreground leading-relaxed">
                  To the maximum extent permitted by law, Yiba Verified shall not be liable
                  for any indirect, incidental, special, consequential, or punitive damages
                  arising from your use of the Platform. Our total liability shall not
                  exceed the fees paid by you in the twelve months preceding the claim.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">10. Indemnification</h2>
                <p className="text-muted-foreground leading-relaxed">
                  You agree to indemnify and hold harmless Yiba Verified from any claims,
                  damages, or expenses arising from your use of the Platform, violation
                  of these terms, or infringement of any third-party rights.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">11. Termination</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may suspend or terminate your access to the Platform at any time for
                  violation of these terms or for any other reason at our discretion. Upon
                  termination, your right to use the Platform ceases immediately. Provisions
                  that by their nature should survive termination will remain in effect.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">12. Changes to Terms</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may modify these Terms of Service at any time. We will notify you of
                  material changes by posting the updated terms on this page. Your continued
                  use of the Platform after changes constitutes acceptance of the new terms.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">13. Governing Law</h2>
                <p className="text-muted-foreground leading-relaxed">
                  These terms are governed by the laws of the Republic of South Africa.
                  Any disputes shall be resolved in the courts of South Africa.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">14. Contact</h2>
                <p className="text-muted-foreground leading-relaxed">
                  For questions about these Terms of Service, please contact us:
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
                    <strong>Subject:</strong> Terms Inquiry
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
