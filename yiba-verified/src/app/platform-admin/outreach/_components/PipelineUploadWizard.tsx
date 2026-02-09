"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Upload, FileSpreadsheet, CheckCircle, X, AlertTriangle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

// Types corresponding to Prisma models (simplified)
interface OutreachImportJob {
    id: string;
    status: "UPLOADED" | "VALIDATING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED";
    total_rows: number;
    processed_rows: number;
    valid_emails: number;
    invalid_emails: number;
    duplicate_in_file: number;
    already_exists_in_db: number;
    created_invites: number;
    failed_creates: number;
    processed_emails: number;
}

export function PipelineUploadWizard({ onSuccess, onCancel }: { onSuccess?: () => void, onCancel?: () => void }) {
    const router = useRouter();

    // Steps: 1=Upload, 2=Validating (Auto), 3=Review, 4=Importing, 5=Success
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [files, setFiles] = useState<File[]>([]);

    // Job State
    const [job, setJob] = useState<OutreachImportJob | null>(null);
    const [progress, setProgress] = useState(0);
    const pollingRef = useRef<NodeJS.Timeout | null>(null);

    // Keep job in ref for poll function to access current state if needed, 
    // BUT poll function receives job.id via closure if defined inside effect or if job is dependency.
    // Actually, defining poll inside component is fine, but we need to be careful about stale state.
    // The recursive approach depends on 'job' state. If 'job' changes, the function closes over old 'job'.
    // Better to pass ID to poll function or use a ref for job ID.
    const jobIdRef = useRef<string | null>(null);
    useEffect(() => { jobIdRef.current = job?.id || null; }, [job]);

    // Initial drag & drop setup
    const onDrop = useCallback((acceptedFiles: File[]) => {
        // Only accept one file for now to simplify job tracking
        if (acceptedFiles.length > 1) {
            toast.error("Please upload only one CSV file at a time.");
            setFiles([acceptedFiles[0]]);
        } else {
            setFiles(acceptedFiles);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'text/csv': ['.csv'] },
        multiple: false // Enforce single file in UI
    });

    const removeFile = () => {
        setFiles([]);
        setJob(null);
        setStep(1);
    };

    // --- ACTIONS ---

    // Step 1 -> 2: Upload & Create Job
    const uploadAndCreateJob = async () => {
        if (files.length === 0) return;
        setLoading(true);
        const file = files[0];

        try {
            // 1. Get Presigned URL
            const presignRes = await fetch("/api/platform-admin/outreach/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    filename: file.name,
                    contentType: file.type,
                    size: file.size
                })
            });
            const presignData = await presignRes.json();
            if (!presignRes.ok) throw new Error(presignData.error || "Failed to get upload URL");

            // 2. Upload to S3
            const uploadRes = await fetch(presignData.url, {
                method: "PUT",
                body: file,
                headers: { "Content-Type": file.type || "text/csv" }
            });
            if (!uploadRes.ok) throw new Error("Failed to upload file to storage");

            // 3. Create Job
            const createRes = await fetch("/api/platform-admin/outreach/jobs/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    filename: file.name,
                    s3Key: presignData.key
                })
            });
            const createData = await createRes.json();
            if (!createRes.ok) throw new Error(createData.error || "Failed to create import job");

            setJob(createData.job);
            setStep(2); // Move to validating
        } catch (err: any) {
            console.error("Upload error:", err);
            toast.error(err.message || "Upload failed");
        } finally {
            setLoading(false);
        }
    };

    // Poll Helper - Recursive Pattern
    const poll = async (action: 'VALIDATE' | 'IMPORT') => {
        const currentJobId = jobIdRef.current;
        if (!currentJobId) return;

        try {
            const res = await fetch(`/api/platform-admin/outreach/jobs/${currentJobId}/run`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action })
            });

            if (!res.ok) {
                const data = await res.json();
                console.error("Polling error:", data.error);
                // Retry after delay even on error, unless fatal?
                // For now, retry.
                pollingRef.current = setTimeout(() => poll(action), 2000);
                return;
            }

            const data = await res.json();
            setJob(data.job);
            setProgress(data.progress || 0);

            if (data.done) {
                if (action === 'VALIDATE') setStep(3); // Review
                if (action === 'IMPORT') setStep(5); // Success
            } else {
                // Continue polling
                pollingRef.current = setTimeout(() => poll(action), 1000);
            }
        } catch (err) {
            console.error("Polling network error:", err);
            // Retry on network error
            pollingRef.current = setTimeout(() => poll(action), 2000);
        }
    };

    // Effect: Trigger Polling when entering Step 2 or 4
    // We use a ref to track if multiple effects fire, though with dependency on step it should be stable.
    useEffect(() => {
        // Clear any existing timeout
        if (pollingRef.current) clearTimeout(pollingRef.current);

        if (step === 2 && job) {
            poll('VALIDATE');
        } else if (step === 4 && job) {
            poll('IMPORT');
        }

        return () => {
            if (pollingRef.current) clearTimeout(pollingRef.current);
        };
    }, [step, job?.id]); // Depend on job.id mainly

    // --- RENDER ---

    const StatsCard = ({ label, value, colorClass }: any) => (
        <div className={cn("p-4 rounded-xl border bg-card text-center flex-1", colorClass)}>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs uppercase font-medium opacity-80 mt-1">{label}</div>
        </div>
    );

    // 1. Upload
    if (step === 1) {
        return (
            <div className="bg-background rounded-lg border border-border shadow-xl flex flex-col h-[500px] max-h-[90vh] w-full overflow-hidden">
                <div className="px-6 py-4 border-b border-border bg-muted/30">
                    <h2 className="text-xl font-semibold">Upload Pipeline Data</h2>
                    <p className="text-sm text-muted-foreground mt-1">Import institutions via CSV file.</p>
                </div>

                <div className="flex-1 p-8 flex flex-col justify-center gap-6">
                    {files.length === 0 ? (
                        <div
                            {...getRootProps()}
                            className={cn(
                                "flex-1 border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-4 bg-muted/10 hover:bg-muted/30 hover:border-primary/50",
                                isDragActive ? "border-primary bg-primary/5" : "border-border"
                            )}
                        >
                            <input {...getInputProps()} />
                            <div className="p-4 bg-primary/10 rounded-full">
                                <Upload className="h-8 w-8 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-lg font-medium">Drag & drop CSV file</h3>
                                <p className="text-sm text-muted-foreground">or click to browse</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col justify-center items-center gap-4">
                            <div className="flex items-center gap-3 p-4 border rounded-lg bg-card shadow-sm w-full max-w-md">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded text-blue-600">
                                    <FileSpreadsheet className="h-6 w-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{files[0].name}</p>
                                    <p className="text-sm text-muted-foreground">{(files[0].size / 1024).toFixed(1)} KB</p>
                                </div>
                                <Button variant="ghost" size="icon" onClick={removeFile}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-border bg-muted/10 flex justify-end gap-3">
                    <Button variant="outline" onClick={onCancel}>Cancel</Button>
                    <Button onClick={uploadAndCreateJob} disabled={files.length === 0 || loading}>
                        {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</> : "Next"}
                    </Button>
                </div>
            </div>
        );
    }

    // 2. Validating (Progress)
    if (step === 2) {
        return (
            <div className="bg-background rounded-lg border border-border shadow-xl flex flex-col h-[500px] w-full p-8 items-center justify-center text-center">
                <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                <h2 className="text-xl font-semibold mb-2">Validating Data...</h2>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                    Processing {job?.total_rows || '...'} rows. Checking for duplicates and errors.
                </p>

                <div className="w-full max-w-md space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progress</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>
        );
    }

    // 3. Review
    if (step === 3 && job) {
        return (
            <div className="bg-background rounded-lg border border-border shadow-xl flex flex-col h-[600px] w-full">
                <div className="px-6 py-4 border-b border-border bg-muted/30 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-semibold">Review Import</h2>
                        <p className="text-sm text-muted-foreground">Validation Complete.</p>
                    </div>
                </div>

                <div className="flex-1 p-6 overflow-y-auto">
                    {/* Stats */}
                    <div className="flex gap-4 mb-6">
                        <StatsCard label="Total" value={job.total_rows} />
                        <StatsCard label="Valid" value={job.valid_emails} colorClass="bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900 text-green-700 dark:text-green-400" />
                        <StatsCard label="Invalid" value={job.invalid_emails} colorClass="bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900 text-red-700 dark:text-red-400" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900">
                            <h4 className="font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4" /> Duplicates in File
                            </h4>
                            <p className="text-2xl font-bold mt-2 text-amber-900 dark:text-amber-200">{job.duplicate_in_file}</p>
                            <p className="text-xs text-amber-700/80 mt-1">Rows that are duplicates of earlier rows in this file.</p>
                        </div>
                        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900">
                            <h4 className="font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-2">
                                <RefreshCw className="h-4 w-4" /> Already in DB
                            </h4>
                            <p className="text-2xl font-bold mt-2 text-blue-900 dark:text-blue-200">{job.already_exists_in_db}</p>
                            <p className="text-xs text-blue-700/80 mt-1">Leads that already exist in the system (will be skipped).</p>
                        </div>
                    </div>

                    <div className="bg-muted/30 p-4 rounded-lg text-sm text-muted-foreground">
                        <p>Only the <strong>{job.valid_emails}</strong> valid rows will be imported. Duplicates and invalid entries will be skipped.</p>
                    </div>
                </div>

                <div className="p-4 border-t border-border bg-muted/10 flex justify-end gap-3">
                    <Button variant="outline" onClick={onCancel}>Cancel</Button>
                    <Button
                        onClick={() => setStep(4)}
                        disabled={job.valid_emails === 0}
                        className="bg-primary min-w-[150px]"
                    >
                        Import {job.valid_emails} Leads
                    </Button>
                </div>
            </div>
        );
    }

    // 4. Importing (Progress)
    if (step === 4) {
        return (
            <div className="bg-background rounded-lg border border-border shadow-xl flex flex-col h-[500px] w-full p-8 items-center justify-center text-center">
                <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                <h2 className="text-xl font-semibold mb-2">Importing Leads...</h2>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                    Creating invitations and institutions. This may take a moment.
                </p>

                <div className="w-full max-w-md space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progress</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>
        );
    }

    // 5. Success
    if (step === 5 && job) {
        return (
            <div className="bg-background rounded-lg border border-border shadow-xl flex flex-col max-w-md mx-auto w-full overflow-hidden text-center">
                <div className="p-8 pb-6 flex flex-col items-center">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-300">
                        <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Import Complete!</h2>
                    <p className="text-muted-foreground mb-6">Pipeline has been updated.</p>

                    <div className="grid grid-cols-2 gap-3 w-full mb-6">
                        <div className="p-3 bg-muted/30 rounded-lg">
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{job.created_invites}</div>
                            <div className="text-xs uppercase font-medium text-muted-foreground">Created</div>
                        </div>
                        <div className="p-3 bg-muted/30 rounded-lg">
                            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{job.failed_creates}</div>
                            <div className="text-xs uppercase font-medium text-muted-foreground">Failed</div>
                        </div>
                    </div>

                    <Button onClick={() => { onSuccess?.(); router.refresh(); }} className="w-full mb-3" size="lg">
                        Done
                    </Button>
                </div>
            </div>
        );
    }

    return null;
}
