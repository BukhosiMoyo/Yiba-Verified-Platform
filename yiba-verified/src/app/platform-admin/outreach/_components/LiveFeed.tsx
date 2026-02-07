"use client";

import { GeneratedContentLog } from "@/lib/outreach/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, User } from "lucide-react";

interface LiveFeedProps {
    logs: GeneratedContentLog[];
}

export function LiveFeed({ logs }: LiveFeedProps) {
    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    Live Generation Feed
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                    <div className="divide-y">
                        {logs.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">
                                Waiting for generation events...
                            </div>
                        ) : (
                            logs.map((log) => (
                                <div key={log.log_id} className="p-4 hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2 text-sm font-medium">
                                            <Bot className="h-4 w-4 text-purple-500" />
                                            generated for
                                            <span className="flex items-center gap-1 text-muted-foreground">
                                                <User className="h-3 w-3" />
                                                {log.target_institution}
                                            </span>
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(log.generated_at).toLocaleTimeString()}
                                        </span>
                                    </div>
                                    <div className="relative bg-slate-50 dark:bg-slate-900 rounded p-3 text-xs font-mono text-muted-foreground line-clamp-2">
                                        {log.content_snippet}
                                    </div>
                                    <div className="mt-2 flex items-center gap-2">
                                        <Badge variant="outline" className="text-[10px]">
                                            {log.prompt_template}
                                        </Badge>
                                        <Badge
                                            variant="secondary"
                                            className={`text-[10px] ${log.sentiment_score > 0.5 ? 'text-green-600 bg-green-50' : 'text-amber-600 bg-amber-50'}`}
                                        >
                                            Sentiment: {(log.sentiment_score * 100).toFixed(0)}%
                                        </Badge>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
