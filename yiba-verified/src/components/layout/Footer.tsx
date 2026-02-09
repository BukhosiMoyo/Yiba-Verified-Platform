import Link from "next/link";
import { cn } from "@/lib/utils";
import { CheckCircle, Activity, ShieldCheck } from "lucide-react";

type FooterProps = {
    sidebarWidth?: number;
};

export function Footer({ sidebarWidth }: FooterProps) {
    // Current year
    const year = new Date().getFullYear();
    // Simulated version (should eventually come from package.json or env)
    const version = "v1.2.0";

    return (
        <footer
            className={cn(
                "absolute bottom-0 left-0 right-0 h-10 z-10 flex items-center justify-between px-6 border-t border-border/60 bg-card/90 backdrop-blur-md text-xs text-muted-foreground transition-all duration-300",
                typeof sidebarWidth === "number" && "lg:pl-[var(--sidebar-width)]"
            )}
            style={
                typeof sidebarWidth === "number"
                    ? ({ "--sidebar-width": `${sidebarWidth}px` } as React.CSSProperties)
                    : undefined
            }
        >
            <div className="flex items-center gap-4">
                <span>© {year} Yiba Verified. All rights reserved.</span>
                <div className="hidden sm:flex items-center gap-3 ml-4 border-l border-border/60 pl-4">
                    <Link href="#" className="hover:text-foreground transition-colors">
                        Privacy Policy
                    </Link>
                    <Link href="#" className="hover:text-foreground transition-colors">
                        Terms of Service
                    </Link>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {/* System Status Indicator */}
                <div className="flex items-center gap-1.5" title="System Operational">
                    <div className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </div>
                    <span className="font-medium text-emerald-600 dark:text-emerald-500 hidden sm:inline-block">
                        System Operational
                    </span>
                </div>

                <div className="h-3 w-[1px] bg-border/60 mx-1 hidden sm:block"></div>

                <div className="flex items-center gap-1.5" title={`Version ${version}`}>
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span className="font-mono">{version}</span>
                </div>
            </div>
        </footer>
    );
}
