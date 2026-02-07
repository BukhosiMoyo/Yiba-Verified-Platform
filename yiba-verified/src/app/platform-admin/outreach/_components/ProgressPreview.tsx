import { QuestionnaireStep } from "@/lib/outreach/types";
import { cn } from "@/lib/utils";

interface ProgressPreviewProps {
    steps: QuestionnaireStep[];
    currentStepIndex?: number;
}

export function ProgressPreview({ steps, currentStepIndex = 0 }: ProgressPreviewProps) {
    return (
        <div className="flex items-center justify-center space-x-2 py-4">
            {steps.map((step, index) => {
                const isActive = index === currentStepIndex;
                const isCompleted = index < currentStepIndex;

                return (
                    <div
                        key={step.step_id}
                        className="flex items-center"
                        title={step.title}
                    >
                        <div
                            className={cn(
                                "flex h-2 w-8 rounded-full transition-all",
                                isActive
                                    ? "bg-primary w-12"
                                    : isCompleted
                                        ? "bg-primary/60"
                                        : "bg-muted"
                            )}
                        />
                    </div>
                );
            })}
        </div>
    );
}
