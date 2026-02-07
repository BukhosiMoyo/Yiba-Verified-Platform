import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';

interface OutreachLayoutProps {
    children: ReactNode;
}

export default async function OutreachLayout({ children }: OutreachLayoutProps) {
    // Feature flag check
    const featureEnabled = process.env.NEXT_PUBLIC_FEATURE_AWARENESS_ENGINE_UI === 'true';
    if (!featureEnabled) {
        redirect('/platform-admin');
    }

    // RBAC check - PLATFORM_ADMIN only
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'PLATFORM_ADMIN') {
        redirect('/unauthorized');
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="border-b pb-4">
                <h1 className="text-3xl font-bold tracking-tight">Outreach Engine</h1>
                <p className="text-muted-foreground mt-1">
                    Multi-stage awareness system with AI personalization
                </p>
            </div>

            {/* Sub-navigation */}
            <div className="border-b">
                <nav className="flex space-x-2 overflow-x-auto">
                    <Link
                        href="/platform-admin/outreach"
                        className="px-4 py-2 text-sm font-medium rounded-md hover:bg-accent transition-colors"
                    >
                        Command Center
                    </Link>
                    <Link
                        href="/platform-admin/outreach/pipeline"
                        className="px-4 py-2 text-sm font-medium rounded-md hover:bg-accent transition-colors"
                    >
                        Pipeline
                    </Link>
                    <Link
                        href="/platform-admin/outreach/content"
                        className="px-4 py-2 text-sm font-medium rounded-md hover:bg-accent transition-colors"
                    >
                        Content Studio
                    </Link>
                    <Link
                        href="/platform-admin/outreach/questionnaires"
                        className="px-4 py-2 text-sm font-medium rounded-md hover:bg-accent transition-colors"
                    >
                        Questionnaires
                    </Link>
                    <Link
                        href="/platform-admin/outreach/deliverability"
                        className="px-4 py-2 text-sm font-medium rounded-md hover:bg-accent transition-colors"
                    >
                        Deliverability
                    </Link>
                    <Link
                        href="/platform-admin/outreach/declines"
                        className="px-4 py-2 text-sm font-medium rounded-md hover:bg-accent transition-colors"
                    >
                        Declines
                    </Link>
                    <Link
                        href="/platform-admin/outreach/ai-oversight"
                        className="px-4 py-2 text-sm font-medium rounded-md hover:bg-accent transition-colors"
                    >
                        AI Oversight
                    </Link>
                </nav>
            </div>

            {/* Main content area */}
            <div className="mx-auto max-w-full">{children}</div>
        </div>
    );
}
