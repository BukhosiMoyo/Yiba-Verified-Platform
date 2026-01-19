import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://yibaverified.com";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Yiba Verified - QCTO Compliance & Oversight Platform",
    template: "%s | Yiba Verified",
  },
  description: "Streamline QCTO compliance with our comprehensive platform. Manage institutional readiness, track learner progress, and ensure regulatory compliance.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "Yiba Verified",
    title: "Yiba Verified - QCTO Compliance & Oversight Platform",
    description: "Streamline QCTO compliance with our comprehensive platform. Manage institutional readiness, track learner progress, and ensure regulatory compliance.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Yiba Verified - QCTO Compliance & Oversight Platform",
    description: "Streamline QCTO compliance with our comprehensive platform. Manage institutional readiness, track learner progress, and ensure regulatory compliance.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

