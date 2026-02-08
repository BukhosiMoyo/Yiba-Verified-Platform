"use client";

import { useState } from "react";
import { Questionnaire, QuestionType } from "@/lib/outreach/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface QuestionnaireRendererProps {
    questionnaire: Questionnaire;
}

export function QuestionnaireRenderer({ questionnaire }: QuestionnaireRendererProps) {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [submitting, setSubmitting] = useState(false);
    const [completed, setCompleted] = useState(false);

    const currentStep = questionnaire.steps[currentStepIndex];
    const isLastStep = currentStepIndex === questionnaire.steps.length - 1;

    const handleAnswerChange = (questionId: string, value: any) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: value
        }));
    };

    const handleNext = () => {
        // Validation check
        const missingRequired = currentStep.questions.filter(q => q.required && !answers[q.question_id]);
        if (missingRequired.length > 0) {
            toast.error("Please answer all required questions.");
            return;
        }

        if (isLastStep) {
            submitQuestionnaire();
        } else {
            setCurrentStepIndex(prev => prev + 1);
        }
    };

    const submitQuestionnaire = async () => {
        setSubmitting(true);
        try {
            const res = await fetch(`/api/questionnaires/${questionnaire.slug}/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ answers })
            });

            if (!res.ok) throw new Error("Failed to submit");

            setCompleted(true);
            toast.success("Thank you for your feedback!");
        } catch (error) {
            console.error(error);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (completed) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-6 animate-in fade-in zoom-in duration-500">
                <div className="h-20 w-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight">Thank You!</h2>
                <p className="text-muted-foreground max-w-md">
                    Your input helps us tailor the Yiba Verified experience to your institution's needs.
                </p>
                <Button onClick={() => window.close()} variant="outline">
                    Close Window
                </Button>
            </div>
        );
    }

    return (
        <Card className="max-w-2xl mx-auto border-none shadow-lg mt-8">
            <CardHeader className="text-center space-y-4 pb-8 border-b bg-slate-50/50 dark:bg-slate-900/50">
                <CardTitle className="text-2xl md:text-3xl font-bold text-primary">
                    {questionnaire.title}
                </CardTitle>
                <CardDescription className="text-lg">
                    {questionnaire.description}
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-8 px-6 md:px-10 space-y-8">
                <div className="space-y-2">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                        {currentStep.title}
                    </h3>
                    <p className="text-muted-foreground">{currentStep.copy}</p>
                </div>

                <div className="space-y-8">
                    {currentStep.questions.map((q) => (
                        <div key={q.question_id} className="space-y-4 animate-in slide-in-from-right-4 duration-500 fill-mode-both" style={{ animationDelay: `${0.1}s` }}>
                            <Label className="text-base font-medium">
                                {q.text} {q.required && <span className="text-red-500">*</span>}
                            </Label>

                            {q.type === QuestionType.RADIO && q.options && (
                                <RadioGroup
                                    value={answers[q.question_id] || ""}
                                    onValueChange={(val) => handleAnswerChange(q.question_id, val)}
                                    className="space-y-3"
                                >
                                    {q.options.map((opt) => (
                                        <div key={opt} className="flex items-center space-x-3 p-3 rounded-md border hover:bg-muted/50 transition-colors cursor-pointer">
                                            <RadioGroupItem value={opt} id={`${q.question_id}-${opt}`} />
                                            <Label htmlFor={`${q.question_id}-${opt}`} className="flex-1 cursor-pointer font-normal">
                                                {opt}
                                            </Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            )}

                            {q.type === QuestionType.CHECKBOX && q.options && (
                                <div className="space-y-3">
                                    {q.options.map((opt) => {
                                        const currentAnswers = (answers[q.question_id] as string[]) || [];
                                        const isChecked = currentAnswers.includes(opt);
                                        return (
                                            <div key={opt} className="flex items-center space-x-3 p-3 rounded-md border hover:bg-muted/50 transition-colors cursor-pointer">
                                                <Checkbox
                                                    id={`${q.question_id}-${opt}`}
                                                    checked={isChecked}
                                                    onCheckedChange={(checked) => {
                                                        const newAnswers = checked
                                                            ? [...currentAnswers, opt]
                                                            : currentAnswers.filter(a => a !== opt);
                                                        handleAnswerChange(q.question_id, newAnswers);
                                                    }}
                                                />
                                                <Label htmlFor={`${q.question_id}-${opt}`} className="flex-1 cursor-pointer font-normal">
                                                    {opt}
                                                </Label>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {q.type === QuestionType.OTHER_REVEAL && q.options && (
                                <RadioGroup
                                    value={answers[q.question_id] || ""}
                                    onValueChange={(val) => handleAnswerChange(q.question_id, val)}
                                    className="space-y-3"
                                >
                                    {q.options.map((opt) => (
                                        <div key={opt} className="flex items-center space-x-3 p-3 rounded-md border hover:bg-muted/50 transition-colors cursor-pointer">
                                            <RadioGroupItem value={opt} id={`${q.question_id}-${opt}`} />
                                            <Label htmlFor={`${q.question_id}-${opt}`} className="flex-1 cursor-pointer font-normal">
                                                {opt}
                                            </Label>
                                        </div>
                                    ))}
                                    {/* Simple implementation for basic requirement, refine if "Other" needs text input */}
                                    {answers[q.question_id] === "Other" && (
                                        <Input
                                            placeholder="Please specify..."
                                            className="mt-2"
                                            onChange={(e) => handleAnswerChange(`${q.question_id}_detail`, e.target.value)}
                                        />
                                    )}
                                </RadioGroup>
                            )}
                        </div>
                    ))}
                </div>

            </CardContent>
            <CardFooter className="p-6 md:p-10 border-t bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
                <Button
                    size="lg"
                    onClick={handleNext}
                    disabled={submitting}
                    className="w-full md:w-auto min-w-[150px]"
                >
                    {submitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                        </>
                    ) : (
                        <>
                            {isLastStep ? "Submit" : "Next"}
                            {!isLastStep && <ArrowRight className="ml-2 h-4 w-4" />}
                        </>
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
}
