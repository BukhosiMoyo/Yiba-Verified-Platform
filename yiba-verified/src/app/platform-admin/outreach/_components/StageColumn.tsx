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
    totalCount: number;
    isHovered?: boolean;
    isFocused?: boolean; // Menu open in this column
    onHover?: (stage: EngagementStage | null) => void;
    onFocus?: (stage: EngagementStage | null) => void;
    onScrollEnd?: () => void;
}

export function StageColumn({ stage, institutions, totalCount, isHovered, isFocused, onHover, onFocus, onScrollEnd }: StageColumnProps) {
    const parentRef = useRef<HTMLDivElement>(null);

    const rowVirtualizer = useVirtualizer({
        count: institutions.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 140, // Estimate card height
        overscan: 5,
    });

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        // Trigger load more when within 200px of bottom
        if (scrollHeight - scrollTop - clientHeight < 200) {
            onScrollEnd?.();
        }
    };

    return (
        <div
            className={cn(
                "flex flex-col rounded-xl border bg-card/50 backdrop-blur-sm h-full min-h-[calc(100vh-200px)] transition-all duration-300 ease-in-out",
                (isHovered || isFocused) ? "border-primary/20 w-96 shadow-md bg-card" : "border-border/60 w-72"
            )}
            style={{ height: 'calc(100vh - 200px)' }} // Explicit height
            onMouseEnter={() => onHover?.(stage)}
            onMouseLeave={() => onHover?.(null)}
        >
            <div className="p-3 border-b border-border/40 flex items-center justify-between bg-muted rounded-t-xl sticky top-0 z-10">
                <StageBadge stage={stage} count={totalCount} />
            </div>

            <div
                ref={parentRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-2 scrollbar-hide"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
                <div
                    style={{
                        height: `${rowVirtualizer.getTotalSize()}px`,
                        width: '100%',
                        position: 'relative',
                    }}
                >
                    {institutions.length === 0 && (
                        <div className="absolute inset-0 flex h-24 items-center justify-center rounded-lg border border-dashed border-border/50 text-xs text-muted-foreground bg-muted/10">
                            No institutions
                        </div>
                    )}

                    {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                        const inst = institutions[virtualRow.index];
                        return (
                            <div
                                key={inst.id}
                                data-index={virtualRow.index}
                                ref={rowVirtualizer.measureElement}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    transform: `translateY(${virtualRow.start}px)`,
                                    paddingBottom: '0.75rem' // Increased spacer between cards
                                }}
                            >
                                <div className="px-0.5">
                                    <InstitutionCard
                                        institution={inst}
                                        onMenuOpen={(open) => {
                                            if (open) onFocus?.(stage);
                                            else onFocus?.(null);
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// Add global style for scrollbar hiding if needed, or rely on inline styles + tailwind class
// We used inline styles for robust cross-browser support

