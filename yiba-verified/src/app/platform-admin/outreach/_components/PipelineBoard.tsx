"use client";

import { EngagementStage, InstitutionOutreachProfile } from "@/lib/outreach/types";
import { StageColumn } from "./StageColumn";

interface PipelineBoardProps {
    institutions: InstitutionOutreachProfile[];
}

export function PipelineBoard({ institutions }: PipelineBoardProps) {
    const stages = [
        EngagementStage.UNAWARE,
        EngagementStage.PROBLEM_AWARE,
        EngagementStage.SOLUTION_AWARE,
        EngagementStage.TRUST_AWARE,
        EngagementStage.ACTION_READY,
        EngagementStage.CONVERTED,
    ];

    const getInstitutionsByStage = (stage: EngagementStage) => {
        return institutions.filter((inst) => inst.engagement_stage === stage);
    };

    return (
        <div className="flex h-full gap-4 overflow-x-auto pb-4">
            {stages.map((stage) => (
                <StageColumn
                    key={stage}
                    stage={stage}
                    institutions={getInstitutionsByStage(stage)}
                />
            ))}
        </div>
    );
}
