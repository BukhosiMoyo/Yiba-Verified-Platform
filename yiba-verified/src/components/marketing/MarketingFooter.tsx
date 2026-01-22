import Link from "next/link";

export function MarketingFooter() {
  return (
    <footer className="border-t border-border/60 bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block">
              <img src="/Yiba%20Verified%20Logo.webp" alt="Yiba Verified" className="h-8 w-auto max-w-[140px] object-contain object-left opacity-90" />
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
                <a href="mailto:info@yibaverified.com" className="transition-colors hover:text-foreground">
                  info@yibaverified.com
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">Legal</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="transition-colors hover:text-foreground">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition-colors hover:text-foreground">
                  Contact
                </Link>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-foreground">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-foreground">
                  Terms of Service
                </a>
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
