import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://yibaverified.co.za";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  icons: {
    icon: "/Yiba%20Verified%20Icon.webp",
  },
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
    <html lang="en" suppressHydrationWarning>
      <body className={`${plusJakarta.variable} ${plusJakarta.className}`} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

