'use client';

import { SandboxSession, SandboxMessage } from "@/lib/outreach/sandbox/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, Mail, MousePointer, RotateCcw, Settings, SkipForward, User } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useState, useTransition } from "react";
import { generateNextMessage, resetSession, advanceTime, simulateEvent, simulateConversion } from "../actions";
import { OutreachEventType } from "@/lib/outreach/types";

// Client Component to handle interactions
export function WorkspaceClient({ session, messages, events }: { session: SandboxSession; messages: SandboxMessage[]; events: any[] }) {
    const [activeTab, setActiveTab] = useState("inbox");
    const [isPending, startTransition] = useTransition();

    const handleGenerate = () => {
        startTransition(async () => {
            await generateNextMessage(session.session_id);
        });
    };

    const handleReset = () => {
        startTransition(async () => await resetSession(session.session_id));
    };

    const handleAdvanceTime = () => {
        startTransition(async () => await advanceTime(session.session_id, 3));
    };

    const handleEvent = (type: string, metadata: any = {}) => {
        startTransition(async () => {
            await simulateEvent(session.session_id, type as OutreachEventType, metadata);
            if (type === 'LINK_CLICKED') setActiveTab("landing");
        });
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
                            <div className="flex justify-between items-center">
                                <h4 className="text-sm font-medium flex items-center gap-2">
                                    <Bot className="h-4 w-4" /> Recommendation
                                </h4>
                                <Button size="sm" onClick={handleGenerate} disabled={isPending}>
                                    Generate
                                </Button>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900 border rounded p-3 text-sm">
                                AI is ready to draft based on latest event.
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                            <h4 className="text-sm font-medium flex items-center gap-2">
                                <Settings className="h-4 w-4" /> Controls
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                                <Button variant="outline" size="sm" onClick={handleReset} disabled={isPending}>
                                    <RotateCcw className="mr-2 h-4 w-4" /> Reset
                                </Button>
                                <Button variant="outline" size="sm" onClick={handleAdvanceTime} disabled={isPending}>
                                    <SkipForward className="mr-2 h-4 w-4" /> +3 Days
                                </Button>
                                <Button className="col-span-2 bg-green-600 hover:bg-green-700" size="sm" onClick={() => startTransition(async () => await simulateConversion(session.session_id))} disabled={isPending}>
                                    Mark as Signed Up (Convert)
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
                        <div className="text-sm text-muted-foreground space-y-2 max-h-[300px] overflow-y-auto">
                            {events.map((evt: any) => (
                                <div key={evt.event_id} className="flex items-center gap-2">
                                    <span className="text-xs font-mono opacity-50">
                                        {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <Badge variant="outline" className="text-[10px]">{evt.event_type}</Badge>
                                    {evt.metadata?.scoreDelta ? (
                                        <span className="text-[10px] text-green-600">+{evt.metadata.scoreDelta}</span>
                                    ) : null}
                                </div>
                            ))}
                            {events.length === 0 && <div className="text-xs opacity-50">No events yet.</div>}
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
                                Inbox is empty.
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
                                            <div className="text-xs text-muted-foreground line-clamp-2">{msg.body_html.substring(0, 100)}...</div>
                                            <div className="mt-3 flex gap-2">
                                                <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={() => handleEvent("EMAIL_OPENED")}>
                                                    Open
                                                </Button>
                                                <Button size="sm" className="h-7 text-xs" onClick={() => handleEvent("LINK_CLICKED")}>
                                                    <MousePointer className="mr-1 h-3 w-3" /> Click Link
                                                </Button>
                                                <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => handleEvent("DECLINED")}>
                                                    Decline
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
                                <h3 className="font-semibold mb-2">Simulated Landing Page</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Simulating the questionnaire flow here triggers logic.
                                </p>
                                <Button onClick={() => handleEvent("QUESTIONNAIRE_COMPLETED")}>
                                    Complete Questionnaire
                                </Button>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
