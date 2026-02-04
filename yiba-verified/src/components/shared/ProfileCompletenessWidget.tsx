import React from 'react';
import useSWR from 'swr';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { AlertCircle, ChevronRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function CircularProgress({ percentage, size = 60, strokeWidth = 8, className }: { percentage: number, size?: number, strokeWidth?: number, className?: string }) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    const colorClass = percentage === 100 ? "text-green-500" : percentage >= 80 ? "text-primary" : "text-amber-500";

    return (
        <div className={cn("relative flex items-center justify-center bg-card rounded-full shadow-lg border border-border/50", className)} style={{ width: size, height: size }}>
            <svg className="transform -rotate-90 w-full h-full p-0.5">
                <circle
                    className="text-muted/20"
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
                <span className={cn("text-[10px] font-bold", colorClass)}>
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

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    className="relative h-14 w-14 rounded-full p-0 hover:bg-transparent overflow-visible"
                >
                    <CircularProgress percentage={percentage} size={50} strokeWidth={5} />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 shadow-xl border-border bg-card/95 backdrop-blur-sm" align="end" sideOffset={8}>
                <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-lg">Profile Completeness</h4>
                        <span className={cn("text-lg font-bold", percentage === 100 ? "text-green-600" : "text-primary")}>
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
                            <div className="bg-amber-50/50 dark:bg-amber-950/20 rounded-lg p-3 border border-amber-100 dark:border-amber-900/30">
                                <p className="text-xs font-semibold uppercase text-amber-600 dark:text-amber-500 mb-2 tracking-wide">Pending items</p>
                                <ul className="text-sm space-y-2">
                                    {missingFields.map((field: string) => (
                                        <li key={field} className="flex items-start text-amber-900/80 dark:text-amber-200">
                                            <AlertCircle className="h-4 w-4 mr-2 text-amber-500 shrink-0 mt-0.5" />
                                            <span>{field}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
                <div className="bg-muted/30 p-4 border-t flex justify-end">
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
