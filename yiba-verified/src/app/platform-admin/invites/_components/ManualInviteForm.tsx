"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChipEmailInput } from "@/components/shared/ChipEmailInput";
import { SearchableSelect } from "@/components/shared/SearchableSelect";
import { Loader2, Send } from "lucide-react";
import { PROVINCES } from "@/lib/provinces";

interface Option {
    value: string;
    label: string;
}

interface ManualInviteFormProps {
    institutions: { institution_id: string; legal_name: string; trading_name: string | null }[];
}

export function ManualInviteForm({ institutions }: ManualInviteFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        emails: [] as string[],
        role: "",
        institution_id: "",
        default_province: "",
    });

    const institutionOptions = useMemo(
        () =>
            institutions.map((i) => ({
                value: i.institution_id,
                label: i.trading_name || i.legal_name,
            })),
        [institutions]
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const needsInst =
            formData.role === "INSTITUTION_STAFF" ||
            formData.role === "STUDENT";
        const needsProvince =
            ["QCTO_ADMIN", "QCTO_USER", "QCTO_REVIEWER", "QCTO_AUDITOR", "QCTO_VIEWER"].includes(
                formData.role
            );

        if (needsInst && !formData.institution_id) {
            toast.error("Institution is required for this role");
            return;
        }
        if (needsProvince && !formData.default_province) {
            toast.error("Province is required for this role");
            return;
        }

        if (formData.emails.length === 0) {
            toast.error("Please enter at least one valid email address");
            return;
        }

        try {
            setLoading(true);
            let successCount = 0;
            let failCount = 0;
            const errors: string[] = [];

            for (const email of formData.emails) {
                try {
                    const res = await fetch("/api/invites", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            email: email,
                            role: formData.role,
                            institution_id: formData.institution_id || null,
                            default_province: formData.default_province || null,
                        }),
                    });

                    if (!res.ok) {
                        const data = await res.json();
                        throw new Error(data.error || "Failed");
                    }
                    successCount++;
                } catch (err) {
                    failCount++;
                    errors.push(`${email}: ${err instanceof Error ? err.message : "Unknown error"}`);
                }
            }

            if (successCount > 0) {
                toast.success(`Sent ${successCount} invite${successCount !== 1 ? "s" : ""}`);
            }

            if (failCount > 0) {
                toast.error(`Failed to send ${failCount} invite${failCount !== 1 ? "s" : ""}`);
                console.error("Invite errors:", errors);
            }

            // Reset
            setFormData({ emails: [], role: "", institution_id: "", default_province: "" });
            router.refresh();

        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to process invites");
        } finally {
            setLoading(false);
        }
    };

    const needsInst =
        formData.role === "INSTITUTION_STAFF" ||
        formData.role === "STUDENT";
    const needsProvince =
        ["QCTO_ADMIN", "QCTO_USER", "QCTO_REVIEWER", "QCTO_AUDITOR", "QCTO_VIEWER"].includes(
            formData.role
        );

    return (
        <Card>
            <CardHeader>
                <CardTitle>Send Manual Invites</CardTitle>
                <CardDescription>
                    Invite users one by one or in small batches. Select a role and enter emails.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="role">User Role</Label>
                        <Select
                            value={formData.role}
                            onValueChange={(val) => setFormData((p) => ({ ...p, role: val }))}
                            required
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PLATFORM_ADMIN">Platform Admin</SelectItem>
                                <SelectItem value="QCTO_ADMIN">QCTO Admin</SelectItem>
                                <SelectItem value="QCTO_USER">QCTO User</SelectItem>
                                <SelectItem value="QCTO_REVIEWER">QCTO Reviewer</SelectItem>
                                <SelectItem value="QCTO_AUDITOR">QCTO Auditor</SelectItem>
                                <SelectItem value="QCTO_VIEWER">QCTO Viewer</SelectItem>
                                <SelectItem value="INSTITUTION_ADMIN">Institution Admin</SelectItem>
                                <SelectItem value="INSTITUTION_STAFF">Institution Staff</SelectItem>
                                <SelectItem value="STUDENT">Student</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {needsProvince && (
                        <div className="space-y-2">
                            <Label>Province</Label>
                            <Select
                                value={formData.default_province}
                                onValueChange={(val) => setFormData((p) => ({ ...p, default_province: val }))}
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select province" />
                                </SelectTrigger>
                                <SelectContent>
                                    {PROVINCES.map((prov) => (
                                        <SelectItem key={prov} value={prov}>
                                            {prov}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {needsInst && (
                        <div className="space-y-2">
                            <Label>Institution</Label>
                            <SearchableSelect
                                options={institutionOptions}
                                value={formData.institution_id}
                                onChange={(val) => setFormData((p) => ({ ...p, institution_id: val }))}
                                placeholder="Search institution..."
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Email Addresses</Label>
                        <ChipEmailInput
                            value={formData.emails}
                            onChange={(emails) => setFormData((p) => ({ ...p, emails }))}
                            placeholder="Type email and press Enter..."
                        />
                        <p className="text-xs text-muted-foreground">
                            Press Enter or Comma to add an email. You can add multiple.
                        </p>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Send className="mr-2 h-4 w-4" />
                                Send Invites
                            </>
                        )}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
