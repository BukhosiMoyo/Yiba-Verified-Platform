
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Check, X, Clock, AlertCircle, Save, Lock, Loader2, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type AttendanceStatus = "PRESENT" | "LATE" | "ABSENT" | "SICK" | "EXCUSED" | null;

type RegisterItem = {
    enrolment_id: string;
    learner: {
        first_name: string;
        last_name: string;
        id_number: string;
    };
    attendance: {
        status: AttendanceStatus;
        minutes_late: number | null;
    } | null;
};

type SessionData = {
    session_id: string;
    date: string;
    start_time: string;
    end_time: string;
    session_type: string;
    is_locked: boolean;
    cohort_name: string;
};

interface SessionRegisterProps {
    sessionId: string;
}

export function SessionRegister({ sessionId }: SessionRegisterProps) {
    const router = useRouter();
    const [session, setSession] = useState<SessionData | null>(null);
    const [register, setRegister] = useState<RegisterItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isLocked, setIsLocked] = useState(false);

    // Local state for edits
    const [edits, setEdits] = useState<Record<string, { status: AttendanceStatus; minutes_late: number | null }>>({});

    useEffect(() => {
        fetchRegister();
    }, [sessionId]);

    const fetchRegister = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/institution/attendance/session/${sessionId}`);
            if (res.ok) {
                const data = await res.json();
                setSession(data.session);
                setRegister(data.register);
                setIsLocked(data.session.is_locked);

                // Initialize edits with existing data
                const initialEdits: Record<string, any> = {};
                data.register.forEach((item: RegisterItem) => {
                    initialEdits[item.enrolment_id] = {
                        status: item.attendance?.status || null,
                        minutes_late: item.attendance?.minutes_late || null
                    };
                });
                setEdits(initialEdits);
            } else {
                toast.error("Failed to load session details");
            }
        } catch (error) {
            console.error("Failed to fetch register:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = (enrolmentId: string, status: AttendanceStatus) => {
        if (isLocked) return;
        setEdits(prev => ({
            ...prev,
            [enrolmentId]: {
                ...prev[enrolmentId],
                status,
                // Reset minutes late if not late
                minutes_late: status === "LATE" ? (prev[enrolmentId]?.minutes_late || 15) : null
            }
        }));
    };

    const handleMinutesLateChange = (enrolmentId: string, minutes: number) => {
        if (isLocked) return;
        setEdits(prev => ({
            ...prev,
            [enrolmentId]: {
                ...prev[enrolmentId],
                minutes_late: minutes
            }
        }));
    };

    const markAll = (status: AttendanceStatus) => {
        if (isLocked) return;
        const newEdits = { ...edits };
        register.forEach(item => {
            // Only update if not already set (or overwrite? usually Mark All overwrites empty ones, or all?)
            // "Mark All Present" usually sets everyone to present.
            // But maybe preserve existing SICK/EXCUSED?
            // Let's overwrite all for simplicity, user can adjust exceptions.
            newEdits[item.enrolment_id] = {
                status,
                minutes_late: null
            };
        });
        setEdits(newEdits);
    };

    const save = async (lockSession = false) => {
        setSaving(true);
        try {
            const updates = Object.entries(edits)
                .filter(([_, val]) => val.status !== null) // Only send marked records
                .map(([enrolment_id, val]) => ({
                    enrolment_id,
                    status: val.status,
                    minutes_late: val.minutes_late
                }));

            const res = await fetch("/api/institution/attendance/mark", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    session_id: sessionId,
                    records: updates,
                    is_locking: lockSession
                })
            });

            if (!res.ok) throw new Error("Failed to save");

            toast.success(lockSession ? "Attendance saved and session locked" : "Attendance saved");
            fetchRegister(); // Refresh
        } catch (error) {
            toast.error("Failed to save attendance");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 space-y-4">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-64 w-full" />
    </div>;

    if (!session) return <div>Session not found</div>;

    const totalLearners = register.length;
    const markedCount = Object.values(edits).filter(e => e.status !== null).length;
    const presentCount = Object.values(edits).filter(e => e.status === "PRESENT").length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between gap-4 md:items-start">
                <div>
                    <h2 className="text-2xl font-bold">{session.cohort_name}</h2>
                    <div className="flex items-center gap-3 text-muted-foreground mt-1">
                        <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {format(new Date(session.date), "MMM d, yyyy")} • {session.start_time} - {session.end_time}</span>
                        <Badge variant="outline">{session.session_type}</Badge>
                        {isLocked && <Badge variant="secondary"><Lock className="h-3 w-3 mr-1" /> Locked</Badge>}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {!isLocked && (
                        <>
                            <Button variant="outline" onClick={() => markAll("PRESENT")}>Mark All Present</Button>
                            <Button onClick={() => save(false)} disabled={saving}>
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                Save Changes
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Stats / Controls */}
            <Card>
                <div className="p-4 flex items-center justify-between text-sm">
                    <div>
                        <span className="font-medium">{markedCount}/{totalLearners}</span> marked
                        <span className="mx-2 text-muted-foreground">•</span>
                        <span className="text-green-600 font-medium">{presentCount}</span> Present
                    </div>
                    {!isLocked && (
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => {
                            if (confirm("Locking this session will prevent further changes. Continue?")) {
                                save(true);
                            }
                        }}>
                            <Lock className="h-3 w-3 mr-2" /> Finalize & Lock
                        </Button>
                    )}
                </div>
            </Card>

            {/* Register List */}
            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Learner</TableHead>
                            <TableHead>ID Number</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Late (Min)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {register.map((item) => {
                            const currentStatus = edits[item.enrolment_id]?.status;
                            const isLate = currentStatus === "LATE";

                            return (
                                <TableRow key={item.enrolment_id}>
                                    <TableCell className="font-medium">
                                        {item.learner.first_name} {item.learner.last_name}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-xs">
                                        {item.learner.id_number}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <StatusButton
                                                active={currentStatus === "PRESENT"}
                                                onClick={() => handleStatusChange(item.enrolment_id, "PRESENT")}
                                                disabled={isLocked}
                                                label="Present"
                                                color="bg-green-100 text-green-700 hover:bg-green-200 border-green-200"
                                                activeColor="bg-green-600 text-white border-green-600 ring-2 ring-green-600 ring-offset-1"
                                            >
                                                P
                                            </StatusButton>
                                            <StatusButton
                                                active={currentStatus === "ABSENT"}
                                                onClick={() => handleStatusChange(item.enrolment_id, "ABSENT")}
                                                disabled={isLocked}
                                                label="Absent"
                                                color="bg-red-100 text-red-700 hover:bg-red-200 border-red-200"
                                                activeColor="bg-red-600 text-white border-red-600 ring-2 ring-red-600 ring-offset-1"
                                            >
                                                A
                                            </StatusButton>
                                            <StatusButton
                                                active={currentStatus === "LATE"}
                                                onClick={() => handleStatusChange(item.enrolment_id, "LATE")}
                                                disabled={isLocked}
                                                label="Late"
                                                color="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200"
                                                activeColor="bg-yellow-500 text-white border-yellow-500 ring-2 ring-yellow-500 ring-offset-1"
                                            >
                                                L
                                            </StatusButton>
                                            <StatusButton
                                                active={currentStatus === "SICK"}
                                                onClick={() => handleStatusChange(item.enrolment_id, "SICK")}
                                                disabled={isLocked}
                                                label="Sick"
                                                color="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200"
                                                activeColor="bg-blue-600 text-white border-blue-600 ring-2 ring-blue-600 ring-offset-1"
                                            >
                                                S
                                            </StatusButton>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {isLate && (
                                            <Input
                                                type="number"
                                                className="w-20 h-8"
                                                placeholder="Min"
                                                value={edits[item.enrolment_id]?.minutes_late || ""}
                                                onChange={(e) => handleMinutesLateChange(item.enrolment_id, parseInt(e.target.value) || 0)}
                                                disabled={isLocked}
                                            />
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}

function StatusButton({ active, onClick, disabled, label, color, activeColor, children }: any) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            title={label}
            type="button"
            className={cn(
                "w-8 h-8 rounded-md flex items-center justify-center font-bold text-sm border transition-all",
                active ? activeColor : color,
                disabled && "opacity-50 cursor-not-allowed"
            )}
        >
            {children}
        </button>
    );
}
