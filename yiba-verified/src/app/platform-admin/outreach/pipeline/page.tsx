"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { PipelineBoard } from "../_components/PipelineBoard";
import { PipelineList } from "../_components/PipelineList";
import { PipelineFilters as Filters } from "../_components/PipelineFilters";
import { PipelineUploadWizard } from "../_components/PipelineUploadWizard";
import { awarenessApi } from "@/lib/outreach/api";
import { InstitutionFilters, InstitutionOutreachProfile } from "@/lib/outreach/types";
import { Loader2, LayoutGrid, List, Upload, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export default function PipelinePage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const [institutions, setInstitutions] = useState<InstitutionOutreachProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<"board" | "list">("board");

    // Check for upload action in URL
    const showUpload = searchParams.get("action") === "upload";

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

    const closeUpload = () => {
        const params = new URLSearchParams(searchParams);
        params.delete("action");
        router.replace(`${pathname}?${params.toString()}`);
        loadInstitutions(); // Reload data after potential upload
    };

    const openUpload = () => {
        const params = new URLSearchParams(searchParams);
        params.set("action", "upload");
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <h2 className="text-2xl font-bold tracking-tight">Pipeline</h2>
                    <div className="flex items-center space-x-1 border border-border rounded-md p-1 bg-muted">
                        <Button
                            variant={view === "board" ? "secondary" : "ghost"}
                            size="sm"
                            className={`h-8 px-2 transition-all ${view === "board" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                            onClick={() => setView("board")}
                        >
                            <LayoutGrid className="h-4 w-4 mr-2" />
                            Board
                        </Button>
                        <Button
                            variant={view === "list" ? "secondary" : "ghost"}
                            size="sm"
                            className={`h-8 px-2 transition-all ${view === "list" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                            onClick={() => setView("list")}
                        >
                            <List className="h-4 w-4 mr-2" />
                            List
                        </Button>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <Filters onFilterChange={handleFilterChange} />
                    <Button onClick={openUpload} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:shadow-lg transition-all">
                        <Upload className="h-4 w-4 mr-2" />
                        Import CSV
                    </Button>
                </div>
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
                <div className="flex-1 overflow-auto p-1">
                    <PipelineList institutions={institutions} />
                </div>
            )}

            {/* Upload Modal controlled by URL param */}
            <Dialog open={showUpload} onOpenChange={(open) => !open && closeUpload()}>
                <DialogContent
                    className="max-w-4xl p-0 bg-transparent border-none shadow-none"
                    onPointerDownOutside={(e) => e.preventDefault()}
                    onInteractOutside={(e) => e.preventDefault()}
                >
                    <PipelineUploadWizard onSuccess={closeUpload} onCancel={closeUpload} />
                </DialogContent>
            </Dialog>
        </div>
    );
}
