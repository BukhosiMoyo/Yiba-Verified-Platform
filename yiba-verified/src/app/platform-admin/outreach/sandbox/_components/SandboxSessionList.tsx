"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Play, Plus, Trash2, LayoutGrid, List, ArrowRight } from "lucide-react";
import Link from "next/link";
import { deleteSession } from "../actions";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface SandboxSessionListProps {
    sessions: any[];
}

export function SandboxSessionList({ sessions }: SandboxSessionListProps) {
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const router = useRouter();

    const handleDelete = async (sessionId: string) => {
        if (!confirm("Are you sure you want to delete this session?")) return;
        setDeletingId(sessionId);
        try {
            await deleteSession(sessionId);
            toast.success("Session deleted");
            router.refresh();
        } catch (error) {
            toast.error("Failed to delete session");
        } finally {
            setDeletingId(null);
        }
    };

    if (sessions.length === 0) {
        return (
            <Card className="col-span-full border-dashed p-8 text-center bg-gray-50 dark:bg-zinc-900/50">
                <div className="text-muted-foreground">No sandbox sessions found. Create one to start testing.</div>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <div className="flex items-center space-x-2 bg-muted p-1 rounded-md">
                    <Button
                        variant={viewMode === "grid" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("grid")}
                        className="h-8 w-8 p-0"
                    >
                        <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={viewMode === "list" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("list")}
                        className="h-8 w-8 p-0"
                    >
                        <List className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {viewMode === "grid" ? (
                <div className="grid gap-4 md:grid-cols-3">
                    {sessions.map((session) => (
                        <Card key={session.session_id} className="hover:border-primary/50 transition-colors group relative">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium truncate pr-8" title={session.name}>
                                    {session.name}
                                </CardTitle>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                    onClick={() => handleDelete(session.session_id)}
                                    disabled={deletingId === session.session_id}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold mb-1">{session.current_stage}</div>
                                <div className="text-xs text-muted-foreground mb-4">
                                    Score: {session.engagement_score} • {session.institution_name}
                                </div>
                                <Link href={`/platform-admin/outreach/sandbox/${session.session_id}`}>
                                    <Button size="sm" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                        <Play className="mr-2 h-4 w-4" /> Open Simulator
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="rounded-md border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Session Name</TableHead>
                                <TableHead>Stage</TableHead>
                                <TableHead>Score</TableHead>
                                <TableHead>Institution</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sessions.map((session) => (
                                <TableRow key={session.session_id}>
                                    <TableCell className="font-medium">{session.name}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{session.current_stage}</Badge>
                                    </TableCell>
                                    <TableCell>{session.engagement_score}</TableCell>
                                    <TableCell>{session.institution_name}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Link href={`/platform-admin/outreach/sandbox/${session.session_id}`}>
                                            <Button size="sm" variant="secondary">
                                                Open
                                            </Button>
                                        </Link>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-destructive hover:bg-destructive/10"
                                            onClick={() => handleDelete(session.session_id)}
                                            disabled={deletingId === session.session_id}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}
