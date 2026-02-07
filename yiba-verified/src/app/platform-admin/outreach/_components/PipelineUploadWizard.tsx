"use client";

import { useState } from "react";
import Papa from "papaparse";
import { validateParsedCsv } from "@/lib/client-csv-validator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { EngagementState } from "@/lib/outreach/types";

export function PipelineUploadWizard({ onSuccess }: { onSuccess?: () => void }) {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [validationResult, setValidationResult] = useState<any>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const processFile = async () => {
        if (!file) return;
        setLoading(true);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                try {
                    const validation = validateParsedCsv(results.data);
                    setValidationResult(validation);
                    setStep(2);
                } catch (error) {
                    console.error("Local CSV processing error:", error);
                    toast.error("Failed to process CSV file");
                } finally {
                    setLoading(false);
                }
            },
            error: (error) => {
                console.error("PapaParse error:", error);
                toast.error("Failed to parse CSV file");
                setLoading(false);
            }
        });
    };

    const importLeads = async () => {
        if (!validationResult) return;
        setLoading(true);

        try {
            const leads = validationResult.valid.map((v: any) => ({
                institution_name: v.organization,
                domain: v.domain,
                contacts: [{
                    email: v.email,
                    first_name: v.first_name,
                    last_name: v.last_name,
                    role: v.role,
                    phone: v.phone_number
                }],
                // Map other available fields if the backend supports them
                physical_address: v.physical_address,
                programmes: v.programmes,
                accreditation_start_date: v.accreditation_start_date,
                accreditation_end_date: v.accreditation_end_date,
                initial_stage: EngagementState.AWARENESS // Default starting stage
            }));

            const BATCH_SIZE = 100; // Smaller batch size for safety
            const totalLeads = leads.length;

            toast.loading(`Importing ${totalLeads} leads into pipeline...`);

            let successCount = 0;
            let failCount = 0;

            for (let i = 0; i < totalLeads; i += BATCH_SIZE) {
                const batch = leads.slice(i, i + BATCH_SIZE);

                try {
                    const res = await fetch("/api/platform-admin/outreach/institutions", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ leads: batch, source: "CSV_UPLOAD" }),
                    });

                    if (!res.ok) {
                        const error = await res.json();
                        console.error(`Batch ${i / BATCH_SIZE + 1} failed:`, error);
                        failCount += batch.length;
                        // Continue to next batch? or stop? Let's continue but warn.
                    } else {
                        const data = await res.json();
                        successCount += (data.count || batch.length);
                    }
                } catch (err) {
                    console.error(`Batch failure:`, err);
                    failCount += batch.length;
                }
            }

            toast.dismiss();

            if (failCount > 0) {
                toast.warning(`Imported ${successCount} leads. ${failCount} failed.`);
            } else {
                toast.success(`Successfully imported ${successCount} leads to pipeline!`);
            }

            if (onSuccess) onSuccess();
            router.refresh(); // Refresh server components if any

        } catch (error: any) {
            console.error("Import error:", error);
            toast.dismiss();
            toast.error(error.message || "Error importing leads");
        } finally {
            setLoading(false);
        }
    };

    if (step === 1) {
        return (
            <Card className="border-0 shadow-lg bg-background/60 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>Upload Pipeline CSV</CardTitle>
                    <CardDescription>
                        Upload a CSV file containing institution and contact details.
                        <br />Required columns: Email, Organization/Company (or domain inferred)
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div
                        className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-12 text-center hover:bg-accent/50 transition-all duration-300 cursor-pointer group"
                        onClick={() => document.getElementById("csv-upload")?.click()}
                    >
                        <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                            <Upload className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">Click to Upload or Drag File</h3>
                        <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                            Supported format: .csv
                        </p>
                        <Input
                            type="file"
                            accept=".csv"
                            className="hidden"
                            id="csv-upload"
                            onChange={handleFileUpload}
                        />
                        {file && (
                            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium animate-in fade-in slide-in-from-bottom-2">
                                <FileText className="h-4 w-4" />
                                {file.name}
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end pt-4">
                        <Button onClick={processFile} disabled={!file || loading} className="min-w-[120px]">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {loading ? "Processing..." : "Next: Verify"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (step === 2 && validationResult) {
        return (
            <Card className="border-0 shadow-lg bg-background/60 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>Review Data</CardTitle>
                    <CardDescription>
                        Verify the parsed data before importing.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-background/50 border rounded-xl text-center shadow-sm">
                            <div className="text-3xl font-bold text-foreground">{validationResult.stats.total_rows}</div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wide font-medium mt-1">Total Rows</div>
                        </div>
                        <div className="p-4 bg-green-500/10 border-green-200/20 border rounded-xl text-center shadow-sm">
                            <div className="text-3xl font-bold text-green-600 dark:text-green-400">{validationResult.stats.valid_count}</div>
                            <div className="text-xs text-green-600/80 dark:text-green-400/80 uppercase tracking-wide font-medium mt-1">Valid Emails</div>
                        </div>
                        <div className="p-4 bg-amber-500/10 border-amber-200/20 border rounded-xl text-center shadow-sm">
                            <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">{validationResult.stats.duplicate_count}</div>
                            <div className="text-xs text-amber-600/80 dark:text-amber-400/80 uppercase tracking-wide font-medium mt-1">Duplicates</div>
                        </div>
                        <div className="p-4 bg-red-500/10 border-red-200/20 border rounded-xl text-center shadow-sm">
                            <div className="text-3xl font-bold text-red-600 dark:text-red-400">{validationResult.stats.invalid_count}</div>
                            <div className="text-xs text-red-600/80 dark:text-red-400/80 uppercase tracking-wide font-medium mt-1">Invalid</div>
                        </div>
                    </div>

                    <div className="max-h-[400px] overflow-auto border rounded-xl bg-background/50">
                        <Table>
                            <TableHeader className="bg-muted/50 sticky top-0 backdrop-blur-sm">
                                <TableRow>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Organization</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {validationResult.valid.slice(0, 100).map((row: any, i: number) => (
                                    <TableRow key={`valid-${i}`}>
                                        <TableCell className="font-medium">{row.email}</TableCell>
                                        <TableCell>{row.organization}</TableCell>
                                        <TableCell>{row.role || <span className="text-muted-foreground italic">Unknown</span>}</TableCell>
                                        <TableCell>
                                            <div className="inline-flex items-center text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">
                                                <CheckCircle className="w-3 h-3 mr-1" /> Valid
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {validationResult.invalid.slice(0, 50).map((item: any, i: number) => (
                                    <TableRow key={`invalid-${i}`} className="bg-red-50/50 dark:bg-red-900/10">
                                        <TableCell className="text-muted-foreground">{item.row.email || 'Missing Email'}</TableCell>
                                        <TableCell className="text-muted-foreground">{item.row.organization}</TableCell>
                                        <TableCell colSpan={2} className="text-red-600 dark:text-red-400 text-sm">
                                            <div className="flex items-center">
                                                <AlertCircle className="w-4 h-4 mr-1" />
                                                {item.reason}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex justify-between pt-4">
                        <Button variant="outline" onClick={() => setStep(1)} disabled={loading}>Back</Button>
                        <Button onClick={importLeads} disabled={loading || validationResult.stats.valid_count === 0} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Import {validationResult.stats.valid_count} Leads
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return null;
}
