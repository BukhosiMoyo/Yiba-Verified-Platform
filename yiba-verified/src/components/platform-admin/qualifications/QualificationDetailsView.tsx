"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
    ArrowLeft,
    Edit,
    Building,
    Clock,
    Award,
    Users,
    Trash,
    MoreVertical
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface QualificationDetailsViewProps {
    qualification: any; // Ideally typed with the specific select shape
}

export function QualificationDetailsView({ qualification }: QualificationDetailsViewProps) {
    const [activeTab, setActiveTab] = useState("overview");

    return (
        <div className="space-y-6 container mx-auto p-6 max-w-7xl">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Link href="/platform-admin/qualifications" className="hover:text-foreground transition-colors flex items-center gap-1">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Qualifications
                        </Link>
                    </div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight">{qualification.name}</h1>
                        <Badge variant={qualification.status === "ACTIVE" ? "default" : "secondary"}>
                            {qualification.status}
                        </Badge>
                    </div>
                    <p className="text-muted-foreground">
                        {qualification.code} • {qualification.type.replace(/_/g, " ")}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" asChild>
                        <Link href={`/platform-admin/qualifications/${qualification.qualification_id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Qualification
                        </Link>
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem className="text-destructive">
                                <Trash className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Sidebar - Key Metadata */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Key Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1">
                                <span className="text-xs font-medium text-muted-foreground uppercase">Qualification Code</span>
                                <div className="font-mono text-sm">{qualification.code}</div>
                            </div>

                            {qualification.saqa_id && (
                                <div className="space-y-1">
                                    <span className="text-xs font-medium text-muted-foreground uppercase">SAQA ID</span>
                                    <div className="font-mono text-sm">{qualification.saqa_id}</div>
                                </div>
                            )}

                            {qualification.curriculum_code && (
                                <div className="space-y-1">
                                    <span className="text-xs font-medium text-muted-foreground uppercase">Curriculum Code</span>
                                    <div className="font-mono text-sm">{qualification.curriculum_code}</div>
                                </div>
                            )}

                            <Separator />

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <span className="text-xs font-medium text-muted-foreground uppercase">NQF Level</span>
                                    <div className="font-medium">Level {qualification.nqf_level}</div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs font-medium text-muted-foreground uppercase">Credits</span>
                                    <div className="font-medium">{qualification.credits || "—"}</div>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-1">
                                <span className="text-xs font-medium text-muted-foreground uppercase">Study Mode</span>
                                <div className="flex items-center gap-2">
                                    <Building className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">{qualification.study_mode.replace(/_/g, " ")}</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs font-medium text-muted-foreground uppercase">Duration</span>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">{qualification.duration_value} {qualification.duration_unit.toLowerCase()}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">System Info</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="flex justify-between py-1 border-b">
                                <span className="text-muted-foreground">ID</span>
                                <span className="font-mono text-xs">{qualification.qualification_id.substring(0, 8)}...</span>
                            </div>
                            <div className="flex justify-between py-1 border-b">
                                <span className="text-muted-foreground">Created</span>
                                <span>{new Date(qualification.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-muted-foreground">Last Updated</span>
                                <span>{new Date(qualification.updated_at).toLocaleDateString()}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
                            <TabsTrigger value="requirements">Requirements</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="mt-6 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Summary</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {qualification.summary ? (
                                        <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                            {qualification.summary}
                                        </p>
                                    ) : (
                                        <div className="text-muted-foreground italic">No summary provided.</div>
                                    )}
                                </CardContent>
                            </Card>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base font-medium flex items-center gap-2">
                                            <Award className="h-4 w-4 text-primary" />
                                            Assessment
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{qualification.assessment_type?.replace(/_/g, " ") || "—"}</div>
                                        <p className="text-xs text-muted-foreground mt-1">Assessment Method</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base font-medium flex items-center gap-2">
                                            <Users className="h-4 w-4 text-primary" />
                                            Enrolments
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{qualification._count.enrolments}</div>
                                        <p className="text-xs text-muted-foreground mt-1">Total Active Learners</p>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="curriculum" className="mt-6 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Modules</CardTitle>
                                    <CardDescription>
                                        Breakdown of the knowledge and practical modules included in this qualification.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {qualification.modules && qualification.modules.length > 0 ? (
                                        <div className="grid gap-3">
                                            {qualification.modules.map((mod: string, i: number) => (
                                                <div key={i} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                                                    <div className="mt-1 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                                                    <span className="text-sm font-medium">{mod}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground">
                                            No modules listed for this qualification.
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Career Outcomes</CardTitle>
                                    <CardDescription>
                                        Potential career paths and opportunities for graduates.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {qualification.career_outcomes && qualification.career_outcomes.length > 0 ? (
                                        <div className="grid gap-3">
                                            {qualification.career_outcomes.map((outcome: string, i: number) => (
                                                <div key={i} className="flex items-start gap-3 p-3 rounded-lg border bg-green-50/50 dark:bg-green-950/10 border-green-100 dark:border-green-900/20">
                                                    <div className="mt-1 h-2 w-2 rounded-full bg-green-500 flex-shrink-0" />
                                                    <span className="text-sm font-medium">{outcome}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground">
                                            No career outcomes listed.
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="requirements" className="mt-6 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Entry Requirements</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                        {qualification.entry_requirements || "No specific entry requirements listed."}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Workplace Component</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between p-4 border rounded-lg">
                                        <span className="font-medium">Workplace Experience Required</span>
                                        <Badge variant={qualification.workplace_required ? "default" : "outline"}>
                                            {qualification.workplace_required ? "Yes" : "No"}
                                        </Badge>
                                    </div>
                                    {qualification.workplace_required && (
                                        <div className="flex items-center justify-between p-4 border rounded-lg">
                                            <span className="font-medium">Minimum Hours</span>
                                            <span className="font-mono">{qualification.workplace_hours || 0} Hours</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
