
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Calendar, Clock, MapPin, Lock, Unlock, MoreHorizontal, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateSessionModal } from "./CreateSessionModal";

type ClassSession = {
    session_id: string;
    date: string;
    start_time: string | null;
    end_time: string | null;
    session_type: string;
    location: string | null;
    is_locked: boolean;
    _count: {
        attendanceRecords: number;
    };
};

interface CohortSessionsListProps {
    cohortId: string;
}

export function CohortSessionsList({ cohortId }: CohortSessionsListProps) {
    const router = useRouter();
    const [sessions, setSessions] = useState<ClassSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        fetchSessions();
    }, [cohortId]);

    const fetchSessions = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/institution/class-sessions?cohort_id=${cohortId}`);
            if (res.ok) {
                const data = await res.json();
                setSessions(data);
            }
        } catch (error) {
            console.error("Failed to fetch sessions:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Class Sessions</h3>
                <Button onClick={() => setShowCreateModal(true)} size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Schedule Session
                </Button>
            </div>

            <Card>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Attendance</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-[80px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-[50px]" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                                    </TableRow>
                                ))
                            ) : sessions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        No sessions scheduled.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                sessions.map((session) => (
                                    <TableRow key={session.session_id}>
                                        <TableCell className="font-medium">
                                            {format(new Date(session.date), "EEE, MMM d, yyyy")}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center text-sm text-muted-foreground">
                                                <Clock className="mr-1.5 h-3.5 w-3.5" />
                                                {session.start_time} - {session.end_time}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{session.session_type}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            {session.location && (
                                                <div className="flex items-center text-sm text-muted-foreground">
                                                    <MapPin className="mr-1.5 h-3.5 w-3.5" />
                                                    {session.location}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {session._count.attendanceRecords > 0 ? (
                                                <div className="flex items-center gap-1.5 text-green-600">
                                                    <CheckCircle2 className="h-4 w-4" />
                                                    <span className="text-sm font-medium">{session._count.attendanceRecords} marked</span>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-muted-foreground">Not marked</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {session.is_locked ? (
                                                <Badge variant="secondary" className="gap-1">
                                                    <Lock className="h-3 w-3" /> Locked
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="gap-1 border-dashed">
                                                    <Unlock className="h-3 w-3" /> Open
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => router.push(`/institution/attendance/session/${session.session_id}`)}>
                                                        Mark Attendance
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    {session.is_locked ? (
                                                        <DropdownMenuItem disabled>Unlock Session</DropdownMenuItem>
                                                    ) : (
                                                        <DropdownMenuItem className="text-red-600">Lock Session</DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            <CreateSessionModal
                cohortId={cohortId}
                open={showCreateModal}
                onOpenChange={setShowCreateModal}
                onSuccess={fetchSessions}
            />
        </div>
    );
}
