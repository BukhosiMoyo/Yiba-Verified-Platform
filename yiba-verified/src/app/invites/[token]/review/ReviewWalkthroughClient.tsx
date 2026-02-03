"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    Loader2,
    ChevronRight,
    ChevronLeft,
    Check,
    ShieldCheck,
    Building2,
    UploadCloud,
    Users,
    FileCheck
} from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { AuthState } from "@/components/auth/AuthState";

const STEPS = [
    {
        title: "Welcome to Yiba Verified",
        description: "The secure, QCTO-recognised platform for accredited institutions.",
        icon: ShieldCheck,
    },
    {
        title: "Manage your profile",
        description: "Centralize your institution profile and manage all branches in one place.",
        icon: Building2,
    },
    {
        title: "Compliance & Readiness",
        description: "Upload evidence, track compliance, and manage readiness efficiently.",
        icon: UploadCloud,
    },
    {
        title: "Student Records",
        description: "Maintain secure learner records and generate structured reports.",
        icon: Users,
    },
    {
        title: "QCTO Review",
        description: "Submit directly for QCTO review and track your progress in real-time.",
        icon: FileCheck,
    },
];

export default function ReviewWalkthroughClient({ token }: { token: string }) {
    const router = useRouter();
    const [stepIndex, setStepIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isValid, setIsValid] = useState(false);

    const validateToken = useCallback(async () => {
        try {
            const response = await fetch(`/api/invites/validate?token=${encodeURIComponent(token)}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to validate invite");
            }

            if (!data.valid) {
                if (data.reason === "already_used") setError("This invite has already been used.");
                else if (data.reason === "expired") setError("This invite has expired. Please request a new invite.");
                else setError("This invite is no longer valid.");
                return;
            }

            setIsValid(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to validate invite");
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        validateToken();
    }, [validateToken]);

    const handleNext = () => {
        if (stepIndex < STEPS.length - 1) {
            setStepIndex(stepIndex + 1);
        } else {
            handleAccept();
        }
    };

    const handleBack = () => {
        if (stepIndex > 0) {
            setStepIndex(stepIndex - 1);
        }
    };

    const handleAccept = () => {
        // Redirect to the main invite page (which handles acceptance/signup)
        // We pass the token clearly so it resumes the flow
        router.push(`/invite?token=${encodeURIComponent(token)}`);
    };

    if (loading) {
        return (
            <AuthLayout>
                <AuthCard title="Checking invitation..." subtitle="Please wait">
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                </AuthCard>
            </AuthLayout>
        );
    }

    if (error || !isValid) {
        return (
            <AuthLayout>
                <AuthCard>
                    <AuthState
                        variant="error"
                        title="Unable to view invitation"
                        description={error}
                        actions={
                            <Button onClick={() => router.push("/login")} className="w-full h-10">
                                Back to Sign In
                            </Button>
                        }
                    />
                </AuthCard>
            </AuthLayout>
        );
    }

    const currentStep = STEPS[stepIndex];
    const isLastStep = stepIndex === STEPS.length - 1;

    return (
        <AuthLayout>
            <div className="w-full max-w-[480px]">
                {/* Progress Indicators */}
                <div className="flex justify-center gap-2 mb-8">
                    {STEPS.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1.5 rounded-full transition-all duration-300 ${i === stepIndex ? "w-8 bg-primary" : i < stepIndex ? "w-2 bg-primary/40" : "w-2 bg-muted"
                                }`}
                        />
                    ))}
                </div>

                <AuthCard>
                    <div className="py-6 text-center space-y-6 min-h-[320px] flex flex-col justify-center items-center">

                        {/* Step Icon */}
                        <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4 transition-all duration-500 animate-in fade-in zoom-in">
                            <currentStep.icon className="h-10 w-10" />
                        </div>

                        {/* Step Content */}
                        <div className="space-y-2 max-w-sm mx-auto">
                            <h1 className="text-2xl font-bold text-foreground animate-in slide-in-from-bottom-2 fade-in duration-300" key={`title-${stepIndex}`}>
                                {currentStep.title}
                            </h1>
                            <p className="text-muted-foreground text-sm leading-relaxed animate-in slide-in-from-bottom-3 fade-in duration-500" key={`desc-${stepIndex}`}>
                                {currentStep.description}
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-8 flex gap-3">
                        <Button
                            variant="ghost"
                            className="flex-1"
                            onClick={handleBack}
                            disabled={stepIndex === 0}
                        >
                            Back
                        </Button>

                        <Button
                            onClick={handleNext}
                            className="flex-1 font-semibold"
                        >
                            {isLastStep ? (
                                <>
                                    Accept Invitation
                                    <Check className="ml-2 h-4 w-4" />
                                </>
                            ) : (
                                <>
                                    Next
                                    <ChevronRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </div>
                </AuthCard>
            </div>
        </AuthLayout>
    );
}
