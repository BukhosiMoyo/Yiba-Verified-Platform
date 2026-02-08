"use client";

import { useRef, useState } from "react";
import { EngagementStage, InstitutionOutreachProfile } from "@/lib/outreach/types";
import { InstitutionCard } from "./InstitutionCard";
import { StageBadge } from "./StageBadge";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@/lib/utils";

interface StageColumnProps {
    stage: EngagementStage;
    institutions: InstitutionOutreachProfile[];
    isHovered?: boolean;
    onHover?: (stage: EngagementStage | null) => void;
}

export function StageColumn({ stage, institutions, isHovered, onHover }: StageColumnProps) {
    const parentRef = useRef<HTMLDivElement>(null);

    const rowVirtualizer = useVirtualizer({
        count: institutions.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 140, // Estimate card height
        overscan: 5,
    });

    return (
        <div
            className={cn(
                "flex flex-col rounded-xl border bg-muted/30 h-full max-h-[calc(100vh-220px)] transition-all duration-300 ease-in-out",
                isHovered ? "border-primary/20 w-96 shadow-sm" : "border-border/40 w-80"
            )}
            onMouseEnter={() => onHover?.(stage)}
            onMouseLeave={() => onHover?.(null)}
        >
            <div className="p-3 border-b border-border/40 flex items-center justify-between bg-background/50 backdrop-blur-sm rounded-t-xl sticky top-0 z-10">
                <StageBadge stage={stage} />
                <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {institutions.length}
                </span>
            </div>

            <div
                ref={parentRef}
                className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent"
            >
                <div
                    style={{
                        height: `${rowVirtualizer.getTotalSize()}px`,
                        width: '100%',
                        position: 'relative',
                    }}
                >
                    {institutions.length === 0 && (
                        <div className="absolute inset-0 flex h-24 items-center justify-center rounded-lg border border-dashed border-border/50 text-xs text-muted-foreground">
                            No institutions
                        </div>
                    )}

                    {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                        const inst = institutions[virtualRow.index];
                        return (
                            <div
                                key={inst.institution_id}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: `${virtualRow.size}px`,
                                    transform: `translateY(${virtualRow.start}px)`,
                                    paddingBottom: '0.5rem' // Spacer between cards
                                }}
                            >
                                <div className="px-0.5">
                                    <InstitutionCard institution={inst} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
