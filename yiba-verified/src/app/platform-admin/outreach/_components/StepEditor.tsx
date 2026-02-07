import { QuestionnaireStep, Question, QuestionType } from "@/lib/outreach/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { QuestionEditor } from "./QuestionEditor";

interface StepEditorProps {
    step: QuestionnaireStep;
    onChange: (step: QuestionnaireStep) => void;
}

export function StepEditor({ step, onChange }: StepEditorProps) {
    const handleAddQuestion = () => {
        const newQuestion: Question = {
            question_id: `q_${Date.now()}`,
            type: QuestionType.TEXT,
            text: "",
            options: [],
            required: false,
        };
        onChange({ ...step, questions: [...step.questions, newQuestion] });
    };

    const handleUpdateQuestion = (index: number, updated: Question) => {
        const newQuestions = [...step.questions];
        newQuestions[index] = updated;
        onChange({ ...step, questions: newQuestions });
    };

    const handleDeleteQuestion = (index: number) => {
        onChange({
            ...step,
            questions: step.questions.filter((_, i) => i !== index),
        });
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label>Step Title</Label>
                    <Input
                        value={step.title}
                        onChange={(e) => onChange({ ...step, title: e.target.value })}
                        placeholder="e.g. Basic Info"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Icon (Emoji)</Label>
                    <Input
                        value={step.icon}
                        onChange={(e) => onChange({ ...step, icon: e.target.value })}
                        className="font-emoji w-20"
                        placeholder="📝"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label>Short Description / Copy</Label>
                <Input
                    value={step.copy}
                    onChange={(e) => onChange({ ...step, copy: e.target.value })}
                    placeholder="Brief explanation shown under title..."
                />
            </div>

            <div className="space-y-4 mt-6">
                <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Questions</Label>
                    <Button size="sm" variant="secondary" onClick={handleAddQuestion}>
                        <Plus className="mr-2 h-4 w-4" /> Add Question
                    </Button>
                </div>

                <div className="space-y-4">
                    {step.questions.map((q, idx) => (
                        <QuestionEditor
                            key={q.question_id}
                            question={q}
                            onChange={(updated) => handleUpdateQuestion(idx, updated)}
                            onDelete={() => handleDeleteQuestion(idx)}
                        />
                    ))}
                    {step.questions.length === 0 && (
                        <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground">
                            No questions in this step yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
