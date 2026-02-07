import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History, Save } from "lucide-react";
import { TemplateStatus } from "@/lib/outreach/types";
import { cn } from "@/lib/utils";

interface VersionControlProps {
    version: number;
    status: TemplateStatus;
    hasChanges: boolean;
    onSave: () => void;
    onPublish: () => void;
}

export function VersionControl({ version, status, hasChanges, onSave, onPublish }: VersionControlProps) {
    return (
        <div className="flex items-center justify-between border-b p-4 bg-background z-10 sticky top-0">
            <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-xs">
                    v{version}
                </Badge>
                <div className={cn(
                    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                    status === TemplateStatus.PUBLISHED ? "border-transparent bg-green-100 text-green-700 hover:bg-green-100/80" : "border-transparent bg-amber-100 text-amber-700 hover:bg-amber-100/80"
                )}>
                    {status}
                </div>
                {hasChanges && (
                    <span className="text-xs text-amber-600 font-medium italic">
                        • Unsaved Changes
                    </span>
                )}
            </div>

            <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" disabled>
                    <History className="mr-2 h-4 w-4" />
                    History
                </Button>
                <Button variant="outline" size="sm" onClick={onSave} disabled={!hasChanges}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Draft
                </Button>
                <Button size="sm" onClick={onPublish}>
                    Publish
                </Button>
            </div>
        </div>
    );
}
