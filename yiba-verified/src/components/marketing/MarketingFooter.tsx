import Link from "next/link";
import Image from "next/image";

export function MarketingFooter() {
  return (
    <footer className="border-t border-border/60 bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block">
              <Image src="/Yiba%20Verified%20Logo.webp" alt="Yiba Verified" width={140} height={32} className="h-8 w-auto max-w-[140px] object-contain object-left opacity-90 dark:hidden" sizes="140px" />
              <Image src="/YIBA%20VERIFIED%20DARK%20MODE%20LOGO.webp" alt="Yiba Verified" width={140} height={32} className="h-8 w-auto max-w-[140px] object-contain object-left opacity-90 hidden dark:block" sizes="140px" priority loading="eager" />
            </Link>
            <p className="mt-3 text-sm text-muted-foreground max-w-[220px]">
              QCTO compliance and oversight, simplified.
            </p>
            <p className="mt-4 text-xs text-muted-foreground/80">Built for South Africa</p>
          </div>

          {/* Compliance */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">Compliance</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li>
                <Link href="/institutions" className="transition-colors hover:text-foreground">
                  Find institutions
                </Link>
              </li>
              <li>
                <Link href="/features" className="transition-colors hover:text-foreground">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="transition-colors hover:text-foreground">
                  How it works
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="transition-colors hover:text-foreground">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Security */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">Security</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li>
                <Link href="/security" className="transition-colors hover:text-foreground">
                  Security & Compliance
                </Link>
              </li>
              <li>
                <a href="mailto:hello@yibaverified.co.za" className="transition-colors hover:text-foreground">
                  hello@yibaverified.co.za
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">Legal</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li>
                <Link href="/about" className="transition-colors hover:text-foreground">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition-colors hover:text-foreground">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="transition-colors hover:text-foreground">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="transition-colors hover:text-foreground">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border/50 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Yiba Verified. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
