"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Plus } from "lucide-react";
import Link from "next/link";
import { getSandboxSessions, createSandboxSession } from "./actions";
import { CreateSessionDialog } from "./_components/CreateSessionDialog";

export const dynamic = 'force-dynamic';

export default async function SandboxHomePage() {
    const sessions = await getSandboxSessions();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Outreach Simulator</h2>
                    <p className="text-muted-foreground">
                        Test engagement flows in a safe, isolated sandbox environment.
                    </p>
                </div>
                <CreateSessionDialog />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                {sessions.map((session: any) => (
                    <Card key={session.session_id}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{session.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{session.current_stage}</div>
                            <p className="text-xs text-muted-foreground">
                                Score: {session.engagement_score} • {session.institution_name}
                            </p>
                            <div className="mt-4 flex space-x-2">
                                <Link href={`/platform-admin/outreach/sandbox/${session.session_id}`}>
                                    <Button size="sm" className="w-full">
                                        <Play className="mr-2 h-4 w-4" /> Open
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {sessions.length === 0 && (
                    <Card className="col-span-full border-dashed p-8 text-center bg-gray-50 dark:bg-zinc-900">
                        <div className="text-muted-foreground">No sandbox sessions found. Create one to start testing.</div>
                    </Card>
                )}
            </div>
        </div>
    );
}
