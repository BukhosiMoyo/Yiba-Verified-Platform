import { Question, QuestionType } from "@/lib/outreach/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, GripVertical } from "lucide-react";

interface QuestionEditorProps {
    question: Question;
    onChange: (q: Question) => void;
    onDelete: () => void;
}

export function QuestionEditor({ question, onChange, onDelete }: QuestionEditorProps) {
    const handleOptionChange = (index: number, value: string) => {
        if (!question.options) return;
        const newOptions = [...question.options];
        newOptions[index] = value;
        onChange({ ...question, options: newOptions });
    };

    const addOption = () => {
        const currentOptions = question.options || [];
        onChange({ ...question, options: [...currentOptions, "New Option"] });
    };

    const removeOption = (index: number) => {
        if (!question.options) return;
        onChange({ ...question, options: question.options.filter((_, i) => i !== index) });
    };

    return (
        <div className="rounded-lg border bg-card p-4 shadow-sm relative group">
            <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" onClick={onDelete} className="text-red-500 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>

            <div className="flex gap-4">
                <div className="mt-2 cursor-move text-muted-foreground">
                    <GripVertical className="h-5 w-5" />
                </div>

                <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Question Text</Label>
                            <Input
                                value={question.text}
                                onChange={(e) => onChange({ ...question, text: e.target.value })}
                                placeholder="e.g. What is your primary goal?"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Type</Label>
                            <Select
                                value={question.type}
                                onValueChange={(val) => onChange({ ...question, type: val as QuestionType })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={QuestionType.TEXT}>Short Text</SelectItem>
                                    <SelectItem value={QuestionType.RADIO}>Single Choice (Radio)</SelectItem>
                                    <SelectItem value={QuestionType.CHECKBOX}>Multiple Choice (Checkbox)</SelectItem>
                                    <SelectItem value={QuestionType.OTHER_REVEAL}>"Other" with Reveal</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Switch
                            checked={question.required}
                            onCheckedChange={(checked) => onChange({ ...question, required: checked })}
                        />
                        <Label>Required</Label>
                    </div>

                    {(question.type === QuestionType.RADIO ||
                        question.type === QuestionType.CHECKBOX ||
                        question.type === QuestionType.OTHER_REVEAL) && (
                            <div className="space-y-2 pl-4 border-l-2">
                                <Label>Options</Label>
                                {question.options?.map((opt, idx) => (
                                    <div key={idx} className="flex gap-2">
                                        <Input
                                            value={opt}
                                            onChange={(e) => handleOptionChange(idx, e.target.value)}
                                            className="h-8 text-sm"
                                        />
                                        <Button variant="ghost" size="sm" onClick={() => removeOption(idx)}>
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                                <Button variant="outline" size="sm" onClick={addOption} className="mt-1">
                                    <Plus className="mr-2 h-3 w-3" /> Add Option
                                </Button>
                            </div>
                        )}
                </div>
            </div>
        </div>
    );
}
