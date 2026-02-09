"use client";

import { useEffect, useState } from "react";
import { DeclineReasonsChart } from "../_components/DeclineReasonsChart";
import { RecoveryQueue } from "../_components/RecoveryQueue";
import { awarenessApi } from "@/lib/outreach/api";
import { RecoveryCandidate } from "@/lib/outreach/types";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function DeclinesPage() {
    const [reasons, setReasons] = useState<{ reason: string; count: number }[]>([]);
    const [recoveryQueue, setRecoveryQueue] = useState<RecoveryCandidate[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [r, q] = await Promise.all([
                awarenessApi.getDeclineReasons(),
                awarenessApi.getRecoveryCandidates(),
            ]);
            setReasons(r);
            setRecoveryQueue(q);
        } catch (error) {
            console.error("Failed to load declines data:", error);
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    const handleRecover = async (id: string, strategy: string) => {
        try {
            await awarenessApi.recoverCandidate(id, strategy);
            toast.success(`Recovering with strategy: ${strategy}`);
            // Remove from list
            setRecoveryQueue((prev) => prev.filter((c) => c.institution_id !== id));
        } catch (error) {
            toast.error("Failed to start recovery");
        }
    };

    const handleDismiss = async (id: string) => {
        try {
            await awarenessApi.dismissCandidate(id);
            setRecoveryQueue((prev) => prev.filter((c) => c.institution_id !== id));
            toast.success("Candidate dismissed");
        } catch (error) {
            toast.error("Failed to dismiss candidate");
        }
    };

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-200px)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Declines & Recovery</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <DeclineReasonsChart data={reasons} />
                {/* Placeholder for future detailed stats or another chart */}
                <div className="h-[400px] border rounded-lg bg-muted/20 flex items-center justify-center text-muted-foreground p-8 text-center italic">
                    Additional Analytics Placeholder<br />(e.g. Decline Rate by Stage, Industry Trends)
                </div>
            </div>

            <RecoveryQueue
                candidates={recoveryQueue}
                onRecover={handleRecover}
                onDismiss={handleDismiss}
            />
        </div>
    );
}
