'use client';

import { SandboxSession, SandboxMessage } from "@/lib/outreach/sandbox/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, Mail, MousePointer, RotateCcw, Settings, SkipForward, User, Activity, Zap, Terminal, Globe, Smartphone, Monitor, CheckCircle2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useState, useTransition } from "react";
import { generateNextMessage, resetSession, advanceTime, simulateEvent, simulateConversion } from "../actions";
import { OutreachEventType, Questionnaire } from "@/lib/outreach/types";
import { QuestionnaireRenderer } from "@/app/questionnaire/[slug]/_components/QuestionnaireRenderer";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// Client Component to handle interactions
export function WorkspaceClient({ session, messages, events, questionnaire }: { session: SandboxSession; messages: SandboxMessage[]; events: any[]; questionnaire?: Questionnaire }) {
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
        <div className="h-[calc(100vh-100px)] flex flex-col md:flex-row gap-6 p-4">

            {/* LEFT COLUMN: THE BRAIN (Control Room) */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="w-full md:w-1/2 lg:w-[40%] flex flex-col space-y-6 overflow-y-auto pr-2 custom-scrollbar"
            >
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-lg shadow-lg shadow-purple-500/30 border border-white/10 ring-1 ring-black/5">
                        <Terminal className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase italic">Admin Brain</h2>
                        <p className="text-xs font-bold text-slate-500 tracking-wider uppercase">Sandbox Control Intelligence</p>
                    </div>
                </div>

                <Card className="border-none shadow-2xl bg-white dark:bg-slate-900 relative overflow-hidden group ring-1 ring-slate-900/5 dark:ring-white/10">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-purple-500 to-indigo-600"></div>
                    <div className="absolute -top-24 -right-24 h-48 w-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    <CardHeader className="pb-4 relative z-10">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                    {session.institution_name}
                                </CardTitle>
                                <CardDescription className="mt-1 flex items-center gap-2 font-medium">
                                    <Globe className="h-3.5 w-3.5 text-purple-500" /> Outreach Simulation Logic
                                </CardDescription>
                            </div>
                            <div className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm backdrop-blur-md",
                                session.ai_enabled
                                    ? "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400"
                                    : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500"
                            )}>
                                <div className={cn("h-2 w-2 rounded-full", session.ai_enabled ? "bg-green-500 animate-pulse" : "bg-slate-400")} />
                                <span className="text-[10px] font-black tracking-widest uppercase">
                                    AI {session.ai_enabled ? "ONLINE" : "STANDBY"}
                                </span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6 relative z-10">
                        <div className="grid grid-cols-2 gap-4">
                            {/* Visual Gauge for Engagement Score */}
                            <div className="p-5 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner relative overflow-hidden flex flex-col justify-between h-[120px]">
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 z-10">Engagement Level</div>
                                <div className="absolute right-0 bottom-0 opacity-10">
                                    <Zap className="h-24 w-24 text-slate-900 dark:text-white rotate-12 translate-x-4 translate-y-4" />
                                </div>
                                <div className="flex items-end gap-1 z-10">
                                    <span className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
                                        {session.engagement_score}
                                    </span>
                                    <span className="text-xs font-bold text-slate-500 mb-1.5">%</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-2 z-10">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${session.engagement_score}%` }}
                                        className={cn(
                                            "h-full rounded-full transition-all duration-1000",
                                            session.engagement_score > 75 ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" :
                                                session.engagement_score > 40 ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" :
                                                    "bg-slate-400"
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Current State Card */}
                            <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between h-[120px] transition-all hover:shadow-md hover:border-purple-200 dark:hover:border-purple-800 group/card">
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover/card:text-purple-600 transition-colors">Phase Protocol</div>
                                <div className="font-black text-lg text-slate-800 dark:text-slate-100 leading-tight">
                                    {session.current_stage.replace(/_/g, " ")}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                                    <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">Active</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-200/50 dark:border-slate-700/50">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="text-xs font-black flex items-center gap-2 uppercase tracking-tight text-slate-900 dark:text-white">
                                        <Bot className="h-4 w-4 text-purple-600" /> AI Oversight
                                    </h4>
                                    <Button
                                        size="sm"
                                        onClick={handleGenerate}
                                        disabled={isPending}
                                        className="h-7 text-[10px] font-black bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-500/20 transition-all active:scale-95 uppercase tracking-widest"
                                    >
                                        <Zap className="mr-1.5 h-3 w-3 fill-current" /> Auto-Draft
                                    </Button>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                                    {isPending ? "Analysing telemetry..." : "Optimal communication path identified. Ready to generate response based on behavioral vectors."}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
                                <Settings className="h-3 w-3" /> Manual Overrides
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                                <Button variant="outline" size="sm" onClick={handleReset} disabled={isPending} className="h-9 text-xs font-bold border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                                    <RotateCcw className="mr-2 h-3.5 w-3.5" /> Full Sync Reset
                                </Button>
                                <Button variant="outline" size="sm" onClick={handleAdvanceTime} disabled={isPending} className="h-9 text-xs font-bold border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                    <SkipForward className="mr-2 h-3.5 w-3.5" /> Warp +3 Days
                                </Button>
                                <Button
                                    className="col-span-2 h-10 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 shadow-lg shadow-emerald-900/20 text-white font-black text-xs uppercase tracking-wide border-none transition-all active:scale-[0.98]"
                                    size="sm"
                                    onClick={() => startTransition(async () => await simulateConversion(session.session_id))}
                                    disabled={isPending}
                                >
                                    <CheckCircle2 className="mr-2 h-4 w-4" /> Force Conversion Event
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Event Log Visualization - Terminal Style */}
                <div className="flex-1 min-h-[300px] flex flex-col">
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-slate-500">
                            System Terminal
                        </h4>
                        <Badge variant="outline" className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500">
                            <Activity className="h-3 w-3 mr-1.5 text-green-500" />
                            LIVE
                        </Badge>
                    </div>
                    <Card className="flex-1 bg-[#1e1e1e] border-slate-800 shadow-inner relative overflow-hidden flex flex-col">
                        <div className="h-6 bg-[#252526] flex items-center px-3 gap-1.5 border-b border-[#333]">
                            <div className="h-2 w-2 rounded-full bg-[#ff5f56]" />
                            <div className="h-2 w-2 rounded-full bg-[#ffbd2e]" />
                            <div className="h-2 w-2 rounded-full bg-[#27c93f]" />
                            <div className="ml-auto text-[10px] font-mono text-slate-500">bash — 80x24</div>
                        </div>
                        <CardContent className="p-4 font-mono text-xs flex-1 overflow-y-auto custom-scrollbar">
                            <div className="space-y-3">
                                {events.length === 0 && (
                                    <div className="text-slate-500 italic">
                                        <span className="text-green-500 pointer-events-none select-none mr-2">$</span>
                                        awaiting_events...
                                    </div>
                                )}
                                {events.map((evt: any, i: number) => {
                                    const evtKey = evt.event_id || `fallback-evt-${i}`;
                                    if (!evt.event_id) {
                                        console.error(`[WorkspaceClient] Missing event_id at index ${i}`, evt);
                                    }
                                    return (
                                        <motion.div
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            key={evtKey}
                                            className="flex gap-2 group"
                                        >
                                            <span className="text-slate-500 select-none shrink-0">
                                                {new Date(evt.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                            </span>
                                            <div className="flex-1 break-words">
                                                <span className={cn(
                                                    "font-bold mr-2",
                                                    evt.event_type.includes('LINK') ? "text-blue-400" :
                                                        evt.event_type.includes('OPEN') ? "text-amber-400" :
                                                            evt.event_type.includes('CONVERT') ? "text-green-400" :
                                                                evt.event_type.includes('SENT') ? "text-purple-400" : "text-slate-300"
                                                )}>
                                                    {">"} {evt.event_type}
                                                </span>
                                                <span className="text-slate-400">{evt.description}</span>
                                                {evt.metadata?.scoreDelta && (
                                                    <span className="ml-2 text-green-500 font-bold">[+{evt.metadata.scoreDelta}pts]</span>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                                {/* Cursor blink */}
                                <motion.div
                                    animate={{ opacity: [0, 1, 0] }}
                                    transition={{ repeat: Infinity, duration: 1 }}
                                    className="h-4 w-2 bg-slate-500 inline-block align-middle ml-1"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </motion.div>

            {/* RIGHT COLUMN: THE FIELD (Recipient Simulator) */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 flex flex-col border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl bg-white dark:bg-slate-950 ring-1 ring-slate-900/5"
            >
                {/* Simulated Browser Header */}
                <div className="bg-slate-100 dark:bg-slate-900/50 p-3 border-b flex items-center justify-between px-6">
                    <div className="flex items-center gap-4">
                        <div className="flex gap-1.5">
                            <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                            <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                            <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                        </div>
                        <div className="bg-white dark:bg-black/20 rounded-md px-3 py-1 flex items-center gap-2 border border-slate-200/50 dark:border-slate-800/50 shadow-sm w-[250px] md:w-[400px]">
                            <Globe className="h-3 w-3 text-muted-foreground" />
                            <span className="text-[10px] font-medium text-slate-500 truncate">https://verified.io/simulation/recipient-{session.session_id.substring(0, 8)}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 p-1 bg-slate-200 dark:bg-slate-800 rounded-md">
                            <Monitor className="h-3 w-3 text-slate-600" />
                            <Smartphone className="h-3 w-3 text-slate-400 opacity-50" />
                        </div>
                        <Badge variant="outline" className="bg-white/50 border-slate-200 text-[10px]">Recipient View</Badge>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                    <div className="px-6 py-2 border-b bg-slate-50/30 dark:bg-slate-900/30 flex items-center justify-between">
                        <TabsList className="bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-xl h-10 w-fit">
                            <TabsTrigger
                                value="inbox"
                                className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm px-6 font-bold text-xs"
                            >
                                <Mail className="h-3.5 w-3.5 mr-2" /> Inbox
                            </TabsTrigger>
                            <TabsTrigger
                                value="landing"
                                className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm px-6 font-bold text-xs"
                            >
                                <Globe className="h-3.5 w-3.5 mr-2" /> Portal
                            </TabsTrigger>
                        </TabsList>
                        <div className="flex items-center gap-4 text-[10px] font-bold tracking-tight text-muted-foreground uppercase">
                            Session Sync: <span className="text-green-500 ml-1 flex items-center gap-1"><span className="h-1 w-1 bg-green-500 rounded-full animate-ping" /> Real-time</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
                        <AnimatePresence mode="wait">
                            <TabsContent value="inbox" className="m-0 focus-visible:outline-none">
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-6"
                                >
                                    {messages.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-32 text-slate-400">
                                            <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-full mb-4">
                                                <Mail className="h-12 w-12 opacity-10" />
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-300 dark:text-slate-800 uppercase tracking-widest">Inbox Protocol Empty</h3>
                                            <p className="text-sm opacity-50">Waiting for Admin Brain to transmit message.</p>
                                        </div>
                                    ) : (
                                        <div className="grid gap-4 max-w-2xl mx-auto">
                                            {messages.map((msg, idx) => {
                                                const msgKey = msg.message_id || `fallback-msg-${idx}`;
                                                if (!msg.message_id) {
                                                    console.error(`[WorkspaceClient] Missing message_id at index ${idx}`, msg);
                                                }
                                                return (
                                                    <motion.div
                                                        key={msgKey}
                                                        initial={{ opacity: 0, x: 20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: idx * 0.1 }}
                                                    >
                                                        <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all hover:border-purple-400/50 group overflow-hidden">
                                                            <CardHeader className="p-5 pb-3">
                                                                <div className="flex justify-between items-center mb-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="h-8 w-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 font-bold text-xs">YT</div>
                                                                        <div>
                                                                            <div className="text-sm font-black text-slate-800 dark:text-slate-100">{msg.from_name}</div>
                                                                            <div className="text-[10px] text-muted-foreground font-medium">To: Recipient (Simulated)</div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full font-bold opacity-70">RECENT</div>
                                                                </div>
                                                                <div className="text-base font-bold text-slate-900 dark:text-slate-100 mt-2">{msg.subject}</div>
                                                            </CardHeader>
                                                            <CardContent className="p-5 pt-0">
                                                                <div className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800/50 font-medium italic">
                                                                    {msg.body_html.replace(/<[^>]*>?/gm, '').substring(0, 180)}...
                                                                </div>
                                                                <div className="mt-5 flex items-center justify-between">
                                                                    <div className="flex gap-2">
                                                                        <Button size="sm" variant="outline" className="h-9 px-5 rounded-xl text-xs font-bold border-slate-200 hover:bg-slate-50 transition-all hover:scale-105 active:scale-95" onClick={() => handleEvent("EMAIL_OPENED")}>
                                                                            Preview Data
                                                                        </Button>
                                                                        <Button size="sm" className="h-9 px-5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/10 transition-all hover:scale-105 active:scale-95" onClick={() => handleEvent("LINK_CLICKED")}>
                                                                            <MousePointer className="mr-2 h-3.5 w-3.5" /> Navigate to Portal
                                                                        </Button>
                                                                    </div>
                                                                    <Button size="sm" variant="ghost" className="h-9 text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleEvent("DECLINED")}>
                                                                        Opt-Out
                                                                    </Button>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </motion.div>
                            </TabsContent>

                            <TabsContent value="landing" className="m-0 focus-visible:outline-none">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 1.05 }}
                                    className="h-full min-h-[500px]"
                                >
                                    {questionnaire ? (
                                        <div className="h-full overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg">
                                            <QuestionnaireRenderer
                                                questionnaire={questionnaire}
                                                onComplete={async (answers) => {
                                                    await handleEvent("QUESTIONNAIRE_COMPLETED", answers);
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 h-[400px] rounded-3xl flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-900/20 px-8 text-center">
                                            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200 dark:shadow-black/50 mb-6">
                                                <Globe className="h-10 w-10 text-slate-300" />
                                            </div>
                                            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter mb-2">Simulated Discovery Page</h3>
                                            <p className="text-sm text-slate-500 max-w-xs mb-8">
                                                No intelligence questionnaire mapped for current state: <b className="text-purple-600">{session.current_stage}</b>
                                            </p>
                                            <div className="flex gap-3">
                                                <Button onClick={() => handleEvent("QUESTIONNAIRE_COMPLETED")} variant="secondary" className="font-bold px-6">
                                                    Simulate Bulk Submission
                                                </Button>
                                                <Button onClick={() => setActiveTab("inbox")} variant="outline" className="font-bold">
                                                    Return to Inbox
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            </TabsContent>
                        </AnimatePresence>
                    </div>
                </Tabs>
            </motion.div>
        </div>
    );
}
