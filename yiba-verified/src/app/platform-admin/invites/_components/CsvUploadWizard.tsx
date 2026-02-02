"use client";

import { useState } from "react";
import Papa from "papaparse";
import { validateParsedCsv } from "@/lib/client-csv-validator";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea"; // Assuming exists or standard
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert } from "@/components/ui/alert";
import { Loader2, Upload, FileText, Check, ArrowRight, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Steps
// 1. Upload CSV
// 2. Review & Clean
// 3. Campaign Details
// 4. Confirm

export function CsvUploadWizard({ onSuccess }: { onSuccess?: () => void }) {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [validationResult, setValidationResult] = useState<any>(null);

    // Campaign Form
    const [campaignData, setCampaignData] = useState({
        name: "",
        audience_type: "INSTITUTION_ADMIN",
        subject: "",
        custom_message: "",
    });

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const processFile = async () => {
        if (!file) return;
        setLoading(true);

        // Client-side parsing with PapaParse
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                try {
                    console.log("CSV parsed locally:", results.meta);
                    // Use client-side validator
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

    const createCampaign = async () => {
        setLoading(true);
        try {
            // 1. Create Campaign
            const campRes = await fetch("/api/platform-admin/campaigns", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: campaignData.name,
                    audience_type: campaignData.audience_type,
                    subject: campaignData.subject,
                }),
            });

            if (!campRes.ok) {
                const errorData = await campRes.json();
                console.error("Campaign creation failed:", errorData);
                const errorMessage = errorData.error || "Failed to create campaign";
                const errorDetails = errorData.details ? ` (${JSON.stringify(errorData.details)})` : "";
                throw new Error(errorMessage + errorDetails);
            }
            const campaign = await campRes.json();

            // 2. Add Recipients in Batches
            // Only send valid ones
            const recipients = validationResult.valid.map((v: any) => ({
                email: v.email,
                first_name: v.first_name,
                last_name: v.last_name,
                organization_label: v.organization,
                domain: v.domain,
                role: v.role || campaignData.audience_type,
                physical_address: v.physical_address,
                accreditation_start_date: v.accreditation_start_date,
                accreditation_end_date: v.accreditation_end_date,
                programmes: v.programmes,
            }));

            const BATCH_SIZE = 5000;
            const totalRecipients = recipients.length;

            toast.loading(`Creating campaign and adding ${totalRecipients} recipients...`);

            for (let i = 0; i < totalRecipients; i += BATCH_SIZE) {
                const batch = recipients.slice(i, i + BATCH_SIZE);
                console.log(`Sending batch ${i / BATCH_SIZE + 1} of ${Math.ceil(totalRecipients / BATCH_SIZE)}, size: ${batch.length}`);

                const recRes = await fetch(`/api/platform-admin/campaigns/${campaign.campaign_id}/recipients`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ recipients: batch }),
                });

                if (!recRes.ok) {
                    const error = await recRes.json();
                    throw new Error(`Failed to add recipients (batch ${i}): ${error.error}`);
                }
            }

            toast.dismiss();
            toast.success(`Campaign created successfully with ${totalRecipients} recipients!`);
            if (onSuccess) onSuccess();

        } catch (error: any) {
            console.error("Campaign creation error:", error);
            toast.dismiss();
            toast.error(error.message || "Error creating campaign");
        } finally {
            setLoading(false);
        }
    };

    if (step === 1) {
        return (
            <Card>
                <CardContent className="pt-6 space-y-4">
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center hover:bg-muted/50 transition-colors">
                        <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">Upload Recipient List</h3>
                        <p className="text-sm text-muted-foreground mt-2">
                            Drag and drop your CSV file here, or click to browse.
                        </p>
                        <Input
                            type="file"
                            accept=".csv"
                            className="hidden"
                            id="csv-upload"
                            onChange={handleFileUpload}
                        />
                        <Button variant="secondary" className="mt-4" onClick={() => document.getElementById("csv-upload")?.click()}>
                            Browse Files
                        </Button>
                        {file && (
                            <div className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-primary">
                                <FileText className="h-4 w-4" />
                                {file.name}
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end">
                        <Button onClick={processFile} disabled={!file || loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Next: Review
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (step === 2 && validationResult) {
        return (
            <Card>
                <CardContent className="pt-6 space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-muted/50 rounded-lg text-center">
                            <div className="text-2xl font-bold text-foreground">{validationResult.stats.total_rows}</div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wide">Total Rows</div>
                        </div>
                        <div className="p-4 bg-green-500/10 rounded-lg text-center">
                            <div className="text-2xl font-bold text-green-600">{validationResult.stats.valid_count}</div>
                            <div className="text-xs text-green-600/80 uppercase tracking-wide">Valid Emails</div>
                        </div>
                        <div className="p-4 bg-red-500/10 rounded-lg text-center">
                            <div className="text-2xl font-bold text-red-600">{validationResult.stats.invalid_count}</div>
                            <div className="text-xs text-red-600/80 uppercase tracking-wide">Invalid</div>
                        </div>
                        <div className="p-4 bg-blue-500/10 rounded-lg text-center">
                            <div className="text-2xl font-bold text-blue-600">{validationResult.stats.unique_organizations}</div>
                            <div className="text-xs text-blue-600/80 uppercase tracking-wide">Unique Orgs</div>
                        </div>
                    </div>

                    <div className="max-h-[300px] overflow-auto border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Organization</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {validationResult.valid.slice(0, 50).map((row: any, i: number) => (
                                    <TableRow key={i}>
                                        <TableCell>{row.email}</TableCell>
                                        <TableCell>{row.organization}</TableCell>
                                        <TableCell>{row.phone_number || '-'}</TableCell>
                                        <TableCell><span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Valid</span></TableCell>
                                    </TableRow>
                                ))}
                                {validationResult.invalid.length > 0 && (
                                    <TableRow className="bg-red-50">
                                        <TableCell colSpan={4} className="text-center text-red-600 font-medium">
                                            + {validationResult.invalid.length} invalid rows excluded
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex justify-between">
                        <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                        <Button onClick={() => setStep(3)}>Next: Campaign Details</Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (step === 3) {
        return (
            <Card>
                <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                        <Label>Campaign Name</Label>
                        <Input
                            value={campaignData.name}
                            onChange={e => setCampaignData({ ...campaignData, name: e.target.value })}
                            placeholder="e.g. Q1 Institution Onboarding"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Audience Segment</Label>
                        <Select
                            value={campaignData.audience_type}
                            onValueChange={v => setCampaignData({ ...campaignData, audience_type: v })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="INSTITUTION_ADMIN">Institution Admin</SelectItem>
                                <SelectItem value="INSTITUTION_STAFF">Institution Staff</SelectItem>
                                <SelectItem value="STUDENT">Student</SelectItem>
                                <SelectItem value="QCTO_USER">QCTO User</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Email Subject</Label>
                        <Input
                            value={campaignData.subject}
                            onChange={e => setCampaignData({ ...campaignData, subject: e.target.value })}
                            placeholder="Welcome to Yiba Verified"
                        />
                    </div>

                    <div className="flex justify-between pt-4">
                        <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                        <Button onClick={createCampaign} disabled={loading || !campaignData.name}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create & Queue ({validationResult?.stats.valid_count} recipients)
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return null;
}
