"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format, addDays } from "date-fns";
import {
    CheckCircle2,
    ChevronRight,
    ClipboardCheck,
    Loader2,
    Calendar as CalendarIcon,
    GraduationCap
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { type DateRange } from "react-day-picker";

// Types
type SubmissionItemType = "ATTENDANCE" | "ENROLMENTS" | "ASSESSMENT_RESULTS" | "LEARNER_LIST" | "OTHER";

interface WizardState {
    step: number;
    title: string;
    selectedTypes: Set<SubmissionItemType>;
    config: {
        attendance?: {
            cohortId: string;
            dateRange: DateRange | undefined;
        };
    };
}

interface Cohort {
    cohort_id: string;
    name: string;
    qualification: { code: string; name: string };
}

export function CreateSubmissionWizard() {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [cohorts, setCohorts] = useState<Cohort[]>([]);

    // Wizard State
    const [state, setState] = useState<WizardState>({
        step: 1,
        title: "",
        selectedTypes: new Set(),
        config: {
            attendance: {
                cohortId: "",
                dateRange: {
                    from: addDays(new Date(), -30),
                    to: new Date(),
                },
            },
        },
    });

    // Fetch Cohorts on mount
    useEffect(() => {
        const fetchCohorts = async () => {
            try {
                const res = await fetch("/api/institution/cohorts");
                if (res.ok) {
                    const data = await res.json();
                    setCohorts(data);
                }
            } catch (e) {
                console.error("Failed to fetch cohorts", e);
            }
        };
        fetchCohorts();
    }, []);

    // Handlers
    const toggleType = (type: SubmissionItemType) => {
        const next = new Set(state.selectedTypes);
        if (next.has(type)) next.delete(type);
        else next.add(type);
        setState(prev => ({ ...prev, selectedTypes: next }));
    };

    const updateAttendanceConfig = (key: string, value: any) => {
        setState(prev => ({
            ...prev,
            config: {
                ...prev.config,
                attendance: {
                    ...prev.config.attendance!,
                    [key]: value,
                },
            },
        }));
    };

    const handleNext = () => {
        if (state.step === 1 && state.selectedTypes.size === 0) return;
        if (state.step === 2) {
            if (state.selectedTypes.has("ATTENDANCE")) {
                if (!state.config.attendance?.cohortId || !state.config.attendance?.dateRange?.from || !state.config.attendance?.dateRange?.to) {
                    // Add validation UI later
                    return;
                }
            }
        }
        setState(prev => ({ ...prev, step: prev.step + 1 }));
    };

    const handleBack = () => {
        setState(prev => ({ ...prev, step: Math.max(1, prev.step - 1) }));
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const items = [];

            if (state.selectedTypes.has("ATTENDANCE")) {
                items.push({
                    type: "ATTENDANCE",
                    config: {
                        cohort_id: state.config.attendance!.cohortId,
                        start_date: state.config.attendance!.dateRange!.from,
                        end_date: state.config.attendance!.dateRange!.to,
                    },
                });
            }

            const payload = {
                title: state.title || "Untitled Submission",
                submission_type: "COMPLIANCE_PACK",
                items: items.map(i => ({
                    type: i.type,
                    config_json: i.config,
                    status: "DRAFT"
                })),
            };

            const res = await fetch("/api/institutions/submissions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                throw new Error("Failed to create submission");
            }

            const data = await res.json();
            router.push(`/institution/submissions/${data.submission_id}`);
        } catch (e) {
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    };

    const renderStep1 = () => (
        <div className="grid gap-6">
            <div className="space-y-2">
                <Label>Submission Title</Label>
                <Input
                    placeholder="e.g. Q1 2025 Compliance Pack"
                    value={state.title}
                    onChange={e => setState(p => ({ ...p, title: e.target.value }))}
                />
            </div>

            <div className="space-y-3">
                <Label>What are you submitting?</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card
                        className={cn(
                            "cursor-pointer hover:border-emerald-500 transition-all",
                            state.selectedTypes.has("ATTENDANCE") ? "border-emerald-500 bg-emerald-50/10" : "border-muted"
                        )}
                        onClick={() => toggleType("ATTENDANCE")}
                    >
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <ClipboardCheck className="h-4 w-4 text-emerald-600" />
                                    Attendance Register
                                </CardTitle>
                                {state.selectedTypes.has("ATTENDANCE") && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <CardDescription>
                                Submit daily attendance records, sick notes, and absence reasons for a specific cohort.
                            </CardDescription>
                        </CardContent>
                    </Card>

                    <Card className="opacity-60 cursor-not-allowed border-muted">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <GraduationCap className="h-4 w-4" />
                                    Assessment Results
                                </CardTitle>
                                <Badge variant="outline" className="text-[10px]">Coming Soon</Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <CardDescription>
                                Submit learner marks, assessment evidence, and moderation reports.
                            </CardDescription>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="grid gap-6">
            {state.selectedTypes.has("ATTENDANCE") && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <ClipboardCheck className="h-4 w-4 text-emerald-600" />
                            Configure Attendance
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Select Cohort</Label>
                            <Select
                                value={state.config.attendance?.cohortId}
                                onValueChange={(val) => updateAttendanceConfig("cohortId", val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a cohort..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {cohorts.map(c => (
                                        <SelectItem key={c.cohort_id} value={c.cohort_id}>
                                            {c.name} ({c.qualification.code})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Date Range</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        id="date"
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !state.config.attendance?.dateRange && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {state.config.attendance?.dateRange?.from ? (
                                            state.config.attendance.dateRange.to ? (
                                                <>
                                                    {format(state.config.attendance.dateRange.from, "LLL dd, y")} -{" "}
                                                    {format(state.config.attendance.dateRange.to, "LLL dd, y")}
                                                </>
                                            ) : (
                                                format(state.config.attendance.dateRange.from, "LLL dd, y")
                                            )
                                        ) : (
                                            <span>Pick a date range</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        initialFocus
                                        mode="range"
                                        defaultMonth={state.config.attendance?.dateRange?.from}
                                        selected={state.config.attendance?.dateRange}
                                        onSelect={(range) => updateAttendanceConfig("dateRange", range)}
                                        numberOfMonths={2}
                                    />
                                </PopoverContent>
                            </Popover>
                            <p className="text-xs text-muted-foreground">
                                All finalized attendance records in this range will be included.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-6">
            <div className="rounded-lg border p-4 space-y-4 bg-gray-50/50">
                <div className="flex justify-between items-center pb-2 border-b">
                    <h3 className="font-medium text-sm text-gray-500 uppercase tracking-wide">Summary</h3>
                    <Badge variant="outline" className="bg-white">{state.title || "Untitled"}</Badge>
                </div>

                {state.selectedTypes.has("ATTENDANCE") && (
                    <div className="flex gap-4 items-start">
                        <div className="bg-emerald-100 p-2 rounded-md">
                            <ClipboardCheck className="h-5 w-5 text-emerald-700" />
                        </div>
                        <div>
                            <p className="font-semibold text-sm">Attendance Register</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Cohort: <span className="text-foreground font-medium">{cohorts.find(c => c.cohort_id === state.config.attendance?.cohortId)?.name || "Unknown"}</span>
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Dates: <span className="text-foreground font-medium">
                                    {state.config.attendance?.dateRange?.from ? format(state.config.attendance.dateRange.from, "MMM d") : "?"} - {state.config.attendance?.dateRange?.to ? format(state.config.attendance.dateRange.to, "MMM d, yyyy") : "?"}
                                </span>
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-800 border border-blue-200 flex gap-2">
                <div className="shrink-0 pt-0.5">ℹ️</div>
                <div>
                    <p className="font-medium">Ready to create draft?</p>
                    <p className="mt-1">
                        This will create a submission draft and capture a snapshot of the records. You can still review and verify before sending to QCTO.
                    </p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-8 relative">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -z-10" />
                {[1, 2, 3].map(s => (
                    <div key={s} className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 bg-white transition-all",
                        state.step > s || state.step === s ? "border-primary text-primary" : "border-gray-300 text-gray-500",
                        state.step === s && "ring-4 ring-primary/10"
                    )}>
                        {s}
                    </div>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>
                        {state.step === 1 && "Start New Submission"}
                        {state.step === 2 && "Configure Details"}
                        {state.step === 3 && "Review & Create"}
                    </CardTitle>
                    <CardDescription>
                        {state.step === 1 && "Select the type of data you need to submit."}
                        {state.step === 2 && "Define the scope (cohorts, dates) for your data."}
                        {state.step === 3 && "Verify the details below."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="min-h-[300px]">
                    {state.step === 1 && renderStep1()}
                    {state.step === 2 && renderStep2()}
                    {state.step === 3 && renderStep3()}
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-6">
                    <Button
                        variant="outline"
                        onClick={handleBack}
                        disabled={submitting || state.step === 1}
                    >
                        Back
                    </Button>

                    {state.step < 3 ? (
                        <Button onClick={handleNext} disabled={state.selectedTypes.size === 0}>
                            Next <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                    ) : (
                        <Button onClick={handleSubmit} disabled={submitting} className="min-w-[120px]">
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Submission"}
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
