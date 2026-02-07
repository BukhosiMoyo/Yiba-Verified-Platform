import { QuestionnaireResponse } from "@/lib/outreach/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, X } from "lucide-react";

interface AnswersViewerProps {
    responses: QuestionnaireResponse[];
}

export function AnswersViewer({ responses }: AnswersViewerProps) {
    if (responses.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Questionnaire Responses</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-muted-foreground">
                        No responses recorded yet.
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Questionnaire Responses</CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[200px]">
                    <div className="space-y-6">
                        {responses.map((response) => (
                            <div key={response.response_id} className="space-y-2">
                                <div className="text-xs font-semibold uppercase text-muted-foreground">
                                    Submitted: {new Date(response.submitted_at!).toLocaleDateString()}
                                </div>
                                <div className="grid gap-4">
                                    {Object.entries(response.answers).map(([questionId, answer]) => (
                                        <div key={questionId} className="rounded-lg border bg-muted/50 p-3">
                                            <div className="mb-1 text-sm font-medium">Question {questionId}</div>
                                            <div className="text-sm">
                                                {Array.isArray(answer) ? (
                                                    <ul className="list-disc pl-4">
                                                        {answer.map((item, idx) => (
                                                            <li key={idx}>{item}</li>
                                                        ))}
                                                    </ul>
                                                ) : typeof answer === 'boolean' ? (
                                                    answer ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />
                                                ) : (
                                                    String(answer)
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
