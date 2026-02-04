import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Loader2, Calendar, BookOpen, Award, Building, Clock, Users } from "lucide-react";
import { useState } from "react";

interface QualificationDetailsSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    qualification: any; // Type accurately if possible
    loading: boolean;
}

export function QualificationDetailsSheet({
    open,
    onOpenChange,
    qualification,
    loading,
}: QualificationDetailsSheetProps) {
    const [activeTab, setActiveTab] = useState("overview");

    if (!open) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="sm:max-w-xl w-full p-0">
                <div className="h-full flex flex-col">
                    <SheetHeader className="p-6 pb-2 border-b">
                        <SheetTitle className="text-xl">Qualification Details</SheetTitle>
                        <SheetDescription>
                            Full information about this qualification.
                        </SheetDescription>
                    </SheetHeader>

                    {loading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : qualification ? (
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                            <div className="px-6 pt-4 border-b">
                                <TabsList className="grid w-full grid-cols-4">
                                    <TabsTrigger value="overview">Overview</TabsTrigger>
                                    <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
                                    <TabsTrigger value="details">Logistics</TabsTrigger>
                                    <TabsTrigger value="metadata">System</TabsTrigger>
                                </TabsList>
                            </div>

                            <ScrollArea className="flex-1">
                                <div className="p-6 space-y-6">
                                    {/* Overview Tab */}
                                    <TabsContent value="overview" className="m-0 space-y-6">
                                        <div>
                                            <h3 className="font-semibold text-lg">{qualification.name}</h3>
                                            <div className="flex items-center gap-2 mt-2">
                                                <Badge variant="outline" className="font-mono">{qualification.code}</Badge>
                                                <Badge>{qualification.status}</Badge>
                                                {qualification.saqa_id && <Badge variant="secondary">SAQA: {qualification.saqa_id}</Badge>}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div className="space-y-1">
                                                <span className="text-muted-foreground">Type</span>
                                                <div className="font-medium">{qualification.type?.replace(/_/g, " ")}</div>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-muted-foreground">NQF Level</span>
                                                <div className="font-medium">Level {qualification.nqf_level}</div>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-muted-foreground">Credits</span>
                                                <div className="font-medium">{qualification.credits || "—"}</div>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-muted-foreground">Regulatory Body</span>
                                                <div className="font-medium">{qualification.regulatory_body || "—"}</div>
                                            </div>
                                        </div>

                                        <input type="hidden" name="x" value={JSON.stringify(qualification)} />

                                        {qualification.summary && (
                                            <div className="space-y-2">
                                                <h4 className="font-medium flex items-center gap-2">
                                                    <BookOpen className="h-4 w-4 text-primary" /> Summary
                                                </h4>
                                                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                                    {qualification.summary}
                                                </p>
                                            </div>
                                        )}
                                    </TabsContent>

                                    {/* Curriculum Tab */}
                                    <TabsContent value="curriculum" className="m-0 space-y-6">
                                        <div className="space-y-4">
                                            <h4 className="font-medium text-sm text-muted-foreground uppercase">Modules</h4>
                                            {qualification.modules && qualification.modules.length > 0 ? (
                                                <div className="grid gap-2">
                                                    {qualification.modules.map((mod: string, i: number) => (
                                                        <div key={i} className="flex gap-2 text-sm items-start">
                                                            <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                                                            <span>{mod}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-sm text-muted-foreground italic">No modules listed.</div>
                                            )}
                                        </div>

                                        <Separator />

                                        <div className="space-y-4">
                                            <h4 className="font-medium text-sm text-muted-foreground uppercase">Career Outcomes</h4>
                                            {qualification.career_outcomes && qualification.career_outcomes.length > 0 ? (
                                                <div className="grid gap-2">
                                                    {qualification.career_outcomes.map((detail: string, i: number) => (
                                                        <div key={i} className="flex gap-2 text-sm items-start">
                                                            <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-green-500 flex-shrink-0" />
                                                            <span>{detail}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-sm text-muted-foreground italic">No career outcomes listed.</div>
                                            )}
                                        </div>
                                    </TabsContent>

                                    {/* Logistics Tab */}
                                    <TabsContent value="details" className="m-0 space-y-6">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-1">
                                                <span className="text-xs font-semibold text-muted-foreground uppercase">Study Mode</span>
                                                <div className="flex items-center gap-2">
                                                    <Building className="h-4 w-4 text-muted-foreground" />
                                                    <span>{qualification.study_mode?.replace(/_/g, " ")}</span>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-xs font-semibold text-muted-foreground uppercase">Duration</span>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                                    <span>{qualification.duration_value} {qualification.duration_unit?.toLowerCase()}</span>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-xs font-semibold text-muted-foreground uppercase">Assessment</span>
                                                <div className="flex items-center gap-2">
                                                    <Award className="h-4 w-4 text-muted-foreground" />
                                                    <span>{qualification.assessment_type?.replace(/_/g, " ") || "—"}</span>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-xs font-semibold text-muted-foreground uppercase">Workplace</span>
                                                <div className="flex items-center gap-2">
                                                    <Building className="h-4 w-4 text-muted-foreground" />
                                                    <span>
                                                        {qualification.workplace_required ? "Required" : "Not Required"}
                                                        {qualification.workplace_hours ? ` (${qualification.workplace_hours} hrs)` : ""}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <Separator />

                                        <div className="space-y-2">
                                            <h4 className="font-medium text-sm">Entry Requirements</h4>
                                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                                {qualification.entry_requirements || "No specific entry requirements listed."}
                                            </p>
                                        </div>
                                    </TabsContent>

                                    {/* Metadata Tab */}
                                    <TabsContent value="metadata" className="m-0 space-y-6">
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div className="space-y-1">
                                                <span className="text-muted-foreground">ID</span>
                                                <div className="font-mono text-xs">{qualification.qualification_id}</div>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-muted-foreground">Curriculum Code</span>
                                                <div className="font-mono text-xs">{qualification.curriculum_code || "—"}</div>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-muted-foreground">Created</span>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(qualification.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-muted-foreground">Last Updated</span>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(qualification.updated_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>

                                        <Separator />

                                        <div className="bg-muted/50 p-4 rounded-lg">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-4 w-4 text-muted-foreground" />
                                                    <span className="text-sm font-medium">Total Enrolments</span>
                                                </div>
                                                <span className="text-xl font-bold">{qualification._count?.enrolments || 0}</span>
                                            </div>
                                        </div>
                                    </TabsContent>
                                </div>
                            </ScrollArea>
                        </Tabs>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-muted-foreground">
                            Failed to load details.
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
