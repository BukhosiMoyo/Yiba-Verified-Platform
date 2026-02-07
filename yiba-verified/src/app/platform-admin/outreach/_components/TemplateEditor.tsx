import { EmailTemplateStage } from "@/lib/outreach/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AIInstructionsEditor } from "./AIInstructionsEditor";

interface TemplateEditorProps {
    template: EmailTemplateStage;
    onChange: (updated: EmailTemplateStage) => void;
}

export function TemplateEditor({ template, onChange }: TemplateEditorProps) {
    const handleChange = (field: keyof EmailTemplateStage, value: any) => {
        onChange({ ...template, [field]: value });
    };

    return (
        <div className="space-y-6 p-6 max-w-2xl mx-auto">
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="subject">Subject Line</Label>
                    <Input
                        id="subject"
                        value={template.subject_line}
                        onChange={(e) => handleChange("subject_line", e.target.value)}
                        placeholder="Enter engaging subject..."
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="preview">Preview Text</Label>
                    <Input
                        id="preview"
                        value={template.preview_text}
                        onChange={(e) => handleChange("preview_text", e.target.value)}
                        placeholder="Text shown in inbox preview..."
                    />
                    <p className="text-xs text-muted-foreground">
                        Keep under 90 characters for best results.
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="body">Email Body (HTML Supported)</Label>
                    <Textarea
                        id="body"
                        value={template.body_html}
                        onChange={(e) => handleChange("body_html", e.target.value)}
                        placeholder="Type your email content here..."
                        className="font-mono text-sm h-[300px]"
                    />
                </div>
            </div>

            <div className="border-t pt-6">
                <AIInstructionsEditor
                    instructions={template.ai_instructions}
                    onChange={(newInstructions) => handleChange("ai_instructions", newInstructions)}
                />
            </div>
        </div>
    );
}
