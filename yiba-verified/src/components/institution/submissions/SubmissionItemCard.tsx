"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface SubmissionItemCardProps {
    item: {
        submission_item_id: string;
        type: string;
        status: string;
        config_json: any;
        metrics_snapshot_json: any;
        updated_at: string;
    };
    isEditable: boolean;
}

export function SubmissionItemCard({ item, isEditable }: SubmissionItemCardProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const router = useRouter();

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const res = await fetch(`/api/institutions/submissions/items/${item.submission_item_id}/generate`, {
                method: "POST",
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Failed to generate snapshot");
            }

            toast.success("Snapshot Generated", {
                description: "The submission data has been successfully generated.",
            });

            router.refresh();
        } catch (error: any) {
            toast.error("Error", {
                description: error.message,
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "GENERATED": return "bg-green-50 border-green-200 text-green-700";
            case "LOCKED": return "bg-blue-50 border-blue-200 text-blue-700";
            case "DRAFT": return "bg-gray-100 border-gray-200 text-gray-600";
            default: return "bg-gray-100 border-gray-200 text-gray-600";
        }
    };

    const metrics = item.metrics_snapshot_json?.metrics;

    return (
        <div className="flex flex-col md:flex-row md:items-start md:justify-between p-4 border rounded-lg bg-gray-50/50 gap-4">
            <div className="flex-1 space-y-2">
                {/* Header */}
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{item.type.replace(/_/g, " ")}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${getStatusColor(item.status)}`}>
                        {item.status}
                    </span>
                </div>

                {/* Config Summary */}
                {item.config_json && (
                    <div className="text-xs text-muted-foreground space-y-1">
                        {item.config_json.cohort_id && (
                            <div>
                                <span className="font-medium">Cohort:</span>{" "}
                                <span className="font-mono bg-white px-1 rounded border">{item.config_json.cohort_id}</span>
                            </div>
                        )}
                        {item.config_json.start_date && (
                            <div>
                                <span className="font-medium">Range:</span>{" "}
                                {new Date(item.config_json.start_date).toLocaleDateString()} - {new Date(item.config_json.end_date).toLocaleDateString()}
                            </div>
                        )}
                    </div>
                )}

                {/* Metrics View (if generated) */}
                {item.status === "GENERATED" && metrics && (
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div className="bg-white p-2 rounded border">
                            <div className="text-[10px] text-muted-foreground uppercase">Records</div>
                            <div className="text-lg font-bold">{metrics.total_records}</div>
                        </div>
                        <div className="bg-white p-2 rounded border">
                            <div className="text-[10px] text-muted-foreground uppercase">Rate</div>
                            <div className={`text-lg font-bold ${metrics.attendance_rate < 80 ? 'text-orange-600' : 'text-green-600'}`}>
                                {metrics.attendance_rate}%
                            </div>
                        </div>
                        <div className="bg-white p-2 rounded border">
                            <div className="text-[10px] text-muted-foreground uppercase">Learners</div>
                            <div className="text-lg font-bold">{metrics.unique_learners}</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
                {item.status === "GENERATED" && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/api/institutions/submissions/items/${item.submission_item_id}/export`, '_blank')}
                    >
                        Export CSV
                    </Button>
                )}

                {isEditable && item.status !== "LOCKED" && (
                    <Button
                        variant={item.status === "GENERATED" ? "outline" : "default"}
                        size="sm"
                        onClick={handleGenerate}
                        disabled={isGenerating}
                    >
                        {isGenerating ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : item.status === "GENERATED" ? (
                            <RefreshCw className="w-4 h-4 mr-2" />
                        ) : (
                            <CheckCircle className="w-4 h-4 mr-2" />
                        )}
                        {isGenerating ? "Processing..." : item.status === "GENERATED" ? "Regenerate" : "Generate Snapshot"}
                    </Button>
                )}

                {!isEditable && item.status === "DRAFT" && (
                    <div className="text-xs text-orange-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Still in Draft
                    </div>
                )}
            </div>
        </div>
    );
}
