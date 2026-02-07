"use client";

import { useEffect, useState } from "react";
import { SandboxSession, SandboxMessage } from "@/lib/outreach/sandbox/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, Mail, MousePointer, RotateCcw, Send, Settings, SkipForward, User } from "lucide-react";
import { Separator } from "@/components/ui/separator";

// Mock Data for scaffolding
const MOCK_SESSION: SandboxSession = {
    session_id: "1",
    name: "Test Session A",
    institution_name: "Acme University",
    current_stage: "UNCONTACTED",
    engagement_score: 0,
    created_at: new Date(),
    ai_enabled: true
};

export default function SandboxWorkspace({ params }: { params: { sessionId: string } }) {
    const [session, setSession] = useState<SandboxSession>(MOCK_SESSION);
    const [messages, setMessages] = useState<SandboxMessage[]>([]);
    const [activeTab, setActiveTab] = useState("inbox");

    // In sim, we would call Server Actions to trigger events or generate drafts
    const handleGenerate = () => {
        console.log("Generatign draft...");
    };

    const handleSimulateAction = (action: string) => {
        console.log("Simulating:", action);
    };

    return (
        <div className="h-[calc(100vh-100px)] grid grid-cols-1 md:grid-cols-2 gap-6 p-2">

            {/* LEFT COLUMN: Admin Brain */}
            <div className="flex flex-col space-y-4 overflow-y-auto pr-2">
                <Card className="border-l-4 border-l-purple-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex justify-between">
                            <span>Admin Brain</span>
                            <Badge variant={session.ai_enabled ? "default" : "secondary"}>
                                AI {session.ai_enabled ? "ON" : "OFF"}
                            </Badge>
                        </CardTitle>
                        <CardDescription>{session.institution_name}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-muted rounded-lg">
                                <div className="text-xs text-muted-foreground">Current Stage</div>
                                <div className="font-bold text-lg">{session.current_stage}</div>
                            </div>
                            <div className="p-3 bg-muted rounded-lg">
                                <div className="text-xs text-muted-foreground">Engagement Score</div>
                                <div className="font-bold text-lg">{session.engagement_score}</div>
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                            <h4 className="text-sm font-medium flex items-center gap-2">
                                <Bot className="h-4 w-4" /> Next Action Recommendation
                            </h4>
                            <div className="bg-slate-50 dark:bg-slate-900 border rounded p-3 text-sm">
                                AI suggests sending <strong>Initial Outreach (Template V2)</strong> based on UNCONTACTED state.
                            </div>
                            <Button className="w-full" onClick={handleGenerate}>
                                Generate Next Message
                            </Button>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                            <h4 className="text-sm font-medium flex items-center gap-2">
                                <Settings className="h-4 w-4" /> Simulation Controls
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleSimulateAction("RESET")}>
                                    <RotateCcw className="mr-2 h-4 w-4" /> Reset
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleSimulateAction("TIME_+3D")}>
                                    <SkipForward className="mr-2 h-4 w-4" /> +3 Days
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Event Log Visualization */}
                <Card className="flex-1">
                    <CardHeader>
                        <CardTitle className="text-sm">Event Log</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-muted-foreground space-y-2">
                            {/* Map logs here */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-mono">10:00 AM</span>
                                <Badge variant="outline">SESSION_CREATED</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* RIGHT COLUMN: Recipient Simulator */}
            <div className="flex flex-col border rounded-xl overflow-hidden shadow-sm bg-background">
                <div className="bg-slate-100 dark:bg-slate-800 p-2 border-b flex items-center gap-2 px-4">
                    <User className="h-4 w-4" />
                    <span className="text-sm font-medium">Recipient View (Simulation)</span>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                    <div className="border-b px-4">
                        <TabsList className="bg-transparent">
                            <TabsTrigger value="inbox" className="data-[state=active]:bg-background">Inbox</TabsTrigger>
                            <TabsTrigger value="landing" className="data-[state=active]:bg-background">Landing Page</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="inbox" className="flex-1 p-4 bg-slate-50/50">
                        {messages.length === 0 ? (
                            <div className="text-center py-20 text-muted-foreground">
                                <Mail className="h-10 w-10 mx-auto mb-2 opacity-20" />
                                Inbox is empty. Generate a message to start.
                            </div>
                        ) : (
                            // Render Fake Emails
                            <div className="space-y-4">
                                {messages.map(msg => (
                                    <Card key={msg.message_id} className="cursor-pointer hover:border-primary/50 transition-colors">
                                        <CardHeader className="p-4 pb-2">
                                            <div className="flex justify-between items-start">
                                                <div className="font-semibold">{msg.from_name}</div>
                                                <div className="text-xs text-muted-foreground">Just now</div>
                                            </div>
                                            <div className="text-sm font-medium">{msg.subject}</div>
                                        </CardHeader>
                                        <CardContent className="p-4 pt-0">
                                            <div className="text-xs text-muted-foreground line-clamp-1">{msg.preview_text}</div>
                                            <div className="mt-3 flex gap-2">
                                                <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={() => handleSimulateAction("OPEN")}>
                                                    Simulate Open
                                                </Button>
                                                <Button size="sm" className="h-7 text-xs" onClick={() => {
                                                    handleSimulateAction("CLICK");
                                                    setActiveTab("landing");
                                                }}>
                                                    <MousePointer className="mr-1 h-3 w-3" /> Simulate Click
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="landing" className="flex-1 p-4">
                        <div className="border border-dashed h-full rounded flex items-center justify-center bg-slate-50">
                            <div className="text-center max-w-sm">
                                <h3 className="font-semibold mb-2">Landing Page Simulation</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Simulates the questionnaire flow. Completing this will trigger "Form Submitted" events.
                                </p>
                                <Button>Start Questionnaire</Button>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
"use client";

import { SandboxSession, SandboxMessage } from "@/lib/outreach/sandbox/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, Mail, MousePointer, RotateCcw, Send, Settings, SkipForward, User } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { getSandboxSession } from "../actions";
import { WorkspaceClient } from "../_components/WorkspaceClient";

export default async function SandboxWorkspace({ params }: { params: { sessionId: string } }) {
    // 1. Fetch Real Data
    const sessionData = await getSandboxSession(params.sessionId);

    if (!sessionData) return <div>Session not found</div>;

    // 2. Cast to types (Prisma -> Interface)
    const session: SandboxSession = sessionData as any;
    const messages: SandboxMessage[] = sessionData.messages as any;
    const events = sessionData.events;

    // 3. Render Client Wrapper for Interactivity
    return (
        <WorkspaceClient
            session={session}
            messages={messages}
            events={events} // Pass events for log
        />
    );
}
