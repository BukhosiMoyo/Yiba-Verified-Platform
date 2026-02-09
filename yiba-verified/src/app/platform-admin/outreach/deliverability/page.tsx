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
import { Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
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

    const handleAddSuppression = async (email: string) => {
        await awarenessApi.addSuppressionEntry(email);
        const newList = await awarenessApi.getSuppressionList();
        setSuppressionList(newList);
    };

    const handleRemoveSuppression = async (email: string) => {
        await awarenessApi.removeSuppressionEntry(email);
        const newList = await awarenessApi.getSuppressionList();
        setSuppressionList(newList);
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
                <Button onClick={async () => {
                    try {
                        toast.loading("Starting batch...");
                        const res = await fetch('/api/platform-admin/outreach/deliverability/batch/start', { method: 'POST' });
                        const data = await res.json();
                        toast.dismiss();
                        if (data.success) {
                            toast.success(`Queued ${data.count} emails for delivery.`);
                            loadData(); // Reload metrics
                        } else {
                            toast.info(data.message || "Failed to start batch");
                        }
                    } catch (e) {
                        toast.dismiss();
                        toast.error("Error starting batch");
                    }
                }}>
                    <Play className="mr-2 h-4 w-4" /> Start Batch Now
                </Button>
            </div>

            <HealthMetrics metrics={metrics} />

            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-1">
                    <BatchConfigForm config={config} onSave={handleConfigSave} />
                </div>
                <div className="md:col-span-2">
                    <SuppressionList
                        entries={suppressionList}
                        onAdd={handleAddSuppression}
                        onRemove={handleRemoveSuppression}
                    />
                </div>
            </div>
        </div>
    );
}
