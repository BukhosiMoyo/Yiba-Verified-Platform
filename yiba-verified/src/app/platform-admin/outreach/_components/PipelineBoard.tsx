"use client";

import { useState } from "react";
import { EngagementStage, InstitutionOutreachProfile } from "@/lib/outreach/types";
import { StageColumn } from "./StageColumn";

interface PipelineBoardProps {
    institutions: InstitutionOutreachProfile[];
    scrollRef: React.RefObject<HTMLDivElement | null>;
}

export function PipelineBoard({ institutions, scrollRef }: PipelineBoardProps) {
    const [hoveredStage, setHoveredStage] = useState<EngagementStage | null>(null);

    const stages = [
        EngagementStage.UNCONTACTED,
        EngagementStage.CONTACTED,
        EngagementStage.ENGAGED,
        EngagementStage.EVALUATING,
        EngagementStage.READY,
        EngagementStage.ACTIVE,
        EngagementStage.DECLINED,
    ];

    const getInstitutionsByStage = (stage: EngagementStage) => {
        return institutions.filter((inst) => inst.engagement_stage === stage);
    };

    return (
        <div className="relative h-full group/board">
            <div
                ref={scrollRef}
                className="flex h-full gap-4 overflow-x-auto pb-4 px-1 snap-x scrollbar-hide"
            >
                {stages.map((stage) => (
                    <div key={stage} className="snap-start flex-shrink-0 h-full">
                        <StageColumn
                            stage={stage}
                            institutions={getInstitutionsByStage(stage)}
                            isHovered={hoveredStage === stage}
                            onHover={setHoveredStage}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
