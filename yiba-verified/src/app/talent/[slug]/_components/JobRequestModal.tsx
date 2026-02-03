
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Briefcase } from "lucide-react";

interface JobRequestModalProps {
    candidateName: string;
    slug: string;
}

export function JobRequestModal({ candidateName, slug }: JobRequestModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        try {
            const res = await fetch(`/api/public/talent/${slug}/job-request`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Failed to send request");
            }

            toast.success("Request Sent!", {
                description: "Please check your email to verify this request.",
            });
            setOpen(false);
        } catch (error: any) {
            toast.error("Error", {
                description: error.message,
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="lg" className="w-full md:w-auto gap-2">
                    <Briefcase className="h-4 w-4" />
                    Request to Hire
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Hire {candidateName}</DialogTitle>
                        <DialogDescription>
                            Send a verified job opportunity. We'll ask you to confirm your email before delivering it.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="company_name">Company Name</Label>
                                <Input id="company_name" name="company_name" required placeholder="Acme Inc." />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="company_website">Website (Optional)</Label>
                                <Input id="company_website" name="company_website" placeholder="https://..." />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="company_email">Your Work Email</Label>
                            <Input id="company_email" name="company_email" type="email" required placeholder="you@company.com" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="role_title">Role Title</Label>
                            <Input id="role_title" name="role_title" required placeholder="e.g. Junior Developer" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="work_type">Work Type</Label>
                                <select id="work_type" name="work_type" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
                                    <option value="ONSITE">On-site</option>
                                    <option value="REMOTE">Remote</option>
                                    <option value="HYBRID">Hybrid</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="location">Location</Label>
                                <Input id="location" name="location" placeholder="e.g. Cape Town" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="message">Message to Candidate</Label>
                            <Textarea
                                id="message"
                                name="message"
                                required
                                placeholder="Briefly describe the opportunity..."
                                className="h-24 resize-none"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Send Request
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
