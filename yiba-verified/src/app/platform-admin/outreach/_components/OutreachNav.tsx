"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Workflow,
    FileEdit,
    ClipboardList,
    Mail,
    TrendingDown,
    Bot,
    TestTube
} from 'lucide-react';

export function OutreachNav() {
    const pathname = usePathname();

    const navItems = [
        {
            href: '/platform-admin/outreach',
            label: 'Command Center',
            icon: LayoutDashboard,
            color: 'text-blue-500',
            exact: true
        },
        {
            href: '/platform-admin/outreach/pipeline',
            label: 'Pipeline',
            icon: Workflow,
            color: 'text-purple-500'
        },
        {
            href: '/platform-admin/outreach/content',
            label: 'Content',
            icon: FileEdit,
            color: 'text-pink-500'
        },
        {
            href: '/platform-admin/outreach/questionnaires',
            label: 'Questionnaires',
            icon: ClipboardList,
            color: 'text-orange-500'
        },
        {
            href: '/platform-admin/outreach/deliverability',
            label: 'Deliverability',
            icon: Mail,
            color: 'text-green-500'
        },
        {
            href: '/platform-admin/outreach/declines',
            label: 'Declines',
            icon: TrendingDown,
            color: 'text-red-500'
        },
        {
            href: '/platform-admin/outreach/ai-oversight',
            label: 'AI Oversight',
            icon: Bot,
            color: 'text-cyan-500'
        },
        {
            href: '/platform-admin/outreach/sandbox',
            label: 'Sandbox',
            icon: TestTube,
            color: 'text-yellow-500'
        },
    ];

    return (
        <div className="w-full flex justify-center border-b border-border/40 pb-4">
            <nav className="flex flex-wrap items-center justify-center gap-1.5 p-1 rounded-xl border border-border/40 bg-background/50 backdrop-blur-sm shadow-sm">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.exact
                        ? pathname === item.href
                        : pathname.startsWith(item.href);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "group relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                                isActive
                                    ? "bg-primary/10 text-primary shadow-sm"
                                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                            )}
                        >
                            <Icon className={cn(
                                "h-4 w-4 transition-colors",
                                isActive ? item.color : cn(item.color, "opacity-70 group-hover:opacity-100")
                            )} />
                            <span>{item.label}</span>

                            {isActive && (
                                <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent mx-2" />
                            )}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
