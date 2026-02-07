import { AIInstructions } from "@/lib/outreach/types";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface AIInstructionsEditorProps {
    instructions: AIInstructions;
    onChange: (instructions: AIInstructions) => void;
}

export function AIInstructionsEditor({ instructions, onChange }: AIInstructionsEditorProps) {
    const handleToneChange = (value: string) => {
        onChange({ ...instructions, tone: value });
    };

    const addReference = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const val = e.currentTarget.value.trim();
            if (val && !instructions.references.includes(val)) {
                onChange({
                    ...instructions,
                    references: [...instructions.references, val]
                });
                e.currentTarget.value = '';
            }
        }
    };

    const removeReference = (ref: string) => {
        onChange({
            ...instructions,
            references: instructions.references.filter(r => r !== ref)
        });
    };

    const addForbidden = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const val = e.currentTarget.value.trim();
            if (val && !instructions.forbidden_content.includes(val)) {
                onChange({
                    ...instructions,
                    forbidden_content: [...instructions.forbidden_content, val]
                });
                e.currentTarget.value = '';
            }
        }
    };

    const removeForbidden = (item: string) => {
        onChange({
            ...instructions,
            forbidden_content: instructions.forbidden_content.filter(i => i !== item)
        });
    };

    return (
        <div className="space-y-4 rounded-lg border p-4 bg-slate-50 dark:bg-slate-900/20">
            <h3 className="text-sm font-semibold flex items-center gap-2">
                🤖 AI Personalization Rules
            </h3>

            <div className="space-y-2">
                <Label>Tone & Style</Label>
                <Textarea
                    value={instructions.tone}
                    onChange={(e) => handleToneChange(e.target.value)}
                    placeholder="e.g. Professional, authoritative but helpful..."
                    className="h-20"
                />
            </div>

            <div className="space-y-2">
                <Label>Key Points to Reference (Press Enter)</Label>
                <Input
                    placeholder="Add topic..."
                    onKeyDown={addReference}
                />
                <div className="flex flex-wrap gap-2">
                    {instructions.references.map((ref) => (
                        <Badge key={ref} variant="secondary" className="gap-1">
                            {ref}
                            <X className="h-3 w-3 cursor-pointer" onClick={() => removeReference(ref)} />
                        </Badge>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <Label className="text-red-500">Forbidden Content (Press Enter)</Label>
                <Input
                    placeholder="Add forbidden phrase..."
                    onKeyDown={addForbidden}
                    className="border-red-200 focus-visible:ring-red-500"
                />
                <div className="flex flex-wrap gap-2">
                    {instructions.forbidden_content.map((item) => (
                        <Badge key={item} variant="destructive" className="gap-1">
                            {item}
                            <X className="h-3 w-3 cursor-pointer" onClick={() => removeForbidden(item)} />
                        </Badge>
                    ))}
                </div>
            </div>
        </div>
    );
}
