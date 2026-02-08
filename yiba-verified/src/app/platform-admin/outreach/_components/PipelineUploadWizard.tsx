"use client";

import { useState, useCallback, useEffect } from "react";
import Papa from "papaparse";
import { useDropzone } from "react-dropzone";
import { validateParsedCsv } from "@/lib/client-csv-validator";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Upload, FileSpreadsheet, CheckCircle, X, Sparkles, Filter } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { EngagementState } from "@/lib/outreach/types";
import { cn } from "@/lib/utils";
import { checkDuplicates } from "../actions";

export function PipelineUploadWizard({ onSuccess, onCancel }: { onSuccess?: () => void, onCancel?: () => void }) {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [cleaning, setCleaning] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [activeTab, setActiveTab] = useState<'all' | 'valid' | 'invalid' | 'duplicates'>('all');

    // Store data in a more unified way to allow easy filtering/updates
    const [validationResults, setValidationResults] = useState<{
        valid: any[];
        invalid: any[];
        stats: { total_rows: number; valid_count: number; invalid_count: number; duplicate_count: number };
    } | null>(null);
    const [importStats, setImportStats] = useState<{ success: number; failed: number } | null>(null);

    // DB Check State
    const [dbCheckMetrics, setDbCheckMetrics] = useState<{ existing: number, new: number } | null>(null);
    const [checkingDb, setCheckingDb] = useState(false);

    // Initial drag & drop setup
    const onDrop = useCallback((acceptedFiles: File[]) => {
        setFiles(prev => [...prev, ...acceptedFiles]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'text/csv': ['.csv'] },
        multiple: true
    });

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const processFiles = async () => {
        if (files.length === 0) return;
        setLoading(true);

        let allValid: any[] = [];
        let allInvalid: any[] = [];
        let totalRows = 0;

        try {
            // Process all files
            const promises = files.map(file => {
                return new Promise<void>((resolve, reject) => {
                    Papa.parse(file, {
                        header: true,
                        skipEmptyLines: true,
                        complete: (results) => {
                            const validation = validateParsedCsv(results.data);
                            allValid = [...allValid, ...validation.valid];
                            allInvalid = [...allInvalid, ...validation.invalid];
                            totalRows += (results.data.length);
                            resolve();
                        },
                        error: (err) => reject(err)
                    });
                });
            });

            await Promise.all(promises);

            setValidationResults({
                valid: allValid,
                invalid: allInvalid,
                stats: {
                    total_rows: totalRows,
                    valid_count: allValid.length,
                    invalid_count: allInvalid.length,
                    duplicate_count: allValid.filter((v: any) => v.isDuplicate).length
                }
            });
            setStep(2);
        } catch (error) {
            console.error("CSV processing error:", error);
            toast.error("Failed to process files");
        } finally {
            setLoading(false);
        }
    };



    // Check DB for potential duplicates when reaching step 2
    useEffect(() => {
        if (step === 2 && validationResults?.valid && validationResults.valid.length > 0 && !dbCheckMetrics && !checkingDb) {
            const runCheck = async () => {
                setCheckingDb(true);
                try {
                    const BATCH_SIZE = 500;
                    const allRows = validationResults.valid;
                    let totalExisting = 0;
                    let totalNew = 0;

                    for (let i = 0; i < allRows.length; i += BATCH_SIZE) {
                        const batch = allRows.slice(i, i + BATCH_SIZE);
                        const metrics = await checkDuplicates(batch);
                        totalExisting += metrics.existingCount;
                        totalNew += metrics.newCount;
                    }

                    setDbCheckMetrics({ existing: totalExisting, new: totalNew });

                    // Force re-render of stats if import button is disabled improperly? 
                    // No, state update handles it.
                } catch (error) {
                    console.error("Failed to check DB:", error);
                } finally {
                    setCheckingDb(false);
                }
            };
            runCheck();
        }
    }, [step, validationResults, checkingDb, dbCheckMetrics]);

    // Reset DB metrics when file changes or going back to step 1
    useEffect(() => {
        if (step === 1) {
            setDbCheckMetrics(null);
        }
    }, [step]);

    const importLeads = async () => {
        if (!validationResults) return;
        setLoading(true);
        setProgress(0);

        try {
            const leads = validationResults.valid.map((v: any) => ({
                institution_name: v.organization,
                domain: v.domain || '',
                contacts: [{
                    email: v.email,
                    first_name: v.first_name || '',
                    last_name: v.last_name || '',
                    role: v.role || 'Admin',
                    phone: v.phone_number || ''
                }],
                physical_address: v.physical_address || '',
                programmes: v.programmes || [],
                accreditation_start_date: v.accreditation_start_date,
                accreditation_end_date: v.accreditation_end_date,
                initial_stage: EngagementState.UNCONTACTED,
                // Pass raw fields for internal use if needed
                ...v
            }));

            // Reduced batch size to 200 to prevent server timeouts (Vercel 10s-60s limit)
            const BATCH_SIZE = 200;
            const totalLeads = leads.length;

            let successCount = 0;
            let failCount = 0;
            let processed = 0;

            for (let i = 0; i < totalLeads; i += BATCH_SIZE) {
                const batch = leads.slice(i, i + BATCH_SIZE);
                try {
                    const res = await fetch("/api/platform-admin/outreach/institutions", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ leads: batch, source: "CSV_UPLOAD" }),
                    });

                    const data = await res.json();
                    if (!res.ok) {
                        console.error(`Batch failed [${res.status} ${res.statusText}]:`, data);
                        failCount += batch.length;
                    } else {
                        successCount += (data.count || 0);
                    }
                } catch (err) {
                    console.error(`Batch connection failure:`, err);
                    failCount += batch.length;
                }

                processed += batch.length;
                setProgress(Math.round((processed / totalLeads) * 100));
            }

            setImportStats({ success: successCount, failed: failCount });
            setStep(3);
            router.refresh();

        } catch (error: any) {
            console.error("Import error:", error);
            toast.error(error.message || "Error importing leads");
        } finally {
            setLoading(false);
            setProgress(0);
        }
    };


    const handleClose = () => {
        if (onSuccess) onSuccess();
    };

    // Filter Logic
    const getFilteredRows = () => {
        if (!validationResults) return [];
        switch (activeTab) {
            case 'valid': return validationResults.valid;
            case 'invalid': return validationResults.invalid;
            case 'duplicates': return validationResults.valid.filter(v => v.isDuplicate);
            default: return [...validationResults.valid, ...validationResults.invalid];
        }
    };

    const filteredRows = getFilteredRows();

    // --- RENDER STEPS ---

    // 1. UPLOAD STEP
    if (step === 1) {
        return (
            <div className="bg-background rounded-lg border border-border shadow-xl flex flex-col h-[600px] max-h-[90vh] w-full overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
                    <div>
                        <h2 className="text-xl font-semibold">Upload Pipeline Data</h2>
                        <p className="text-sm text-muted-foreground mt-1">Import institutions and contacts via CSV.</p>
                    </div>
                    {onCancel && (
                        <Button variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8 rounded-full hover:bg-muted">
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6">
                    {/* Dropzone */}
                    <div
                        {...getRootProps()}
                        className={cn(
                            "border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-4 bg-muted/10 hover:bg-muted/30 hover:border-primary/50 outline-none",
                            isDragActive ? "border-primary bg-primary/5" : "border-border"
                        )}
                    >
                        <input {...getInputProps()} />
                        <div className="p-4 bg-primary/10 rounded-full">
                            <Upload className="h-8 w-8 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-lg font-medium">Drag & drop CSV files here</h3>
                            <p className="text-sm text-muted-foreground">or click to browse from your computer</p>
                        </div>
                        <p className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                            Supports multiple .csv files
                        </p>
                    </div>

                    {/* File List */}
                    {files.length > 0 && (
                        <div className="space-y-3">
                            <div className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                                <span>Selected Files ({files.length})</span>
                                <Button variant="ghost" size="sm" onClick={() => setFiles([])} className="h-auto p-0 text-xs text-destructive hover:text-destructive">
                                    Clear All
                                </Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {files.map((file, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 border rounded-lg bg-card shadow-sm animate-in fade-in slide-in-from-bottom-2">
                                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded text-blue-600">
                                            <FileSpreadsheet className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{file.name}</p>
                                            <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); removeFile(i); }}>
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border bg-muted/10 flex justify-end gap-3">
                    <Button variant="outline" onClick={onCancel}>Cancel</Button>
                    <Button onClick={processFiles} disabled={files.length === 0 || loading} className="min-w-[100px]">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {loading ? "Processing..." : "Next"}
                    </Button>
                </div>
            </div>
        );
    }

    // 2. REVIEW STEP
    if (step === 2 && validationResults) {
        return (
            <div className="bg-background rounded-lg border border-border shadow-xl flex flex-col h-[700px] max-h-[90vh] w-full overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
                    <div>
                        <h2 className="text-xl font-semibold">Review Data</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            {checkingDb ? <span className="flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> Checking database for existing records...</span> :
                                dbCheckMetrics ?
                                    (dbCheckMetrics.existing > 0 ?
                                        `Found ${dbCheckMetrics.new} new leads to import (${dbCheckMetrics.existing} already exist).` :
                                        `Found ${validationResults.stats.valid_count} new leads to import.`)
                                    : `Found ${validationResults.stats.valid_count} valid entries.`}
                        </p>
                    </div>
                </div>

                <div className="flex-1 p-6 overflow-hidden flex flex-col gap-6">
                    {validationResults.stats.duplicate_count > 0 && (
                        <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg flex items-start gap-3 text-sm text-orange-800 dark:text-orange-200 shrink-0">
                            <div className="mt-0.5 font-bold">⚠️</div>
                            <div>
                                <span className="font-semibold">{validationResults.stats.duplicate_count} duplicate rows found.</span>
                                <p className="text-xs opacity-90 mt-0.5">
                                    These duplicates have been automatically skipped to prevent errors. Only {validationResults.stats.valid_count} unique valid rows will be imported.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Stats & Actions */}
                    <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-4 gap-4">
                            <div className="p-4 rounded-xl border bg-card text-center">
                                <div className="text-2xl font-bold">{validationResults.stats.total_rows}</div>
                                <div className="text-xs text-muted-foreground uppercase font-medium mt-1">Total Rows</div>
                            </div>
                            <div className="p-4 rounded-xl border bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/50 text-center">
                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{validationResults.stats.valid_count}</div>
                                <div className="text-xs text-green-600/80 uppercase font-medium mt-1">Valid</div>
                            </div>
                            <div className="p-4 rounded-xl border bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/50 text-center">
                                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{validationResults.stats.invalid_count}</div>
                                <div className="text-xs text-red-600/80 uppercase font-medium mt-1">Invalid</div>
                            </div>
                            <div className="p-4 rounded-xl border bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/50 text-center">
                                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{validationResults.stats.duplicate_count || 0}</div>
                                <div className="text-xs text-amber-600/80 uppercase font-medium mt-1">Duplicates</div>
                            </div>
                        </div>

                        {/* Toolbar */}
                        <div className="flex items-center justify-between">
                            <div className="flex p-1 bg-muted rounded-lg w-fit">
                                <button
                                    onClick={() => setActiveTab('all')}
                                    className={cn("px-3 py-1.5 text-sm font-medium rounded-md transition-all", activeTab === 'all' ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => setActiveTab('valid')}
                                    className={cn("px-3 py-1.5 text-sm font-medium rounded-md transition-all", activeTab === 'valid' ? "bg-background shadow-sm text-green-600" : "text-muted-foreground hover:text-foreground")}
                                >
                                    Valid
                                </button>
                                <button
                                    onClick={() => setActiveTab('invalid')}
                                    className={cn("px-3 py-1.5 text-sm font-medium rounded-md transition-all", activeTab === 'invalid' ? "bg-background shadow-sm text-red-600" : "text-muted-foreground hover:text-foreground")}
                                >
                                    Invalid
                                </button>
                                <button
                                    onClick={() => setActiveTab('duplicates')}
                                    className={cn("px-3 py-1.5 text-sm font-medium rounded-md transition-all", activeTab === 'duplicates' ? "bg-background shadow-sm text-amber-600" : "text-muted-foreground hover:text-foreground")}
                                >
                                    Duplicates
                                </button>
                            </div>

                            {validationResults.invalid.length > 0 && (
                                <div className="text-xs text-muted-foreground italic">
                                    {validationResults.invalid.length} invalid rows found.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Table */}
                    <div className="border border-border rounded-lg overflow-hidden flex-1 flex flex-col">
                        <div className="flex-1 overflow-auto max-h-[400px]">
                            <Table>
                                <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                                    <TableRow>
                                        <TableHead className="w-[30%]">Email</TableHead>
                                        <TableHead className="w-[30%]">Organization</TableHead>
                                        <TableHead className="w-[20%]">Role</TableHead>
                                        <TableHead className="w-[20%]">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredRows.slice(0, 100).map((row: any, i: number) => {
                                        const isInvalid = !row.email || !row.organization || (row.row && row.reason); // simplistic check mapping
                                        // our `filteredRows` is mixed types (valid row vs {row, reason}). Normalizer:
                                        const data = row.row || row;
                                        const reason = row.reason;

                                        return (
                                            <TableRow key={i} className={cn("h-10", reason ? "bg-red-50/50 dark:bg-red-900/10" : "")}>
                                                <TableCell className="py-2 font-medium truncate max-w-[200px]" title={data.email}>
                                                    {data.email || <span className="text-red-400 italic">Missing</span>}
                                                </TableCell>
                                                <TableCell className="py-2 truncate max-w-[200px]" title={data.organization}>{data.organization}</TableCell>
                                                <TableCell className="py-2 truncate">{data.role || '-'}</TableCell>
                                                <TableCell className="py-2">
                                                    {reason ? (
                                                        <span className="text-xs text-red-600 font-medium">{reason}</span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                            Valid
                                                        </span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {filteredRows.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                                No rows found for this filter.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        {filteredRows.length > 100 && (
                            <div className="p-2 text-center text-xs text-muted-foreground bg-muted/20 border-t border-border">
                                Showing first 100 of {filteredRows.length} entries...
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-border bg-muted/10 flex justify-between gap-3">
                    {loading ? (
                        <div className="flex-1 flex flex-col justify-center gap-2 px-4">
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Importing...</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-all duration-300 ease-out"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex-1 flex items-center gap-4 text-xs text-muted-foreground">
                                <div>
                                    <span className="font-semibold text-foreground">{validationResults.stats.total_rows}</span> Total
                                </div>
                                <div className="h-3 w-px bg-border" />
                                <div className="text-green-600 dark:text-green-400">
                                    <span className="font-semibold">{validationResults.stats.valid_count}</span> Valid
                                </div>
                                {validationResults.stats.duplicate_count > 0 && (
                                    <>
                                        <div className="h-3 w-px bg-border" />
                                        <div className="text-orange-600 dark:text-orange-400">
                                            <span className="font-semibold">{validationResults.stats.duplicate_count}</span> Duplicates (Skipped)
                                        </div>
                                    </>
                                )}
                                {validationResults.stats.invalid_count > 0 && (
                                    <>
                                        <div className="h-3 w-px bg-border" />
                                        <div className="text-red-600 dark:text-red-400">
                                            <span className="font-semibold">{validationResults.stats.invalid_count}</span> Invalid
                                        </div>
                                    </>
                                )}
                            </div>
                            <Button variant="outline" onClick={() => setStep(1)} disabled={loading}>Back</Button>
                            <div className="flex gap-2">
                                <Button variant="ghost" onClick={onCancel}>Cancel</Button>
                                <Button
                                    onClick={importLeads}
                                    disabled={loading || validationResults.stats.valid_count === 0 || checkingDb}
                                    className="bg-primary text-primary-foreground min-w-[180px]"
                                >
                                    {checkingDb ? <Loader2 className="h-4 w-4 animate-spin" /> :
                                        dbCheckMetrics ? `Import ${dbCheckMetrics.new} New Leads` :
                                            `Import ${validationResults.stats.valid_count} Leads`}
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    }

    // 3. SUCCESS STEP
    if (step === 3 && importStats) {
        return (
            <div className="bg-background rounded-lg border border-border shadow-xl flex flex-col max-w-md mx-auto w-full overflow-hidden text-center">
                <div className="p-8 pb-6 flex flex-col items-center">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-300">
                        <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Import Complete!</h2>
                    <p className="text-muted-foreground mb-6">Pipeline has been updated with new leads.</p>

                    <div className="grid grid-cols-2 gap-3 w-full mb-6">
                        <div className="p-3 bg-muted/30 rounded-lg">
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{importStats.success}</div>
                            <div className="text-xs uppercase font-medium text-muted-foreground">Successful</div>
                        </div>
                        <div className="p-3 bg-muted/30 rounded-lg">
                            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{importStats.failed}</div>
                            <div className="text-xs uppercase font-medium text-muted-foreground">Failed</div>
                        </div>
                    </div>

                    <Button onClick={handleClose} className="w-full mb-3" size="lg">
                        Done
                    </Button>
                    <Button variant="ghost" onClick={() => {
                        setStep(1);
                        setFiles([]);
                        setValidationResults(null);
                        setImportStats(null);
                    }} className="w-full">
                        Import More
                    </Button>
                </div>
            </div>
        );
    }

    return null;
}
