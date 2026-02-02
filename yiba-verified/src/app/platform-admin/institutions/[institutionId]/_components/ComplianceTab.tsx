"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ShieldCheck, UserCheck, GraduationCap, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { ResponsiveTable } from "@/components/shared/ResponsiveTable";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

interface ComplianceTabProps {
    institutionId: string;
}

export function ComplianceTab({ institutionId }: ComplianceTabProps) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchCompliance();
    }, [institutionId]);

    const fetchCompliance = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/platform-admin/institutions/${institutionId}/compliance`);
            if (!res.ok) throw new Error("Failed to fetch compliance data");
            const json = await res.json();
            setData(json);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error loading compliance data");
            toast.error("Could not load compliance details");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString("en-ZA", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error) {
        return (
            <EmptyState
                title="Error loading compliance"
                description="We couldn't retrieve the compliance snapshot for this institution."
                icon={<AlertTriangle className="h-12 w-12 text-destructive" />}
            />
        );
    }

    const { compliance, contacts, qualifications } = data || {};
    const hasCompliance = !!compliance;

    return (
        <div className="space-y-6">
            {/* 1. Compliance Snapshot */}
            <Card className="border-l-4 border-l-blue-600">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-blue-600" />
                                Regulatory Snapshot
                            </CardTitle>
                            <CardDescription>
                                Current accreditation standing with QCTO
                            </CardDescription>
                        </div>
                        {hasCompliance && (
                            <Badge variant={compliance.accreditation_status === "ACTIVE" ? "default" : "destructive"}>
                                {compliance.accreditation_status}
                            </Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {hasCompliance ? (
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground">Accreditation Number</h4>
                                    <p className="text-lg font-mono font-semibold">{compliance.accreditation_number || "Not assigned"}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="text-sm font-medium text-muted-foreground">Approval Date</h4>
                                        <p className="text-sm">{formatDate(compliance.approval_date)}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-muted-foreground">Expiry Date</h4>
                                        <p className="text-sm">{formatDate(compliance.expiry_date)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground">Approved Provinces</h4>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {compliance.provinces_approved?.length > 0 ? (
                                            compliance.provinces_approved.map((p: string) => (
                                                <Badge key={p} variant="outline">{p}</Badge>
                                            ))
                                        ) : (
                                            <span className="text-sm text-muted-foreground">None listed</span>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground">Last Synced</h4>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {compliance.last_synced_at ? `${formatDate(compliance.last_synced_at)} (System Import)` : "Never synced"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-6 bg-muted/20 rounded-lg">
                            <p className="text-muted-foreground">No compliance snapshot found. Run import or sync.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
                {/* 2. Governance Contacts */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserCheck className="h-5 w-5 text-gray-500" />
                            Governance Contacts
                        </CardTitle>
                        <CardDescription>
                            Key personnel responsible for compliance
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {contacts && contacts.length > 0 ? (
                            <div className="space-y-4">
                                {contacts.map((contact: any) => (
                                    <div key={contact.id} className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0">
                                        <div className="space-y-1">
                                            <p className="font-medium">{contact.first_name} {contact.last_name}</p>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Badge variant="outline" className="text-[10px] h-5">{contact.type.replace(/_/g, " ")}</Badge>
                                                <span>•</span>
                                                <span>{contact.email}</span>
                                            </div>
                                            {contact.phone_number && <p className="text-xs text-muted-foreground">{contact.phone_number}</p>}
                                        </div>
                                        <Badge variant={contact.visibility === "INTERNAL_ONLY" ? "secondary" : "outline"} className="text-[10px]">
                                            {contact.visibility === "INTERNAL_ONLY" ? "Private" : "Public/Inst"}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                title="No contacts"
                                description="No governance contacts listed."
                                icon={<UserCheck className="h-8 w-8 text-gray-300" />}
                            />
                        )}
                    </CardContent>
                </Card>

                {/* 3. Approved Qualifications */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <GraduationCap className="h-5 w-5 text-gray-500" />
                            Approved Range
                        </CardTitle>
                        <CardDescription>
                            Qualifications authorized for delivery
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {qualifications && qualifications.length > 0 ? (
                            <div className="space-y-4">
                                {qualifications.map((q: any) => (
                                    <div key={q.id} className="flex items-start gap-3 border-b pb-4 last:border-0 last:pb-0">
                                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-1" />
                                        <div>
                                            <p className="text-sm font-medium">{q.registry?.name || "Unknown Qualification"}</p>
                                            <div className="flex gap-2 mt-1">
                                                {q.registry?.saqa_id && <Badge variant="secondary" className="text-[10px]">SAQA {q.registry.saqa_id}</Badge>}
                                                {q.registry?.nqf_level && <Badge variant="outline" className="text-[10px]">NQF {q.registry.nqf_level}</Badge>}
                                            </div>
                                            {q.scope_end_date && (
                                                <p className="text-xs text-muted-foreground mt-1">Expires: {formatDate(q.scope_end_date)}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                title="No qualifications"
                                description="No approved qualifications found on record."
                                icon={<GraduationCap className="h-8 w-8 text-gray-300" />}
                            />
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
