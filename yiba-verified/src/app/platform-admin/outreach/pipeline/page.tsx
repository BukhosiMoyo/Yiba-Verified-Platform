"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { PipelineBoard } from "../_components/PipelineBoard";
import { PipelineList } from "../_components/PipelineList";
import { PipelineUploadWizard } from "../_components/PipelineUploadWizard";
import { AddContactDialog } from "../_components/AddContactDialog";
import { awarenessApi } from "@/lib/outreach/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { InstitutionOutreachProfile } from "@/lib/outreach/types";
import { Loader2, LayoutGrid, List, Upload, Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

export default function PipelinePage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    // State
    const [view, setView] = useState<"board" | "list">("board");
    const [loading, setLoading] = useState(false);
    const [institutions, setInstitutions] = useState<InstitutionOutreachProfile[]>([]);
    const [showUpload, setShowUpload] = useState(false);

    // Add ref for board scrolling
    const boardScrollRef = useRef<HTMLDivElement>(null);

    // Initial load and URL param check
    useEffect(() => {
        const uploadParam = searchParams.get("upload");
        if (uploadParam === "true") {
            setShowUpload(true);
        }
        loadInstitutions();
    }, [searchParams]);

    const loadInstitutions = async () => {
        setLoading(true);
        try {
            const data = await awarenessApi.getInstitutions();
            setInstitutions(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const openUpload = () => {
        setShowUpload(true);
        router.push(pathname + "?upload=true");
    };

    const closeUpload = () => {
        setShowUpload(false);
        router.push(pathname);
        loadInstitutions(); // Refresh after upload
    };

    const scrollBoard = (direction: 'left' | 'right') => {
        if (boardScrollRef.current) {
            const scrollAmount = 340;
            boardScrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="flex flex-col space-y-4">
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
                        {/* Scroll Buttons - Only visible in Board view */}
                        {view === "board" && (
                            <>
                                <div className="w-px h-4 bg-border mx-1" />
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => scrollBoard('left')}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => scrollBoard('right')}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </>
                        )}
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <AddContactDialog onContactAdded={() => loadInstitutions()} />

                    <Button
                        onClick={openUpload}
                        className="group h-9 w-9 px-0 hover:w-36 hover:px-3 transition-all duration-300 overflow-hidden whitespace-nowrap justify-start relative shadow-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 border-0"
                    >
                        <div className="absolute left-2.5 group-hover:left-3 transition-all duration-300">
                            <Upload className="h-4 w-4" />
                        </div>
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 pl-8">
                            Import CSV
                        </span>
                    </Button>

                    <Button
                        variant="destructive"
                        size="sm"
                        className="group h-9 w-9 px-0 hover:w-32 hover:px-3 transition-all duration-300 overflow-hidden whitespace-nowrap justify-start relative shadow-sm"
                        onClick={async () => {
                            const confirmation = prompt("DANGER: Type 'clear data' to confirm deletion of ALL institutions and contacts:");

                            if (confirmation === 'clear data') {
                                setLoading(true);
                                try {
                                    await awarenessApi.clearData();
                                    loadInstitutions();
                                } catch (e) {
                                    console.error("Clear data failed", e);
                                } finally {
                                    setLoading(false);
                                }
                            } else if (confirmation !== null) {
                                alert("Confirmation failed. Data was NOT cleared.");
                            }
                        }}
                    >
                        <div className="absolute left-2.5 group-hover:left-3 transition-all duration-300">
                            <Trash2 className="h-4 w-4" />
                        </div>
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 pl-8">
                            Clear Data
                        </span>
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : view === "board" ? (
                <div className="flex-1 overflow-hidden h-[calc(100vh-200px)]">
                    <PipelineBoard institutions={institutions} scrollRef={boardScrollRef} />
                </div>
            ) : (
                <div className="w-full">
                    <PipelineList institutions={institutions} />
                </div>
            )}

            {/* Upload Dialog ... */}
            <Dialog open={showUpload} onOpenChange={(open) => !open && closeUpload()}>
                <DialogContent
                    className="max-w-4xl p-0 bg-transparent border-none shadow-none"
                    onPointerDownOutside={(e) => e.preventDefault()}
                    onInteractOutside={(e) => e.preventDefault()}
                >
                    <DialogTitle className="sr-only">Upload Pipeline CSV</DialogTitle>
                    <PipelineUploadWizard onSuccess={closeUpload} onCancel={closeUpload} />
                </DialogContent>
            </Dialog>
        </div>
    );
}
