import { OutreachEvent, OutreachEventType } from "@/lib/outreach/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Mail,
    Eye,
    MousePointer,
    FileText,
    Bot,
    ArrowRight,
    XCircle,
    CheckCheck,
    Ban,
    AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface JourneyTimelineProps {
    events: OutreachEvent[];
}

export function JourneyTimeline({ events }: JourneyTimelineProps) {
    const getEventIcon = (type: OutreachEventType) => {
        switch (type) {
            case OutreachEventType.EMAIL_SENT:
                return Mail;
            case OutreachEventType.EMAIL_OPENED:
                return Eye;
            case OutreachEventType.LINK_CLICKED:
                return MousePointer;
            case OutreachEventType.FORM_SUBMITTED:
                return FileText;
            case OutreachEventType.AI_EMAIL_GENERATED:
                return Bot;
            case OutreachEventType.STAGE_CHANGED:
                return ArrowRight;
            case OutreachEventType.DECLINED:
                return XCircle;
            case OutreachEventType.CONVERTED:
                return CheckCheck;
            case OutreachEventType.UNSUBSCRIBED:
                return Ban;
            case OutreachEventType.BOUNCED:
                return AlertCircle;
            default:
                return AlertCircle;
        }
    };

    const getEventColor = (type: OutreachEventType) => {
        switch (type) {
            case OutreachEventType.EMAIL_SENT:
                return "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400";
            case OutreachEventType.EMAIL_OPENED:
                return "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400";
            case OutreachEventType.LINK_CLICKED:
                return "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400";
            case OutreachEventType.FORM_SUBMITTED:
                return "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400";
            case OutreachEventType.AI_EMAIL_GENERATED:
                return "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400";
            case OutreachEventType.STAGE_CHANGED:
                return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
            case OutreachEventType.DECLINED:
                return "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400";
            case OutreachEventType.CONVERTED:
                return "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400";
            default:
                return "bg-gray-100 text-gray-600";
        }
    };

    const sortedEvents = [...events].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Journey Timeline</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <ScrollArea className="h-[600px] px-6">
                    <div className="relative border-l border-muted pl-6 pb-6 pt-2 space-y-8">
                        {sortedEvents.map((event) => {
                            const Icon = getEventIcon(event.event_type);
                            return (
                                <div key={event.event_id} className="relative">
                                    <span
                                        className={cn(
                                            "absolute -left-[41px] flex h-8 w-8 items-center justify-center rounded-full border bg-background",
                                            getEventColor(event.event_type)
                                        )}
                                    >
                                        <Icon className="h-4 w-4" />
                                    </span>
                                    <div className="flex flex-col space-y-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium">
                                                {event.event_type.replace(/_/g, " ")}
                                            </p>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(event.timestamp).toLocaleString()}
                                            </span>
                                        </div>
                                        {event.description && (
                                            <p className="text-sm text-foreground/80">
                                                {event.description}
                                            </p>
                                        )}
                                        {event.triggered_by === "AI" && (
                                            <div className="flex items-center text-xs text-indigo-600 dark:text-indigo-400">
                                                <Bot className="mr-1 h-3 w-3" />
                                                AI Generated
                                            </div>
                                        )}
                                        {event.metadata && Object.keys(event.metadata).length > 0 && (
                                            <div className="mt-2 rounded-md bg-muted/50 p-2 text-xs font-mono text-muted-foreground">
                                                {JSON.stringify(event.metadata, null, 2)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {sortedEvents.length === 0 && (
                            <div className="text-center text-muted-foreground text-sm py-8">
                                No activity recorded yet
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
