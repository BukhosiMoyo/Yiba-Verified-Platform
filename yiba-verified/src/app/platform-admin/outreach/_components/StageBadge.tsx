import { EngagementStage } from "@/lib/outreach/types";
import { cn } from "@/lib/utils";

interface StageBadgeProps {
    stage: EngagementStage;
    className?: string;
}

export function StageBadge({ stage, className }: StageBadgeProps) {
    const getStageColor = (stage: EngagementStage) => {
        switch (stage) {
            case EngagementStage.UNAWARE:
                return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
            case EngagementStage.PROBLEM_AWARE:
                return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
            case EngagementStage.SOLUTION_AWARE:
                return "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300";
            case EngagementStage.TRUST_AWARE:
                return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";
            case EngagementStage.ACTION_READY:
                return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300";
            case EngagementStage.CONVERTED:
                return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
            default:
                return "bg-gray-100 text-gray-700";
        }
    };

    const getLabel = (stage: EngagementStage) => {
        return stage.replace(/_/g, " ");
    };

    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide",
                getStageColor(stage),
                className
            )}
        >
            {getLabel(stage)}
        </span>
    );
}
