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
import { Mail } from "lucide-react";
import { awarenessApi } from "@/lib/outreach/api";
import { toast } from "sonner";

interface ManualEmailComposerProps {
    institutionId: string;
}

export function ManualEmailComposer({ institutionId }: ManualEmailComposerProps) {
    const [open, setOpen] = useState(false);
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [sending, setSending] = useState(false);

    const handleSend = async () => {
        if (!subject || !body) {
            toast.error("Subject and body are required");
            return;
        }

        setSending(true);
        try {
            await awarenessApi.sendManualEmail(institutionId, subject, body);
            toast.success("Email sent successfully");
            setOpen(false);
            setSubject("");
            setBody("");
        } catch (error) {
            console.error("Failed to send email:", error);
            toast.error("Failed to send email");
        } finally {
            setSending(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                    <Mail className="mr-2 h-4 w-4" />
                    Send Manual Email
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                    <DialogTitle>Compose Email</DialogTitle>
                    <DialogDescription>
                        Send a manual email to this institution. This will be tracked in the timeline.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Input
                            id="subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Enter email subject"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="body">Message Body</Label>
                        <Textarea
                            id="body"
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            placeholder="Type your message here..."
                            className="h-[200px]"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={sending}>
                        Cancel
                    </Button>
                    <Button onClick={handleSend} disabled={sending}>
                        {sending ? "Sending..." : "Send Email"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
