import { EngagementState } from "@prisma/client";
import { Badge } from "@/components/ui/badge";

interface EngagementStateBadgeProps {
    state: EngagementState | null;
    className?: string;
}

const STATE_CONFIG: Record<EngagementState, { label: string; variant: string; className: string }> = {
    UNCONTACTED: {
        label: "Uncontacted",
        variant: "secondary",
        className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    },
    CONTACTED: {
        label: "Contacted",
        variant: "default",
        className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    },
    ENGAGED: {
        label: "Engaged",
        variant: "default",
        className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    },
    EVALUATING: {
        label: "Evaluating",
        variant: "default",
        className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    },
    READY: {
        label: "Ready",
        variant: "default",
        className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
    },
    ACTIVE: {
        label: "Active",
        variant: "default",
        className: "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300",
    },
    PAUSED: {
        label: "Paused",
        variant: "default",
        className: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
    },
    DECLINED: {
        label: "Declined",
        variant: "destructive",
        className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    },
    DORMANT: {
        label: "Dormant",
        variant: "secondary",
        className: "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-400",
    },
    ARCHIVED: {
        label: "Archived",
        variant: "outline",
        className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    },
};

export function EngagementStateBadge({ state, className }: EngagementStateBadgeProps) {
    if (!state) {
        return (
            <Badge variant="secondary" className={className}>
                Unknown
            </Badge>
        );
    }

    const config = STATE_CONFIG[state];

    return (
        <Badge
            variant={config.variant as any}
            className={`${config.className} ${className || ""}`}
        >
            {config.label}
        </Badge>
    );
}
