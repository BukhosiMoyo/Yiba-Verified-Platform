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
    const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });
    const [showUpload, setShowUpload] = useState(false);

    // Add ref for board scrolling
    const boardScrollRef = useRef<HTMLDivElement>(null);

    // Initial load and URL param check
    useEffect(() => {
        const uploadParam = searchParams.get("upload");
        if (uploadParam === "true") {
            setShowUpload(true);
        }
        loadInstitutions(1);
    }, [searchParams]);

    const loadInstitutions = async (pageVal = 1) => {
        setLoading(true);
        try {
            // @ts-ignore - API type updated but might not be reflected in editor context immediately
            const response = await awarenessApi.getInstitutions(undefined, pageVal, pagination.limit);
            if (response.meta) {
                setInstitutions(response.data);
                setPagination(response.meta);
            } else {
                // Fallback if API hasn't updated or returns array (mock mode)
                setInstitutions(response as any);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (newPage: number) => {
        if (newPage > 0 && newPage <= pagination.totalPages) {
            loadInstitutions(newPage);
        }
    };

    const openUpload = () => {
        setShowUpload(true);
        router.push(pathname + "?upload=true");
    };

    const closeUpload = () => {
        setShowUpload(false);
        router.push(pathname);
        loadInstitutions(1); // Refresh after upload, reset to page 1
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
        <div className="flex flex-col space-y-4 h-[calc(100vh-100px)]">
            <div className="flex items-center justify-between shrink-0">
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
                    <AddContactDialog onContactAdded={() => loadInstitutions(pagination.page)} />

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
                                    loadInstitutions(1);
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
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex-1 overflow-hidden">
                        {view === "board" ? (
                            <PipelineBoard institutions={institutions} scrollRef={boardScrollRef} />
                        ) : (
                            <div className="h-full overflow-y-auto">
                                <PipelineList institutions={institutions} />
                            </div>
                        )}
                    </div>

                    {/* Pagination Controls */}
                    <div className="shrink-0 py-2 border-t border-border flex items-center justify-between px-2">
                        <div className="text-sm text-muted-foreground">
                            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} records
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(pagination.page - 1)}
                                disabled={pagination.page <= 1 || loading}
                            >
                                Previous
                            </Button>
                            <span className="text-sm font-medium">
                                Page {pagination.page} of {pagination.totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(pagination.page + 1)}
                                disabled={pagination.page >= pagination.totalPages || loading}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
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
