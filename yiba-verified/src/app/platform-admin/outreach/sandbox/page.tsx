
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Play, Plus, Trash2, LayoutGrid, List } from "lucide-react";
import Link from "next/link";
import { getSandboxSessions, createSandboxSession, deleteSession } from "./actions";
import { CreateSessionDialog } from "./_components/CreateSessionDialog";
import { Badge } from "@/components/ui/badge";
import { SandboxSessionList } from "./_components/SandboxSessionList";

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
                <div className="flex items-center gap-2">
                    <CreateSessionDialog />
                </div>
            </div>

            <SandboxSessionList sessions={sessions} />
        </div>
    );
}
