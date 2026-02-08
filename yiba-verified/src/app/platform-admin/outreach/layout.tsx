import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Sparkles } from 'lucide-react';
import { OutreachNav } from './_components/OutreachNav';

interface OutreachLayoutProps {
    children: ReactNode;
}

export default async function OutreachLayout({ children }: OutreachLayoutProps) {
    // Feature flag check (Default to true for rollout)
    const featureEnabled = process.env.NEXT_PUBLIC_FEATURE_AWARENESS_ENGINE_UI === 'true' || true;
    if (!featureEnabled) {
        redirect('/platform-admin');
    }

    // RBAC check - PLATFORM_ADMIN only
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'PLATFORM_ADMIN') {
        redirect('/unauthorized');
    }

    return (
        <div className="space-y-6 p-6 max-w-[1600px] mx-auto">
            {/* Header: Refined, subtle, context-focused */}
            <div className="flex flex-col gap-6">
                <div className="relative overflow-hidden rounded-xl border border-border/40 bg-background/50 backdrop-blur-sm p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-primary/10 ring-1 ring-primary/20">
                            <Sparkles className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                                Outreach Engine
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                AI-driven engagement tracking and personalization system
                            </p>
                        </div>
                    </div>
                </div>

                {/* Navigation: Client component for active states */}
                <OutreachNav />
            </div>

            {/* Main Content */}
            <main className="animate-in fade-in slide-in-from-bottom-2 duration-500 min-h-[calc(100vh-280px)]">
                {children}
            </main>

            {/* Footer Status Bar */}
            <footer className="border-t border-border/40 pt-4 mt-8 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span>System Online</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span>Database Connected</span>
                    </div>
                </div>
                <div className="flex items-center gap-4 opacity-70">
                    <span>Background Jobs: Idle</span>
                    <span>v2.4.0</span>
                </div>
            </footer>
        </div>
    );
}
