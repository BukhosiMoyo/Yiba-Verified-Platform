"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Questionnaire, QuestionType } from "@/lib/outreach/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, ArrowRight, CheckCircle2, ChevronRight, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface QuestionnaireRendererProps {
    questionnaire: Questionnaire;
    onComplete?: (answers: Record<string, any>) => Promise<void>;
}

export function QuestionnaireRenderer({ questionnaire, onComplete }: QuestionnaireRendererProps) {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    // Flatten all questions from all steps
    // Flatten all questions from all steps
    const allQuestions = questionnaire.steps.flatMap((step, stepIdx) =>
        step.questions.map((q, qIdx) => ({
            ...q,
            stepTitle: step.title,
            stepCopy: step.copy,
            // Fallback ID to prevent duplicate key errors if DB has empty strings
            question_id: q.question_id || `q-fallback-${stepIdx}-${qIdx}`
        }))
    );

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [submitting, setSubmitting] = useState(false);
    const [completed, setCompleted] = useState(false);

    const currentQuestion = allQuestions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === allQuestions.length - 1;

    const handleAnswerChange = (questionId: string, value: any) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: value
        }));
    };

    const handleNext = () => {
        // Validation check
        if (currentQuestion.required && !answers[currentQuestion.question_id]) {
            toast.error("Please answer this required question.");
            return;
        }

        if (isLastQuestion) {
            submitQuestionnaire();
        } else {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const submitQuestionnaire = async () => {
        setSubmitting(true);
        try {
            if (onComplete) {
                await onComplete(answers);
                setCompleted(true);
                toast.success("Engagement data updated!");
                return;
            }

            const res = await fetch(`/api/questionnaires/${questionnaire.slug}/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    answers,
                    token
                })
            });

            if (!res.ok) throw new Error("Failed to submit");

            setCompleted(true);
            toast.success("Thank you for your response!");
        } catch (error) {
            console.error(error);
            toast.error("Network error. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (completed) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center p-12 text-center space-y-8 bg-white dark:bg-slate-950 h-full min-h-[500px]"
            >
                <div className="relative">
                    <div className="absolute inset-0 bg-green-500 blur-2xl opacity-20 animate-pulse"></div>
                    <div className="h-24 w-24 bg-green-500/10 rounded-full flex items-center justify-center relative border border-green-500/20">
                        <CheckCircle2 className="h-12 w-12 text-green-500" />
                    </div>
                </div>
                <div className="space-y-4">
                    <h2 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white uppercase italic">Success</h2>
                    <p className="text-slate-500 dark:text-slate-400 max-w-sm text-lg font-medium leading-relaxed">
                        Data integrated. Proceeding to next phase of simulation.
                    </p>
                </div>
                <Button
                    onClick={() => onComplete ? onComplete({}) : window.location.reload()}
                    size="lg"
                    className="rounded-2xl px-12 h-14 font-bold bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/20 text-white"
                >
                    Return to Inbox
                </Button>
            </motion.div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-black overflow-hidden relative selection:bg-purple-500/30">
            {/* Subtle Noise Texture */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0 mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")` }}></div>

            <div className="absolute top-0 right-0 p-32 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 p-32 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="p-8 border-b bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl flex justify-between items-center z-10 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20 ring-1 ring-white/20">
                        <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase italic">
                            {questionnaire.title}
                        </h2>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                            Session Protocol 0x{questionnaire.slug.substring(0, 4)}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:block">Progress</div>
                    <div className="w-32 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden ring-1 ring-slate-900/5 dark:ring-white/10">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${((currentQuestionIndex + 1) / allQuestions.length) * 100}%` }}
                            className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite] skew-x-12"></div>
                        </motion.div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar relative z-10">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentQuestionIndex}
                        initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        className="max-w-3xl mx-auto space-y-12"
                    >
                        <div className="space-y-4">
                            <Badge variant="outline" className="rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-[10px] font-black tracking-widest uppercase py-1 shadow-sm">
                                Question {currentQuestionIndex + 1} of {allQuestions.length}
                            </Badge>
                            <h3 className="text-3xl md:text-5xl font-black text-slate-800 dark:text-white leading-[1.1] tracking-tight drop-shadow-sm">
                                {currentQuestion.stepTitle}
                            </h3>
                            <p className="text-lg text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                {currentQuestion.stepCopy}
                            </p>
                        </div>

                        <div className="space-y-10">
                            {(() => {
                                const q = currentQuestion;
                                const idx = 0;
                                return (
                                    <motion.div
                                        key={q.question_id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="space-y-6"
                                    >
                                        <div className="flex gap-4">
                                            <div className="h-6 w-6 mt-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-[10px] font-black text-slate-400 shadow-inner">
                                                {idx + 1}
                                            </div>
                                            <Label className="text-xl font-bold text-slate-800 dark:text-slate-200 leading-tight">
                                                {q.text} {q.required && <span className="text-purple-500 font-black ml-1">*</span>}
                                            </Label>
                                        </div>

                                        <div className="pl-10">
                                            {q.type === QuestionType.RADIO && q.options && (
                                                <RadioGroup
                                                    value={answers[q.question_id] || ""}
                                                    onValueChange={(val) => handleAnswerChange(q.question_id, val)}
                                                    className="grid gap-3"
                                                >
                                                    {q.options.map((opt, i) => (
                                                        <div key={`${opt}-${i}`} className="relative group">
                                                            <RadioItem
                                                                value={opt}
                                                                id={`${q.question_id}-${opt}`}
                                                                className="sr-only"
                                                            />
                                                            <Label
                                                                htmlFor={`${q.question_id}-${opt}`}
                                                                className={cn(
                                                                    "flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-300 cursor-pointer font-bold text-lg relative overflow-hidden",
                                                                    answers[q.question_id] === opt
                                                                        ? "border-purple-600 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 shadow-[0_0_20px_rgba(147,51,234,0.15)] ring-1 ring-purple-500/50"
                                                                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/50 hover:shadow-lg hover:-translate-y-0.5"
                                                                )}
                                                            >
                                                                <div className={cn(
                                                                    "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                                                                    answers[q.question_id] === opt
                                                                        ? "border-purple-600 bg-purple-600 scale-110"
                                                                        : "border-slate-300 dark:border-slate-700 group-hover:border-slate-400"
                                                                )}>
                                                                    {answers[q.question_id] === opt && <div className="h-2 w-2 rounded-full bg-white shadow-sm" />}
                                                                </div>
                                                                {opt}
                                                                {answers[q.question_id] === opt && (
                                                                    <motion.div
                                                                        layoutId={`glow-${q.question_id}`}
                                                                        className="absolute inset-0 bg-purple-500/5 pointer-events-none"
                                                                        initial={{ opacity: 0 }}
                                                                        animate={{ opacity: 1 }}
                                                                        exit={{ opacity: 0 }}
                                                                    />
                                                                )}
                                                            </Label>
                                                        </div>
                                                    ))}
                                                </RadioGroup>
                                            )}

                                            {q.type === QuestionType.CHECKBOX && q.options && (
                                                <div className="grid gap-3">
                                                    {q.options.map((opt, i) => {
                                                        const currentAnswers = (answers[q.question_id] as string[]) || [];
                                                        const isChecked = currentAnswers.includes(opt);
                                                        return (
                                                            <div key={`${opt}-${i}`} className="relative group">
                                                                <Checkbox
                                                                    id={`${q.question_id}-${opt}`}
                                                                    checked={isChecked}
                                                                    className="sr-only"
                                                                    onCheckedChange={(checked) => {
                                                                        const newAnswers = checked
                                                                            ? [...currentAnswers, opt]
                                                                            : currentAnswers.filter(a => a !== opt);
                                                                        handleAnswerChange(q.question_id, newAnswers);
                                                                    }}
                                                                />
                                                                <Label
                                                                    htmlFor={`${q.question_id}-${opt}`}
                                                                    className={cn(
                                                                        "flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-300 cursor-pointer font-bold text-lg",
                                                                        isChecked
                                                                            ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 shadow-[0_0_20px_rgba(79,70,229,0.15)] ring-1 ring-indigo-500/50"
                                                                            : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/50 hover:shadow-lg hover:-translate-y-0.5"
                                                                    )}
                                                                >
                                                                    <div className={cn(
                                                                        "h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300",
                                                                        isChecked
                                                                            ? "border-indigo-600 bg-indigo-600 scale-110"
                                                                            : "border-slate-300 dark:border-slate-700 group-hover:border-slate-400"
                                                                    )}>
                                                                        {isChecked && <ChevronRight className="h-4 w-4 text-white drop-shadow-sm" />}
                                                                    </div>
                                                                    {opt}
                                                                </Label>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {(q.type === QuestionType.OTHER_REVEAL || q.type === QuestionType.TEXT) && (
                                                <div className="space-y-4">
                                                    {q.type === QuestionType.OTHER_REVEAL && q.options && (
                                                        <RadioGroup
                                                            value={answers[q.question_id] || ""}
                                                            onValueChange={(val) => handleAnswerChange(q.question_id, val)}
                                                            className="grid gap-3"
                                                        >
                                                            {q.options.map((opt, i) => (
                                                                <div key={`${opt}-${i}`} className="relative group">
                                                                    <RadioItem value={opt} id={`${q.question_id}-${opt}`} className="sr-only" />
                                                                    <Label htmlFor={`${q.question_id}-${opt}`} className={cn(
                                                                        "flex items-center gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer font-bold text-lg",
                                                                        answers[q.question_id] === opt
                                                                            ? "border-purple-600 bg-purple-50 dark:bg-purple-900/10 text-purple-700 dark:text-purple-400"
                                                                            : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/50"
                                                                    )}>
                                                                        <div className={cn(
                                                                            "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all",
                                                                            answers[q.question_id] === opt
                                                                                ? "border-purple-600 bg-purple-600"
                                                                                : "border-slate-300 dark:border-slate-700"
                                                                        )}>
                                                                            {answers[q.question_id] === opt && <div className="h-2 w-2 rounded-full bg-white" />}
                                                                        </div>
                                                                        {opt}
                                                                    </Label>
                                                                </div>
                                                            ))}
                                                        </RadioGroup>
                                                    )}

                                                    {(q.type === QuestionType.TEXT || (q.type === QuestionType.OTHER_REVEAL && answers[q.question_id] === "Other")) && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            className="pt-2"
                                                        >
                                                            <Input
                                                                placeholder={q.type === QuestionType.TEXT ? "Your response..." : "Please specify..."}
                                                                className="h-14 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 font-medium focus-visible:ring-purple-500 focus-visible:border-purple-500"
                                                                value={answers[q.type === QuestionType.TEXT ? q.question_id : `${q.question_id}_detail`] || ""}
                                                                onChange={(e) => handleAnswerChange(q.type === QuestionType.TEXT ? q.question_id : `${q.question_id}_detail`, e.target.value)}
                                                            />
                                                        </motion.div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })()}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="p-8 border-t bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl flex justify-between items-center z-20">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Interactive Protocol</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-white">Question {currentQuestionIndex + 1} of {allQuestions.length}</span>
                </div>
                <div className="flex gap-4">
                    {currentQuestionIndex > 0 && (
                        <Button
                            variant="outline"
                            size="lg"
                            onClick={handleBack}
                            className="rounded-2xl h-14 px-8 font-bold border-2 border-slate-200 dark:border-slate-800 hover:bg-slate-50"
                        >
                            Back
                        </Button>
                    )}
                    <Button
                        size="lg"
                        onClick={handleNext}
                        disabled={submitting}
                        className="rounded-2xl h-14 px-12 font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:shadow-xl hover:shadow-purple-500/20 transition-all active:scale-[0.98] group"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                                Processing Hub...
                            </>
                        ) : (
                            <>
                                {isLastQuestion ? "Submit Response" : "Next Question"}
                                {!isLastQuestion && <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />}
                                {isLastQuestion && <CheckCircle2 className="ml-2 h-5 w-5" />}
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
