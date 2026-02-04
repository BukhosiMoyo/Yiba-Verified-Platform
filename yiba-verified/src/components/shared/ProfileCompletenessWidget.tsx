import React from 'react';
import useSWR from 'swr';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { AlertCircle, ChevronRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function CircularProgress({ percentage, size = 32, strokeWidth = 3, className }: { percentage: number, size?: number, strokeWidth?: number, className?: string }) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    // Dynamic color logic: Red < 50, Orange < 80, Green >= 80
    let colorClass = "text-green-500";
    if (percentage < 50) {
        colorClass = "text-red-500";
    } else if (percentage < 80) {
        colorClass = "text-orange-500";
    }

    return (
        <div className={cn("relative flex items-center justify-center bg-card rounded-full shadow-sm border border-border/50", className)} style={{ width: size, height: size }}>
            <svg className="transform -rotate-90 w-full h-full p-0.5">
                <circle
                    className="text-muted/10"
                    strokeWidth={strokeWidth}
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="50%"
                    cy="50%"
                />
                <circle
                    className={cn("transition-all duration-1000 ease-out", colorClass)}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="50%"
                    cy="50%"
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className={cn("text-[9px] font-bold", colorClass)}>
                    {percentage}%
                </span>
            </div>
        </div>
    );
}

export function ProfileCompletenessWidget() {
    const { data, error, isLoading } = useSWR('/api/profile/completeness', fetcher);

    if (isLoading || error || !data) return null;

    const { percentage, missingFields } = data;
    const isComplete = percentage === 100;

    if (isComplete) return null;

    // Reuse dynamic color logic for the popup text
    let colorClass = "text-green-600";
    if (percentage < 50) {
        colorClass = "text-red-600";
    } else if (percentage < 80) {
        colorClass = "text-orange-600";
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    className="relative h-9 w-9 rounded-full p-0 hover:bg-transparent overflow-visible"
                    aria-label="Profile Completeness"
                >
                    <CircularProgress percentage={percentage} size={34} strokeWidth={3} />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 shadow-xl border-border bg-card/95 backdrop-blur-sm" align="end" sideOffset={8}>
                <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-lg">Profile Completeness</h4>
                        <span className={cn("text-lg font-bold", colorClass)}>
                            {percentage}%
                        </span>
                    </div>

                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {isComplete
                                ? "Great job! Your profile is fully complete."
                                : "Complete your profile to unlock all features and improve account visibility."}
                        </p>

                        {!isComplete && missingFields.length > 0 && (
                            <div className="bg-amber-50 dark:bg-amber-950/40 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
                                <p className="text-xs font-bold uppercase text-amber-700 dark:text-amber-400 mb-2 tracking-wide">Pending items</p>
                                <ul className="text-sm space-y-2">
                                    {missingFields.map((field: string) => (
                                        <li key={field} className="flex items-start text-amber-900 dark:text-amber-100 font-medium">
                                            <AlertCircle className="h-4 w-4 mr-2 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                                            <span>{field}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
                <div className="bg-muted/30 p-4 border-t border-gray-200 dark:border-gray-800 flex justify-end">
                    <Button size="default" className="w-full font-medium" asChild>
                        <Link href="/account/profile">
                            {isComplete ? "Edit Profile" : "Complete Profile"} <ChevronRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
