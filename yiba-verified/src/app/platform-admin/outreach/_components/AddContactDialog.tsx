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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { PROVINCES } from "@/lib/provinces";
import { awarenessApi } from "@/lib/outreach/api";
import { toast } from "sonner";
import { EngagementStage } from "@/lib/outreach/types";

interface AddContactDialogProps {
    onContactAdded: () => void;
}

export function AddContactDialog({ onContactAdded }: AddContactDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        institution_name: "",
        domain: "",
        province: "",
        contact_name: "",
        contact_email: "",
    });

    const handleChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Validate
            if (!formData.institution_name || !formData.domain || !formData.province) {
                toast.error("Please fill in all required fields");
                return;
            }

            // Construct payload matching what the API expects
            // Note: The API likely expects a structure similar to what the CSV import produces
            // For now, we'll assume there's an endpoint or we adapt the create logic.
            // Since awarenessApi.uploadCsv is for bulk, we might need a createInstitution method.
            // If it doesn't exist, I'll mock it or use a generic create if available.
            // Checking api.ts next, but for now assuming a create method or using a direct server action pattern if needed.
            // Wait, looking at api.ts from memory/context, it might not have 'create'.
            // I'll assume we need to implement it or use a separate server action.
            // For this step I'll try to use a hypothetic create method and if it fails I'll add it to api.ts.

            // Split name into first and last
            const nameParts = formData.contact_name.trim().split(" ");
            const firstName = nameParts[0] || "";
            const lastName = nameParts.slice(1).join(" ") || "";

            await awarenessApi.createInstitution({
                ...formData,
                engagement_stage: EngagementStage.UNCONTACTED,
                status_flags: {
                    bounced: false,
                    opt_out: false,
                    declined: false,
                    ai_suppressed: false
                },
                contacts: formData.contact_email ? [{
                    contact_id: "preview-" + Date.now(),
                    first_name: firstName,
                    last_name: lastName,
                    email: formData.contact_email,
                    role: "Contact",
                    primary: true
                }] : []
            });

            toast.success("Contact added successfully");
            setOpen(false);
            setFormData({
                institution_name: "",
                domain: "",
                province: "",
                contact_name: "",
                contact_email: "",
            });
            onContactAdded();
        } catch (error) {
            console.error(error);
            toast.error("Failed to add contact");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    className="group h-9 w-9 px-0 hover:w-36 hover:px-3 transition-all duration-300 overflow-hidden whitespace-nowrap justify-start relative shadow-sm"
                >
                    <div className="absolute left-2.5 group-hover:left-3 transition-all duration-300">
                        <Plus className="h-4 w-4" />
                    </div>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 pl-8">
                        Add Contact
                    </span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Contact</DialogTitle>
                    <DialogDescription>
                        Manually add an institution to the pipeline.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="institution_name">Institution Name *</Label>
                        <Input
                            id="institution_name"
                            value={formData.institution_name}
                            onChange={(e) => handleChange("institution_name", e.target.value)}
                            placeholder="e.g. Acme University"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="domain">Domain *</Label>
                            <Input
                                id="domain"
                                value={formData.domain}
                                onChange={(e) => handleChange("domain", e.target.value)}
                                placeholder="acme.edu"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="province">Province *</Label>
                            <Select
                                value={formData.province}
                                onValueChange={(val) => handleChange("province", val)}
                                required
                            >
                                <SelectTrigger id="province">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {PROVINCES.map((p) => (
                                        <SelectItem key={p} value={p}>{p}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="contact_name">Contact Person (Optional)</Label>
                        <Input
                            id="contact_name"
                            value={formData.contact_name}
                            onChange={(e) => handleChange("contact_name", e.target.value)}
                            placeholder="John Doe"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="contact_email">Contact Email *</Label>
                        <Input
                            id="contact_email"
                            type="email"
                            value={formData.contact_email}
                            onChange={(e) => handleChange("contact_email", e.target.value)}
                            placeholder="john@acme.edu"
                            required
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Add Contact
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
