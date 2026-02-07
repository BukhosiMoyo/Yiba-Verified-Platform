"use client";

import { useState } from "react";
import { Questionnaire, QuestionnaireStep, TemplateStatus } from "@/lib/outreach/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Plus, ArrowRight } from "lucide-react";
import { ProgressPreview } from "./ProgressPreview";
import { StepEditor } from "./StepEditor";
import { toast } from "sonner";

interface QuestionnaireWizardProps {
    initialData: Questionnaire;
    onSave: (q: Questionnaire) => void;
    onCancel: () => void;
}

export function QuestionnaireWizard({ initialData, onSave, onCancel }: QuestionnaireWizardProps) {
    const [questionnaire, setQuestionnaire] = useState<Questionnaire>(initialData);
    const [activeStepIndex, setActiveStepIndex] = useState(0);
    const [view, setView] = useState<"settings" | "builder">("settings");

    const handleUpdateStep = (index: number, updatedStep: QuestionnaireStep) => {
        const newSteps = [...questionnaire.steps];
        newSteps[index] = updatedStep;
        setQuestionnaire({ ...questionnaire, steps: newSteps });
    };

    const handleAddStep = () => {
        const newStep: QuestionnaireStep = {
            step_id: `step_${Date.now()}`,
            order: questionnaire.steps.length + 1,
            title: "New Step",
            copy: "",
            icon: "📝",
            questions: [],
        };
        setQuestionnaire({
            ...questionnaire,
            steps: [...questionnaire.steps, newStep],
        });
        setActiveStepIndex(questionnaire.steps.length); // Switch to new step
    };

    const handleDeleteStep = (index: number) => {
        const newSteps = questionnaire.steps.filter((_, i) => i !== index);
        setQuestionnaire({ ...questionnaire, steps: newSteps });
        if (activeStepIndex >= newSteps.length) {
            setActiveStepIndex(Math.max(0, newSteps.length - 1));
        }
    };

    const handleSave = () => {
        // Basic validation
        if (!questionnaire.title) {
            toast.error("Title is required");
            return;
        }
        if (questionnaire.steps.length === 0) {
            toast.error("At least one step is required");
            return;
        }
        onSave(questionnaire);
    };

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Header */}
            <div className="border-b p-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="icon" onClick={onCancel}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h2 className="text-lg font-semibold">
                            {questionnaire.title || "Untitled Questionnaire"}
                        </h2>
                        <div className="text-xs text-muted-foreground">
                            {view === "settings" ? "Settings" : "Builder"} • {questionnaire.status}
                        </div>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    {view === "settings" ? (
                        <Button onClick={() => setView("builder")}>
                            Next: Builder <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    ) : (
                        <Button variant="outline" onClick={() => setView("settings")}>
                            Back to Settings
                        </Button>
                    )}
                    <Button onClick={handleSave}>
                        <Save className="mr-2 h-4 w-4" />
                        Save
                    </Button>
                </div>
            </div>

            {view === "settings" ? (
                <div className="flex-1 p-8 max-w-2xl mx-auto w-full space-y-6">
                    <div className="space-y-2">
                        <Label>Questionnaire Title</Label>
                        <Input
                            value={questionnaire.title}
                            onChange={(e) => setQuestionnaire({ ...questionnaire, title: e.target.value })}
                            placeholder="e.g. Initial Interest Survey"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Slug (URL Path)</Label>
                        <Input
                            value={questionnaire.slug}
                            onChange={(e) => setQuestionnaire({ ...questionnaire, slug: e.target.value })}
                            placeholder="e.g. initial-interest"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                            value={questionnaire.description}
                            onChange={(e) => setQuestionnaire({ ...questionnaire, description: e.target.value })}
                            placeholder="Internal description..."
                        />
                    </div>
                </div>
            ) : (
                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar / Steps Nav */}
                    <div className="w-64 border-r bg-muted/20 flex flex-col">
                        <div className="p-4 font-medium text-sm border-b">Steps</div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {questionnaire.steps.map((step, index) => (
                                <button
                                    key={step.step_id}
                                    onClick={() => setActiveStepIndex(index)}
                                    className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between group ${activeStepIndex === index
                                            ? "bg-primary text-primary-foreground"
                                            : "hover:bg-accent hover:text-accent-foreground"
                                        }`}
                                >
                                    <span className="truncate">
                                        {index + 1}. {step.title}
                                    </span>
                                    {activeStepIndex === index && (
                                        <span className="text-xs opacity-80">{step.questions.length} Qs</span>
                                    )}
                                </button>
                            ))}
                            <Button
                                variant="ghost"
                                className="w-full justify-start mt-2 text-muted-foreground"
                                onClick={handleAddStep}
                            >
                                <Plus className="mr-2 h-4 w-4" /> Add Step
                            </Button>
                        </div>
                    </div>

                    {/* Main Builder Area */}
                    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-black">
                        <div className="border-b bg-background px-8">
                            <ProgressPreview
                                steps={questionnaire.steps}
                                currentStepIndex={activeStepIndex}
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto p-8">
                            <div className="max-w-3xl mx-auto bg-background rounded-xl shadow-sm border p-6 min-h-[500px]">
                                {questionnaire.steps.length > 0 && questionnaire.steps[activeStepIndex] ? (
                                    <StepEditor
                                        step={questionnaire.steps[activeStepIndex]}
                                        onChange={(updated) => handleUpdateStep(activeStepIndex, updated)}
                                    />
                                ) : (
                                    <div className="text-center py-20 text-muted-foreground">
                                        Select or add a step to start building.
                                    </div>
                                )}
                            </div>

                            {questionnaire.steps.length > 0 && (
                                <div className="max-w-3xl mx-auto mt-4 text-right">
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleDeleteStep(activeStepIndex)}
                                    >
                                        Delete Step
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
