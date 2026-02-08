import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import {
    LayoutDashboard,
    Workflow,
    FileEdit,
    ClipboardList,
    Mail,
    TrendingDown,
    Bot,
    Sparkles,
    TestTube
} from 'lucide-react';

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

    const navItems = [
        {
            href: '/platform-admin/outreach',
            label: 'Command Center',
            icon: LayoutDashboard,
            gradient: 'from-blue-500 to-cyan-500'
        },
        {
            href: '/platform-admin/outreach/pipeline',
            label: 'Pipeline',
            icon: Workflow,
            gradient: 'from-purple-500 to-pink-500'
        },
        {
            href: '/platform-admin/outreach/content',
            label: 'Content Studio',
            icon: FileEdit,
            gradient: 'from-green-500 to-emerald-500'
        },
        {
            href: '/platform-admin/outreach/questionnaires',
            label: 'Questionnaires',
            icon: ClipboardList,
            gradient: 'from-orange-500 to-amber-500'
        },
        {
            href: '/platform-admin/outreach/deliverability',
            label: 'Deliverability',
            icon: Mail,
            gradient: 'from-teal-500 to-cyan-500'
        },
        {
            href: '/platform-admin/outreach/declines',
            label: 'Declines',
            icon: TrendingDown,
            gradient: 'from-red-500 to-rose-500'
        },
        {
            href: '/platform-admin/outreach/ai-oversight',
            label: 'AI Oversight',
            icon: Bot,
            gradient: 'from-indigo-500 to-purple-500'
        },
        {
            href: '/platform-admin/outreach/sandbox',
            label: 'Sandbox',
            icon: TestTube,
            gradient: 'from-pink-500 to-rose-500'
        },
    ];

    return (
        <div className="space-y-6 p-6">
            {/* Header with gradient and modern styling */}
            <div className="relative overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-background/80 to-background/40 backdrop-blur-sm shadow-lg p-8">
                {/* Animated gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-blue-500/10 animate-pulse opacity-50" />

                <div className="relative">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
                            <Sparkles className="h-6 w-6 text-white" />
                        </div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                            Outreach Engine
                        </h1>
                    </div>
                    <p className="text-muted-foreground text-lg ml-14">
                        Multi-stage awareness system with AI personalization
                    </p>
                </div>
            </div>

            {/* Modern pill-style navigation */}
            <div className="relative">
                <div className="bg-gradient-to-br from-background/80 to-background/40 backdrop-blur-sm rounded-xl border-0 shadow-md p-2">
                    <nav className="flex items-center justify-center gap-2 overflow-x-auto scrollbar-hide">
                        {navItems.map((item, index) => {
                            const Icon = item.icon;
                            // Add active state check logic if we want to change default appearance based on route
                            // But here we rely on hover/group

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="group relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 whitespace-nowrap"
                                    style={{
                                        animationDelay: `${index * 50}ms`,
                                    }}
                                >
                                    {/* Gradient background on hover for the whole link */}
                                    <div className={`absolute inset-0 rounded-lg bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

                                    {/* Icon container with separated background opacity */}
                                    <div className="relative flex items-center justify-center w-7 h-7 rounded-md group-hover:shadow-lg transition-all duration-300">
                                        <div className={`absolute inset-0 rounded-md bg-gradient-to-br ${item.gradient} opacity-20 group-hover:opacity-100 transition-all duration-300`} />
                                        <Icon className="relative z-10 h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        <Icon className="absolute z-10 h-4 w-4 text-muted-foreground group-hover:text-white opacity-100 group-hover:opacity-0 transition-opacity duration-300" />
                                    </div>

                                    {/* Label */}
                                    <span className="relative text-muted-foreground group-hover:text-foreground transition-colors">
                                        {item.label}
                                    </span>

                                    {/* Active indicator dot */}
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </div>

            {/* Main content area */}
            <div className="mx-auto max-w-full">{children}</div>
        </div>
    );
}
