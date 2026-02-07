import { EngagementStage, InstitutionOutreachProfile } from "@/lib/outreach/types";
import { InstitutionCard } from "./InstitutionCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StageBadge } from "./StageBadge";

interface StageColumnProps {
    stage: EngagementStage;
    institutions: InstitutionOutreachProfile[];
}

export function StageColumn({ stage, institutions }: StageColumnProps) {
    return (
        <div className="flex w-80 flex-col rounded-lg border bg-muted/50 h-full max-h-[calc(100vh-220px)]">
            <div className="p-4 border-b flex items-center justify-between bg-background rounded-t-lg">
                <StageBadge stage={stage} />
                <span className="text-xs font-medium text-muted-foreground">
                    {institutions.length}
                </span>
            </div>
            <ScrollArea className="flex-1 p-2">
                <div className="space-y-2">
                    {institutions.map((inst) => (
                        <InstitutionCard key={inst.institution_id} institution={inst} />
                    ))}
                    {institutions.length === 0 && (
                        <div className="flex h-24 items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">
                            No institutions
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
