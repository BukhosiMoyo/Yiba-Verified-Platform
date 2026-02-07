"use client";

import { useEffect, useState } from "react";
import { MetricsOverview } from "../_components/MetricsOverview";
import { LiveFeed } from "../_components/LiveFeed";
import { FlaggedContentList } from "../_components/FlaggedContentList";
import { awarenessApi } from "@/lib/outreach/api";
import {
    OversightMetrics,
    GeneratedContentLog,
    FlaggedContent,
} from "@/lib/outreach/types";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AIOversightPage() {
    const [metrics, setMetrics] = useState<OversightMetrics | null>(null);
    const [logs, setLogs] = useState<GeneratedContentLog[]>([]);
    const [flagged, setFlagged] = useState<FlaggedContent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [m, l, f] = await Promise.all([
                awarenessApi.getOversightMetrics(),
                awarenessApi.getGenerationLogs(),
                awarenessApi.getFlaggedContent(),
            ]);
            setMetrics(m);
            setLogs(l);
            setFlagged(f);
        } catch (error) {
            console.error("Failed to load AI oversight data:", error);
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    const handleReview = async (id: string, action: "approve" | "reject") => {
        try {
            // Optimistic update
            setFlagged((prev) => prev.filter((item) => item.flag_id !== id));
            toast.success(`Content ${action}ed`);

            // Simulate API call
            // await awarenessApi.reviewFlaggedContent(id, action);
        } catch (error) {
            toast.error(`Failed to ${action} content`);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-200px)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!metrics) {
        return <div>Failed to load data.</div>;
    }

    return (
        <div className="space-y-6 h-full pb-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">AI Oversight</h2>
            </div>

            <MetricsOverview metrics={metrics} />

            <div className="grid gap-6 md:grid-cols-2 h-[calc(100vh-300px)] min-h-[500px]">
                <div className="flex flex-col h-full overflow-hidden">
                    <LiveFeed logs={logs} />
                </div>
                <div className="flex flex-col h-full overflow-hidden">
                    <FlaggedContentList items={flagged} onReview={handleReview} />
                </div>
            </div>
        </div>
    );
}
