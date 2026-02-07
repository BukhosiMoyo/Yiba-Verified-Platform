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
}

export function SuppressionList({ entries: initialEntries }: SuppressionListProps) {
    const [entries, setEntries] = useState(initialEntries);
    const [newEmail, setNewEmail] = useState("");
    const [uploading, setUploading] = useState(false);

    const handleAddEmail = () => {
        if (!newEmail.trim()) {
            toast.error("Please enter an email address");
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newEmail)) {
            toast.error("Please enter a valid email address");
            return;
        }

        // Check for duplicates
        if (entries.some(entry => entry.email === newEmail)) {
            toast.error("Email already in suppression list");
            return;
        }

        const newEntry: SuppressionEntry = {
            email: newEmail,
            reason: "Manual addition",
            added_at: new Date(),
            added_by: "admin",
        };

        setEntries([...entries, newEntry]);
        setNewEmail("");
        toast.success("Email added to suppression list");
    };

    const handleRemoveEmail = (email: string) => {
        setEntries(entries.filter(entry => entry.email !== email));
        toast.success("Email removed from suppression list");
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Check file type
        if (!file.name.endsWith('.csv')) {
            toast.error("Please upload a CSV file");
            return;
        }

        setUploading(true);

        try {
            const text = await file.text();
            const lines = text.split('\n').filter(line => line.trim());

            // Skip header if present
            const startIndex = lines[0].toLowerCase().includes('email') ? 1 : 0;
            const newEmails: SuppressionEntry[] = [];

            for (let i = startIndex; i < lines.length; i++) {
                const email = lines[i].split(',')[0].trim();
                if (email && !entries.some(entry => entry.email === email)) {
                    newEmails.push({
                        email,
                        reason: "CSV import",
                        added_at: new Date(),
                        added_by: "admin",
                    });
                }
            }

            if (newEmails.length > 0) {
                setEntries([...entries, ...newEmails]);
                toast.success(`Added ${newEmails.length} email(s) to suppression list`);
            } else {
                toast.info("No new emails to add");
            }
        } catch (error) {
            toast.error("Failed to parse CSV file");
            console.error(error);
        } finally {
            setUploading(false);
            // Reset input
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
                    <div className="relative">
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            id="csv-upload"
                        />
                        <Button size="sm" variant="outline" disabled={uploading}>
                            <Upload className="mr-2 h-4 w-4" />
                            {uploading ? "Uploading..." : "Upload CSV"}
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
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
                                    <TableRow key={entry.email}>
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

