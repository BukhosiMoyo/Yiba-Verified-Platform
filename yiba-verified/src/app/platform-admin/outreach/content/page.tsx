"use client";

import { useEffect, useState } from "react";
import { StageList } from "../_components/StageList";
import { TemplateEditor } from "../_components/TemplateEditor";
import { EmailPreview } from "../_components/EmailPreview";
import { VersionControl } from "../_components/VersionControl";
import { awarenessApi } from "@/lib/outreach/api";
import {
    EmailTemplateStage,
    EngagementStage,
    TemplateStatus,
} from "@/lib/outreach/types";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";

export default function ContentStudioPage() {
    const [templates, setTemplates] = useState<EmailTemplateStage[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStage, setSelectedStage] = useState<EngagementStage>(
        EngagementStage.UNCONTACTED
    );
    const [currentTemplate, setCurrentTemplate] = useState<EmailTemplateStage | null>(
        null
    );
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        loadTemplates();
    }, []);

    useEffect(() => {
        if (templates.length > 0) {
            const template = templates.find((t) => t.stage === selectedStage);
            // If no template exists for this stage, create a blank draft in memory
            if (!template) {
                setCurrentTemplate({
                    stage_id: `new_${selectedStage}`,
                    stage: selectedStage,
                    version: 1,
                    status: TemplateStatus.DRAFT,
                    subject_line: "",
                    preview_text: "",
                    body_html: "",
                    cta_url: "",
                    eligibility_rules: {},
                    ai_instructions: {
                        tone: "",
                        references: [],
                        forbidden_content: [],
                    },
                    created_at: new Date(),
                    published_at: null,
                    created_by: "current_user",
                });
            } else {
                setCurrentTemplate(template);
            }
            setHasChanges(false);
        }
    }, [selectedStage, templates]);

    const loadTemplates = async () => {
        setLoading(true);
        try {
            const data = await awarenessApi.getTemplates();
            setTemplates(data);
        } catch (error) {
            console.error("Failed to load templates:", error);
            toast.error("Failed to load templates");
        } finally {
            setLoading(false);
        }
    };

    const handleTemplateChange = (updated: EmailTemplateStage) => {
        setCurrentTemplate(updated);
        setHasChanges(true);
    };

    const handleSave = async () => {
        if (!currentTemplate) return;
        try {
            await awarenessApi.updateTemplate(currentTemplate);
            toast.success("Draft saved successfully");
            setHasChanges(false);
            // Refresh list to show updated version/status if needed
            loadTemplates();
        } catch (error) {
            toast.error("Failed to save draft");
        }
    };

    const handlePublish = async () => {
        if (!currentTemplate) return;
        try {
            // First save if changed
            if (hasChanges) {
                await awarenessApi.updateTemplate(currentTemplate);
            }
            await awarenessApi.publishTemplate(currentTemplate.stage);
            toast.success("Template published!");
            loadTemplates();
        } catch (error) {
            toast.error("Failed to publish template");
        }
    };

    if (loading && templates.length === 0) {
        return (
            <div className="flex h-[calc(100vh-200px)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-140px)] border rounded-lg overflow-hidden bg-background flex">
            <StageList
                currentStage={selectedStage}
                onSelectStage={setSelectedStage}
                templates={templates}
            />

            <div className="flex-1 flex flex-col min-w-0">
                {currentTemplate ? (
                    <>
                        <VersionControl
                            version={currentTemplate.version}
                            status={currentTemplate.status}
                            hasChanges={hasChanges}
                            onSave={handleSave}
                            onPublish={handlePublish}
                        />
                        <ResizablePanelGroup direction="horizontal">
                            <ResizablePanel defaultSize={50} minSize={30}>
                                <div className="h-full overflow-y-auto">
                                    <TemplateEditor
                                        template={currentTemplate}
                                        onChange={handleTemplateChange}
                                    />
                                </div>
                            </ResizablePanel>
                            <ResizableHandle />
                            <ResizablePanel defaultSize={50} minSize={30}>
                                <div className="h-full bg-slate-50/50 dark:bg-slate-900/50 p-6">
                                    <EmailPreview
                                        subject={currentTemplate.subject_line}
                                        previewText={currentTemplate.preview_text}
                                        bodyHtml={currentTemplate.body_html}
                                    />
                                </div>
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                        Select a stage to edit content
                    </div>
                )}
            </div>
        </div>
    );
}
