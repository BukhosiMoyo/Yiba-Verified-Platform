"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Calendar as CalendarIcon, ChevronRight, Check, Clock } from "lucide-react";
import { createQctoRequest } from "@/app/qcto/requests/actions";
import { SearchableSelect } from "@/components/shared/SearchableSelect";

type Step = 1 | 2 | 3 | 4;

const REQUEST_TYPES = [
    { value: "DOCUMENTS", label: "Documents", description: "Request specific policies, reports, or evidence files." },
    { value: "ATTENDANCE", label: "Attendance", description: "Request attendance registers for specific cohorts/dates." },
    { value: "ENROLMENTS", label: "Enrolments", description: "Request enrolment data and learner lists." },
    { value: "ASSESSMENT_RESULTS", label: "Assessment Results", description: "Request marks and assessment outcomes." },
    { value: "READINESS_CLARIFICATION", label: "Readiness Clarification", description: "Ask for more info regarding a readiness review." },
    { value: "CUSTOM", label: "Custom Request", description: "Free-form request." },
];

const DEADLINE_PRESETS = [
    { label: "24 Hours", value: 1 },
    { label: "7 Days", value: 7 },
    { label: "14 Days", value: 14 },
    { label: "30 Days", value: 30 },
];

export function CreateQctoRequestDialog({
    trigger,
    preselectedInstitutionId
}: {
    trigger?: React.ReactNode;
    preselectedInstitutionId?: string;
}) {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<Step>(1);
    const [loading, setLoading] = useState(false);

    // Form State
    const [institutionId, setInstitutionId] = useState(preselectedInstitutionId || "");
    const [type, setType] = useState<string>("DOCUMENTS");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");

    // Deadline
    const [deadlineData, setDeadlineData] = useState<{
        type: "preset" | "custom";
        days?: number;
        date?: string;
    }>({ type: "preset", days: 7 });

    // Config (Dynamic)
    const [config, setConfig] = useState<any>({});

    // Institution Search (Mock for now, should use async search)
    // implementing basic placeholder navigation for fetching institutions would be needed
    // For v1, we assume we might need to input ID or select from a dropdown if fetched.

    const handleNext = () => {
        if (step === 1 && !institutionId) {
            toast.error("Please select an institution");
            return;
        }
        if (step === 1 && !title) {
            // Auto-generate title if empty based on type? 
            // Or force user. existing requirement says "Title + description" for CUSTOM.
            if (type === "CUSTOM" && !title) {
                toast.error("Title is required for custom requests");
                return;
            }
            if (!title) setTitle(`${REQUEST_TYPES.find(t => t.value === type)?.label} Request`);
        }
        setStep((s) => Math.min(s + 1, 4) as Step);
    };

    const handleBack = () => setStep((s) => Math.max(s - 1, 1) as Step);

    const calculateDueDate = () => {
        if (deadlineData.type === "custom" && deadlineData.date) {
            return new Date(deadlineData.date);
        }
        if (deadlineData.type === "preset" && deadlineData.days) {
            const d = new Date();
            d.setDate(d.getDate() + deadlineData.days);
            return d;
        }
        // Default 7 days
        const d = new Date();
        d.setDate(d.getDate() + 7);
        return d;
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const dueAt = calculateDueDate();

            const res = await createQctoRequest({
                institution_id: institutionId,
                title,
                description,
                type: type as any,
                due_at: dueAt,
                config_json: config,
            });

            if (res.success) {
                toast.success("Request sent successfully");
                setOpen(false);
                // Reset state
                setStep(1);
                setTitle("");
                setDescription("");
                setConfig({});
                if (!preselectedInstitutionId) setInstitutionId("");
            } else {
                toast.error(res.error || "Failed");
            }
        } catch (e) {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button>Create Request</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>New QCTO Request {step > 1 && `(Step ${step}/4)`}</DialogTitle>
                    <DialogDescription>Request information or evidence from an institution.</DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {/* STEP 1: BASICS */}
                    {step === 1 && (
                        <div className="space-y-4">
                            {!preselectedInstitutionId && (
                                <div className="space-y-2">
                                    <Label>Institution ID</Label>
                                    <Input
                                        value={institutionId}
                                        onChange={e => setInstitutionId(e.target.value)}
                                        placeholder="Enter Institution ID (or use Select later)"
                                    />
                                    {/* Reuse SearchableSelect here properly in real implementation */}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>Request Type</Label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {REQUEST_TYPES.map((t) => (
                                        <div
                                            key={t.value}
                                            onClick={() => setType(t.value)}
                                            className={`cursor-pointer border rounded-lg p-3 hover:bg-muted/50 transition-all ${type === t.value ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border"
                                                }`}
                                        >
                                            <div className="font-semibold text-sm">{t.label}</div>
                                            <div className="text-xs text-muted-foreground">{t.description}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Title</Label>
                                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Q1 Attendance Audit" />
                            </div>
                        </div>
                    )}

                    {/* STEP 2: DETAILS/CONFIG */}
                    {step === 2 && (
                        <div className="space-y-4">
                            {type === "DOCUMENTS" && (
                                <div className="space-y-3">
                                    <Label>Requested Document Types</Label>
                                    <div className="space-y-2">
                                        {["Registration Proof", "Tax Compliance PIN", "OHS Policy", "Learner Agreements"].map(docType => (
                                            <div key={docType} className="flex items-center space-x-2">
                                                <Switch
                                                    checked={config.docTypes?.includes(docType)}
                                                    onCheckedChange={(checked) => {
                                                        const current = config.docTypes || [];
                                                        setConfig({
                                                            ...config,
                                                            docTypes: checked
                                                                ? [...current, docType]
                                                                : current.filter((d: string) => d !== docType)
                                                        });
                                                    }}
                                                />
                                                <Label>{docType}</Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {type === "ATTENDANCE" && (
                                <div className="space-y-3">
                                    <Label>Date Range</Label>
                                    <div className="flex gap-2">
                                        <Input type="date" onChange={e => setConfig({ ...config, startDate: e.target.value })} />
                                        <span className="self-center">to</span>
                                        <Input type="date" onChange={e => setConfig({ ...config, endDate: e.target.value })} />
                                    </div>
                                    <Label>Enrolment/Group (Optional)</Label>
                                    <Input placeholder="Enter Qualification or Group ID" onChange={e => setConfig({ ...config, targetId: e.target.value })} />
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>Description / Instructions</Label>
                                <Textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="Provide detailed instructions for the institution..."
                                    rows={4}
                                />
                            </div>
                        </div>
                    )}

                    {/* STEP 3: DEADLINE */}
                    {step === 3 && (
                        <div className="space-y-4">
                            <Label>Response Deadline</Label>
                            <div className="grid grid-cols-2 gap-2">
                                {DEADLINE_PRESETS.map(preset => (
                                    <Button
                                        key={preset.value}
                                        variant={deadlineData.type === 'preset' && deadlineData.days === preset.value ? "default" : "outline"}
                                        onClick={() => setDeadlineData({ type: 'preset', days: preset.value })}
                                        className="justify-start"
                                    >
                                        <Clock className="w-4 h-4 mr-2" />
                                        {preset.label}
                                    </Button>
                                ))}
                                <Button
                                    variant={deadlineData.type === 'custom' ? "default" : "outline"}
                                    onClick={() => setDeadlineData({ type: 'custom', date: '' })}
                                    className="justify-start col-span-2 sm:col-span-1"
                                >
                                    <CalendarIcon className="w-4 h-4 mr-2" />
                                    Custom Date
                                </Button>
                            </div>

                            {deadlineData.type === 'custom' && (
                                <Input
                                    type="date"
                                    value={deadlineData.date}
                                    onChange={e => setDeadlineData({ type: 'custom', date: e.target.value })}
                                    className="mt-2"
                                />
                            )}

                            <div className="bg-muted p-3 rounded-md text-sm mt-4">
                                <strong>Due Date:</strong> {calculateDueDate().toDateString()}
                            </div>
                        </div>
                    )}

                    {/* STEP 4: REVIEW */}
                    {step === 4 && (
                        <div className="space-y-4 text-sm">
                            <div className="grid grid-cols-3 gap-2 border-b pb-2">
                                <span className="text-muted-foreground">Type</span>
                                <span className="col-span-2 font-medium">{REQUEST_TYPES.find(t => t.value === type)?.label}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 border-b pb-2">
                                <span className="text-muted-foreground">Title</span>
                                <span className="col-span-2 font-medium">{title}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 border-b pb-2">
                                <span className="text-muted-foreground">Due</span>
                                <span className="col-span-2 font-medium">{calculateDueDate().toDateString()}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <span className="text-muted-foreground">Description</span>
                                <div className="col-span-2 whitespace-pre-wrap">{description || "—"}</div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex justify-between sm:justify-between">
                    {step > 1 ? (
                        <Button variant="outline" onClick={handleBack} disabled={loading}>Back</Button>
                    ) : (
                        <div></div> // Spacer
                    )}

                    {step < 4 ? (
                        <Button onClick={handleNext}>
                            Next <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    ) : (
                        <Button onClick={handleSubmit} disabled={loading}>
                            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Send Request
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
