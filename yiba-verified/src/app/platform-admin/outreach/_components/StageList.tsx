import { EngagementStage, EmailTemplateStage } from "@/lib/outreach/types";
import { cn } from "@/lib/utils";
import { StageBadge } from "./StageBadge";
import { ChevronRight } from "lucide-react";

interface StageListProps {
    currentStage: EngagementStage;
    onSelectStage: (stage: EngagementStage) => void;
    templates: EmailTemplateStage[];
}

export function StageList({ currentStage, onSelectStage, templates }: StageListProps) {
    const stages = [
        EngagementStage.UNAWARE,
        EngagementStage.PROBLEM_AWARE,
        EngagementStage.SOLUTION_AWARE,
        EngagementStage.TRUST_AWARE,
        EngagementStage.ACTION_READY,
        EngagementStage.CONVERTED,
    ];

    return (
        <div className="w-64 border-r bg-muted/20 h-full flex flex-col">
            <div className="p-4 border-b font-semibold text-sm">
                Engagement Stages
            </div>
            <div className="flex-1 overflow-y-auto py-2">
                {stages.map((stage) => {
                    const template = templates.find((t) => t.stage === stage);
                    const isActive = currentStage === stage;

                    return (
                        <button
                            key={stage}
                            onClick={() => onSelectStage(stage)}
                            className={cn(
                                "w-full flex items-center justify-between px-4 py-3 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                                isActive && "bg-accent text-accent-foreground font-medium"
                            )}
                        >
                            <div className="flex flex-col items-start gap-1">
                                <StageBadge stage={stage} className="text-[10px] px-1.5 py-0" />
                                <span className="text-xs text-muted-foreground ml-1">
                                    {template ? "v" + template.version : "No template"}
                                </span>
                            </div>
                            {isActive && <ChevronRight className="h-4 w-4 opacity-50" />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
