"use client";

import { useState } from "react";
import { SuppressionEntry } from "@/lib/outreach/types";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus, Upload } from "lucide-react";
import { toast } from "sonner";

interface SuppressionListProps {
    entries: SuppressionEntry[];
    onAdd: (email: string) => Promise<void>;
    onRemove: (email: string) => Promise<void>;
}

export function SuppressionList({ entries, onAdd, onRemove }: SuppressionListProps) {
    const [newEmail, setNewEmail] = useState("");
    const [uploading, setUploading] = useState(false);

    const handleAddEmail = async () => {
        if (!newEmail.trim()) {
            toast.error("Please enter an email address");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newEmail)) {
            toast.error("Please enter a valid email address");
            return;
        }

        if (entries.some(entry => entry.email === newEmail)) {
            toast.error("Email already in suppression list");
            return;
        }

        try {
            await onAdd(newEmail);
            setNewEmail("");
            toast.success("Email added to suppression list");
        } catch (error) {
            toast.error("Failed to add email");
        }
    };

    const handleRemoveEmail = async (email: string) => {
        if (confirm(`Are you sure you want to remove ${email} from the suppression list?`)) {
            try {
                await onRemove(email);
                toast.success("Email removed from suppression list");
            } catch (error) {
                toast.error("Failed to remove email");
            }
        }
    };

    // simplified file upload to just parse and call onAdd for each (limit to avoid spamming API?)
    // Or just warn user that CSV upload is client-side only for now?
    // Let's hide CSV upload if not fully supported or wire it up to call onAdd sequentially/parallel.
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        // ... (existing CSV logic, but maybe call onAdd for each?)
        // For now, let's keep the existing UI but maybe disable CSV or leave it local-only visual?
        // User asked for "real data". Local state is NOT real data.
        // It's better to loop and add.

        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.csv')) {
            toast.error("Please upload a CSV file");
            return;
        }

        setUploading(true);

        try {
            const text = await file.text();
            const lines = text.split('\n').filter(line => line.trim());
            const startIndex = lines[0].toLowerCase().includes('email') ? 1 : 0;

            let addedCount = 0;
            for (let i = startIndex; i < lines.length; i++) {
                const email = lines[i].split(',')[0].trim();
                // Simple check
                if (email && email.includes('@')) {
                    try {
                        await onAdd(email);
                        addedCount++;
                    } catch (e) {
                        console.error(`Failed to add ${email}`, e);
                    }
                }
            }
            toast.success(`Processed CSV. Added ${addedCount} emails.`);

        } catch (error) {
            toast.error("Failed to process CSV");
        } finally {
            setUploading(false);
            event.target.value = '';
        }
    };

    return (
        <Card className="col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Suppression List</CardTitle>
                <div className="flex items-center gap-2">
                    <div className="flex w-full max-w-sm items-center space-x-2">
                        <Input
                            placeholder="Email to suppress..."
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleAddEmail();
                                }
                            }}
                        />
                        <Button size="sm" onClick={handleAddEmail}>
                            <Plus className="mr-2 h-4 w-4" /> Add
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border border-border/40 bg-card">
                    <Table className="bg-card">
                        <TableHeader>
                            <TableRow className="border-border/40 hover:bg-transparent">
                                <TableHead>Email</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead>Added</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {entries.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        No suppressed emails.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                entries.map((entry) => (
                                    <TableRow key={entry.email} className="border-border/40">
                                        <TableCell className="font-medium">{entry.email}</TableCell>
                                        <TableCell>{entry.reason}</TableCell>
                                        <TableCell>{new Date(entry.added_at).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-700"
                                                onClick={() => handleRemoveEmail(entry.email)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}

