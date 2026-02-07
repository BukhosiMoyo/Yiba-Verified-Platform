"use client";

import { useEffect, useState } from "react";
import { BatchConfigForm } from "../_components/BatchConfigForm";
import { HealthMetrics } from "../_components/HealthMetrics";
import { SuppressionList } from "../_components/SuppressionList";
import { awarenessApi } from "@/lib/outreach/api";
import {
    DeliverabilityMetrics,
    BatchConfig,
    SuppressionEntry,
} from "@/lib/outreach/types";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function DeliverabilityPage() {
    const [metrics, setMetrics] = useState<DeliverabilityMetrics | null>(null);
    const [config, setConfig] = useState<BatchConfig | null>(null);
    const [suppressionList, setSuppressionList] = useState<SuppressionEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [m, c, s] = await Promise.all([
                awarenessApi.getDeliverabilityMetrics(),
                awarenessApi.getBatchConfig(),
                awarenessApi.getSuppressionList(),
            ]);
            setMetrics(m);
            setConfig(c);
            setSuppressionList(s);
        } catch (error) {
            console.error("Failed to load deliverability data:", error);
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    const handleConfigSave = async (newConfig: BatchConfig) => {
        try {
            await awarenessApi.updateBatchConfig(newConfig);
            setConfig(newConfig);
            toast.success("Configuration saved");
        } catch (error) {
            toast.error("Failed to save configuration");
        }
    };

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-200px)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!metrics || !config) {
        return <div>Failed to load data.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Deliverability Controls</h2>
            </div>

            <HealthMetrics metrics={metrics} />

            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-1">
                    <BatchConfigForm config={config} onSave={handleConfigSave} />
                </div>
                <div className="md:col-span-2">
                    <SuppressionList entries={suppressionList} />
                </div>
            </div>
        </div>
    );
}
