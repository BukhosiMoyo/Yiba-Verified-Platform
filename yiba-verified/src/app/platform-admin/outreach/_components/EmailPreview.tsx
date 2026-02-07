import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, Monitor } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EmailPreviewProps {
    subject: string;
    previewText: string;
    bodyHtml: string;
}

export function EmailPreview({ subject, previewText, bodyHtml }: EmailPreviewProps) {
    const [view, setView] = useState("desktop");

    return (
        <div className="flex flex-col h-full bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden border">
            <div className="bg-background border-b p-2 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground ml-2">Preview</span>
                <Tabs value={view} onValueChange={setView} className="w-[200px]">
                    <TabsList className="grid w-full grid-cols-2 h-8">
                        <TabsTrigger value="desktop" className="text-xs">
                            <Monitor className="h-3 w-3 mr-1" /> Desktop
                        </TabsTrigger>
                        <TabsTrigger value="mobile" className="text-xs">
                            <Phone className="h-3 w-3 mr-1" /> Mobile
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex justify-center">
                <div className="w-full max-w-[600px] bg-white text-slate-900 rounded shadow-sm flex flex-col min-h-[400px]">
                    {/* Email Header Simulation */}
                    <div className="border-b p-4 space-y-1">
                        <div className="text-xs text-slate-500">Subject:</div>
                        <div className="font-semibold text-sm">{subject || "(No subject)"}</div>
                        <div className="text-xs text-slate-400 truncate">{previewText}</div>
                    </div>

                    {/* Email Body */}
                    <div
                        className="p-6 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: bodyHtml || "<p class='text-slate-400 italic'>Start typing to preview...</p>" }}
                    />

                    {/* Footer Simulation */}
                    <div className="mt-auto border-t p-4 bg-slate-50 text-xs text-center text-slate-400">
                        <p>Sent by Yiba Verified • Unsubscribe</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
