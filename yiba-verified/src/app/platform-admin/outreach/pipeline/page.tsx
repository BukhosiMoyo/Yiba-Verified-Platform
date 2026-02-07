"use client";

import { useEffect, useState } from "react";
import { PipelineBoard } from "../_components/PipelineBoard";
import { PipelineFilters as Filters } from "../_components/PipelineFilters";
import { awarenessApi } from "@/lib/outreach/api";
import { InstitutionFilters, InstitutionOutreachProfile } from "@/lib/outreach/types";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List } from "lucide-react";

export default function PipelinePage() {
    const [institutions, setInstitutions] = useState<InstitutionOutreachProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<"board" | "list">("board");

    const loadInstitutions = async (filters: InstitutionFilters = {}) => {
        setLoading(true);
        try {
            const data = await awarenessApi.getInstitutions(filters);
            setInstitutions(data);
        } catch (error) {
            console.error("Failed to load institutions:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInstitutions();
    }, []);

    const handleFilterChange = (filters: InstitutionFilters) => {
        loadInstitutions(filters);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <h2 className="text-2xl font-bold tracking-tight">Pipeline</h2>
                    <div className="flex items-center space-x-1 border rounded-md p-1 bg-muted/20">
                        <Button
                            variant={view === "board" ? "secondary" : "ghost"}
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => setView("board")}
                        >
                            <LayoutGrid className="h-4 w-4 mr-2" />
                            Board
                        </Button>
                        <Button
                            variant={view === "list" ? "secondary" : "ghost"}
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => setView("list")}
                        >
                            <List className="h-4 w-4 mr-2" />
                            List
                        </Button>
                    </div>
                </div>
                <Filters onFilterChange={handleFilterChange} />
            </div>

            {loading ? (
                <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : view === "board" ? (
                <div className="flex-1 overflow-hidden">
                    <PipelineBoard institutions={institutions} />
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground border rounded-lg border-dashed">
                    List view coming soon
                </div>
            )}
        </div>
    );
}
