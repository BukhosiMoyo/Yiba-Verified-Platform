import React from 'react';
import useSWR from 'swr';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { AlertCircle, ChevronRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function CircularProgress({ percentage, size = 40, strokeWidth = 3, className }: { percentage: number, size?: number, strokeWidth?: number, className?: string }) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    const colorClass = percentage === 100 ? "text-green-500" : percentage >= 80 ? "text-primary" : "text-amber-500";

    return (
        <div className={cn("relative flex items-center justify-center", className)} style={{ width: size, height: size }}>
            <svg className="transform -rotate-90 w-full h-full">
                <circle
                    className="text-muted/20"
                    strokeWidth={strokeWidth}
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
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
                    cx={size / 2}
                    cy={size / 2}
                />
            </svg>
            <span className={cn("absolute text-[10px] font-bold", colorClass)}>
                {percentage}%
            </span>
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
                    className="relative h-12 w-12 rounded-full p-0 hover:bg-transparent"
                >
                    <CircularProgress percentage={percentage} size={42} strokeWidth={4} />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
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
                            <div className="bg-amber-50/50 rounded-lg p-3 border border-amber-100">
                                <p className="text-xs font-semibold uppercase text-amber-600 mb-2 tracking-wide">Pending items</p>
                                <ul className="text-sm space-y-2">
                                    {missingFields.map((field: string) => (
                                        <li key={field} className="flex items-start text-amber-900/80">
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
