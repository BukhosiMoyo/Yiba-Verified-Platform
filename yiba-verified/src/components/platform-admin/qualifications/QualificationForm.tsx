"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    code: z.string().min(1, "Code is required"),
    type: z.enum([
        "OCCUPATIONAL_CERTIFICATE",
        "SKILL_PROGRAMME",
        "LEARNERSHIP",
        "APPRENTICESHIP",
        "UNIT_STANDARD",
        "SHORT_COURSE",
        "OTHER",
    ]),
    nqf_level: z.coerce.number().min(1).max(10),
    status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED", "INACTIVE", "RETIRED"]),
    summary: z.string().min(10, "Summary must be at least 10 characters"),
    study_mode: z.enum(["ON_SITE", "ONLINE", "HYBRID"]),
    duration_value: z.coerce.number().min(1),
    duration_unit: z.enum(["WEEKS", "MONTHS", "YEARS"]),
    credits: z.coerce.number().nullable().optional(),
    regulatory_body: z.enum(["QCTO", "SETA", "DHET", "OTHER"]).optional(),
    seta: z.string().optional(),
    entry_requirements: z.string().optional(),
    assessment_type: z.enum(["EXAM", "PRACTICAL", "PORTFOLIO", "MIXED"]).optional(),
    workplace_required: z.boolean().default(false),
    workplace_hours: z.coerce.number().nullable().optional(),
    language_of_delivery: z.string().optional(),
    career_outcomes: z.string().optional(), // We'll handle array conversion in submit
    modules: z.string().optional(), // We'll handle array conversion in submit
    saqa_id: z.string().optional(),
    curriculum_code: z.string().optional(),
});

type QualificationFormValues = z.infer<typeof formSchema>;

interface QualificationFormProps {
    initialData?: any; // Should be typed better
    isEditing?: boolean;
}

export function QualificationForm({ initialData, isEditing = false }: QualificationFormProps) {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);

    const form = useForm<QualificationFormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: initialData
            ? {
                ...initialData,
                type: initialData.type || "OTHER",
                status: initialData.status || "DRAFT",
                study_mode: initialData.study_mode || "ON_SITE",
                duration_unit: initialData.duration_unit || "MONTHS",
                // Convert arrays to newline separated strings for editing
                modules: Array.isArray(initialData.modules) ? initialData.modules.join("\n") : "",
                career_outcomes: Array.isArray(initialData.career_outcomes) ? initialData.career_outcomes.join("\n") : "",
            }
            : {
                name: "",
                code: "",
                type: "OTHER",
                nqf_level: 1,
                status: "DRAFT",
                summary: "",
                study_mode: "ON_SITE",
                duration_value: 12,
                duration_unit: "MONTHS",
                workplace_required: false,
            },
    });

    async function onSubmit(data: QualificationFormValues) {
        setSubmitting(true);
        try {
            const url = isEditing
                ? `/api/platform-admin/qualifications/${initialData.qualification_id}` // Assume ID is in initialData
                : "/api/platform-admin/qualifications";

            const method = isEditing ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...data,
                    // Convert newline separated strings back to arrays
                    modules: data.modules ? data.modules.split("\n").map(s => s.trim()).filter(Boolean) : [],
                    career_outcomes: data.career_outcomes ? data.career_outcomes.split("\n").map(s => s.trim()).filter(Boolean) : [],
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to save qualification");
            }

            toast.success(isEditing ? "Qualification updated" : "Qualification created");
            router.push("/platform-admin/qualifications");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid gap-6 md:grid-cols-2">

                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle>Identity</CardTitle>
                            <CardDescription>Basic identification details.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem className="sm:col-span-2">
                                        <FormLabel>Qualification Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Occupational Certificate: Electrician" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="code"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Code (Internal)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. OC-ELEC-01" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="saqa_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>SAQA ID</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. 12345" {...field} value={field.value || ""} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="curriculum_code"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Curriculum Code</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. 12345-01" {...field} value={field.value || ""} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Type</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="OCCUPATIONAL_CERTIFICATE">Occupational Certificate</SelectItem>
                                                <SelectItem value="SKILL_PROGRAMME">Skills Programme</SelectItem>
                                                <SelectItem value="LEARNERSHIP">Learnership</SelectItem>
                                                <SelectItem value="APPRENTICESHIP">Apprenticeship</SelectItem>
                                                <SelectItem value="UNIT_STANDARD">Unit Standard</SelectItem>
                                                <SelectItem value="SHORT_COURSE">Short Course</SelectItem>
                                                <SelectItem value="OTHER">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Status</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="DRAFT">Draft</SelectItem>
                                                <SelectItem value="ACTIVE">Active</SelectItem>
                                                <SelectItem value="ARCHIVED">Archived</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Level & Duration</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="nqf_level"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>NQF Level (1-10)</FormLabel>
                                            <FormControl>
                                                <Input type="number" min={1} max={10} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="credits"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Credits (Optional)</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} value={field.value || ""} onChange={e => field.onChange(e.target.valueAsNumber || null)} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="study_mode"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Study Mode</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select mode" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="ON_SITE">On Site</SelectItem>
                                                <SelectItem value="ONLINE">Online</SelectItem>
                                                <SelectItem value="HYBRID">Hybrid</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="duration_value"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Duration</FormLabel>
                                            <FormControl>
                                                <Input type="number" min={0} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="duration_unit"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Unit</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Unit" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="WEEKS">Weeks</SelectItem>
                                                    <SelectItem value="MONTHS">Months</SelectItem>
                                                    <SelectItem value="YEARS">Years</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Authority & assessment</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <FormField
                                control={form.control}
                                name="regulatory_body"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Regulatory Body</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select body" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="QCTO">QCTO</SelectItem>
                                                <SelectItem value="SETA">SETA</SelectItem>
                                                <SelectItem value="DHET">DHET</SelectItem>
                                                <SelectItem value="OTHER">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="seta"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>SETA (if applicable)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. MERSETA" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="assessment_type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Assessment Type</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="EXAM">Exam</SelectItem>
                                                <SelectItem value="PRACTICAL">Practical</SelectItem>
                                                <SelectItem value="PORTFOLIO">Portfolio</SelectItem>
                                                <SelectItem value="MIXED">Mixed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle>Requirements & Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <FormField
                                control={form.control}
                                name="summary"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Summary *</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Brief description of the qualification (min 10 chars)..."
                                                className="min-h-[100px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="entry_requirements"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Entry Requirements</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="e.g. Grade 12 with Maths..."
                                                className="min-h-[80px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex items-center gap-4">
                                <FormField
                                    control={form.control}
                                    name="workplace_required"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel>
                                                    Workplace Component Required?
                                                </FormLabel>
                                                <FormDescription>
                                                    Does this qualification require workplace experience?
                                                </FormDescription>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                                {form.watch("workplace_required") && (
                                    <FormField
                                        control={form.control}
                                        name="workplace_hours"
                                        render={({ field }) => (
                                            <FormItem className="flex-1">
                                                <FormLabel>Workplace Hours</FormLabel>
                                                <FormControl>
                                                    <Input type="number" {...field} value={field.value || ""} onChange={e => field.onChange(e.target.valueAsNumber)} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}
                            </div>

                            <FormField
                                control={form.control}
                                name="language_of_delivery"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Language of Delivery</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. English" {...field} value={field.value || ""} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="modules"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Modules</FormLabel>
                                            <FormDescription>One per line</FormDescription>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="List modules..."
                                                    className="min-h-[120px]"
                                                    {...field}
                                                    value={field.value || ""}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="career_outcomes"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Career Outcomes</FormLabel>
                                            <FormDescription>One per line</FormDescription>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="List outcomes..."
                                                    className="min-h-[120px]"
                                                    {...field}
                                                    value={field.value || ""}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                        </CardContent>
                    </Card>

                </div>

                <div className="flex justify-end gap-4">
                    <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
                    <Button type="submit" disabled={submitting}>
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEditing ? "Save Changes" : "Create Qualification"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
