"use client";

import { useState, useEffect } from "react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

export function ProfileCompletenessWidget() {
    const [completeness, setCompleteness] = useState<{ percentage: number; missingFields: string[] } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/profile/completeness")
            .then((res) => res.json())
            .then((data) => {
                if (!data.error) setCompleteness(data);
            })
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading || !completeness) return null;

    const { percentage, missingFields } = completeness;
    const isComplete = percentage === 100;

    // Simple Circular Progress SVG
    const radius = 16;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    const strokeColor = percentage < 50 ? "#ef4444" : percentage < 80 ? "#eab308" : "#22c55e";

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full">
                    <div className="relative flex items-center justify-center">
                        <svg className="h-8 w-8 -rotate-90 transform" viewBox="0 0 40 40">
                            <circle cx="20" cy="20" r={radius} stroke="currentColor" strokeWidth="3" fill="transparent" className="text-muted/20" />
                            <circle cx="20" cy="20" r={radius} stroke={strokeColor} strokeWidth="3" fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
                        </svg>
                        <span className="absolute text-[9px] font-bold">{percentage}%</span>
                    </div>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-4" align="end">
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="font-medium leading-none">Profile Completeness</h4>
                        <span className={`text-sm font-bold ${percentage < 100 ? "text-amber-500" : "text-green-500"}`}>
                            {percentage}%
                        </span>
                    </div>

                    {isComplete ? (
                        <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-md">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm">All set! Great job.</span>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">Complete your profile to increase trust.</p>
                            <div className="flex flex-col gap-1">
                                {missingFields.map((field) => (
                                    <div key={field} className="flex items-center gap-2 text-sm text-red-500">
                                        <AlertCircle className="h-3 w-3" />
                                        <span>{field} is missing</span>
                                    </div>
                                ))}
                            </div>
                            <Button size="sm" className="w-full mt-2" asChild>
                                <Link href="/settings/profile">Update Profile</Link>
                            </Button>
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
