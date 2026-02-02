import type { Metadata } from "next";
// unused imports removed
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { LandingPageContent } from "./_components/LandingPageContent";

export const metadata: Metadata = {
  title: "Yiba Verified - QCTO Compliance & Oversight Platform",
  description:
    "Streamline QCTO compliance with our comprehensive platform. Manage institutional readiness, track learner progress, and ensure regulatory compliance.",
  openGraph: {
    title: "Yiba Verified - QCTO Compliance & Oversight Platform",
    description:
      "Streamline QCTO compliance with our comprehensive platform. Manage institutional readiness, track learner progress, and ensure regulatory compliance.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Yiba Verified - QCTO Compliance & Oversight Platform",
    description:
      "Streamline QCTO compliance with our comprehensive platform. Manage institutional readiness, track learner progress, and ensure regulatory compliance.",
  },
};





export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingNav />
      <main className="flex-1">
        <LandingPageContent />
      </main>
      <MarketingFooter />
    </div>
  );
}
