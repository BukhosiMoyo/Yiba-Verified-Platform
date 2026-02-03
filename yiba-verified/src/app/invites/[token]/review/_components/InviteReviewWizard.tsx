"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Loader2,
    Check,
    X,
    ShieldCheck, // For specific icon replacement
    FileCheck2, // Document icon replacement
    LayoutDashboard,
    Unlock,
    ChevronRight,
    ArrowLeft,
    ArrowRight,
    Shield,
    User,
    Eye,
    EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioItem } from "@/components/ui/radio-group";
import { StepContent } from "./StepContent";
import { Alert } from "@/components/ui/alert";

interface InviteData {
    email: string;
    role: string;
    institution_id?: string | null;
    institution?: { legal_name?: string; trading_name?: string } | null;
}

const DECLINE_REASONS = [
    { value: "already_using_other_platform", label: "We're using another platform" },
    { value: "manual_process", label: "We prefer a manual process" }, // Added based on prompt
    { value: "not_responsible", label: "Not responsible for this role" },
    { value: "not_ready", label: "Not ready at this time" }, // Added based on prompt
    { value: "other", label: "Other" },
];

const roleRedirects: Record<string, string> = {
    PLATFORM_ADMIN: "/platform-admin",
    QCTO_USER: "/qcto",
    QCTO_SUPER_ADMIN: "/qcto",
    QCTO_ADMIN: "/qcto",
    QCTO_REVIEWER: "/qcto",
    QCTO_AUDITOR: "/qcto",
    QCTO_VIEWER: "/qcto",
    INSTITUTION_ADMIN: "/institution",
    INSTITUTION_STAFF: "/institution",
    STUDENT: "/student",
    ADVISOR: "/advisor",
};

export function InviteReviewWizard({ token }: { token: string }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [invite, setInvite] = useState<InviteData | null>(null);
    const [existingUser, setExistingUser] = useState(false);

    // Wizard State
    const [currentStep, setCurrentStep] = useState(0);
    const [direction, setDirection] = useState(0); // -1 back, 1 next

    // Decline State
    const [declineModalOpen, setDeclineModalOpen] = useState(false);
    const [declineReason, setDeclineReason] = useState("");
    const [declineReasonOther, setDeclineReasonOther] = useState("");
    const [declining, setDeclining] = useState(false);

    // Accept/Signup State
    const [viewMode, setViewMode] = useState<"review" | "signup">("review");
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [email, setEmail] = useState(""); // For signup confirmation

    // --- 1. Validation Logic ---
    const validateAndTrack = useCallback(async () => {
        if (!token) return;
        try {
            const response = await fetch(`/api/invites/validate?token=${encodeURIComponent(token)}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to validate invite");

            if (!data.valid) {
                if (data.reason === "already_used") setError("This invite has already been used.");
                else if (data.reason === "expired") setError("This invite has expired.");
                else setError("This invite is no longer valid.");
                setLoading(false);
                return;
            }

            setInvite(data.invite);
            setExistingUser(!!data.existing_user);
            if (data.invite?.email) setEmail(data.invite.email);
            setLoading(false);

            // Track view
            fetch("/api/invites/track/view", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token }),
            }).catch(() => { });
        } catch (err) {
            setError("Failed to validate invite.");
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        validateAndTrack();
    }, [validateAndTrack]);

    // --- 2. Navigation ---
    const goToNext = () => {
        if (currentStep < 4) {
            setDirection(1);
            setCurrentStep((prev) => prev + 1);
        }
    };

    const goToBack = () => {
        if (currentStep > 0) {
            setDirection(-1);
            setCurrentStep((prev) => prev - 1);
        }
    };

    // --- 3. Actions ---
    const handleAcceptClick = () => {
        if (existingUser) {
            // Redirect to login with callback
            const callbackUrl = `/invite/accept-callback?token=${encodeURIComponent(token)}`;
            router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
        } else {
            // Show signup form in-place (premium feel)
            setDirection(1);
            setViewMode("signup");
        }
    };

    const handleDeclineSubmit = async () => {
        setDeclining(true);
        try {
            const res = await fetch("/api/invites/decline", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    token,
                    reason: declineReason || undefined,
                    reason_other: declineReason === "other" ? declineReasonOther : undefined,
                }),
            });
            if (!res.ok) throw new Error("Failed to decline");

            // Redirect to declined page (reusing existing one)
            router.push(`/invite/declined?token=${encodeURIComponent(token)}`);
        } catch (err) {
            // Show toast or alert? Just alert for now
            alert("Failed to decline. Please try again.");
            setDeclining(false);
        }
    };

    const handleSignupSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !password || password !== confirmPassword) return;

        setSubmitting(true);
        try {
            const response = await fetch("/api/invites/accept", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, name: name.trim(), password, email: email.trim() }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to accept invite");
            }

            // Auto login
            const result = await signIn("credentials", {
                email: email.trim(),
                password,
                redirect: false,
            });

            if (result?.ok) {
                const sessionRes = await fetch("/api/auth/session");
                const session = await sessionRes.json();
                const role = session?.user?.role as string;
                const path = roleRedirects[role] || "/institution"; // Default to institution
                router.push(path);
            } else {
                router.push("/login?registered=true");
            }
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to create account");
            setSubmitting(false);
        }
    };


    // --- Render Helpers ---

    if (loading) {
        return (
            <div className="flex flex-col items-center text-white/80 animate-pulse">
                <Loader2 className="h-10 w-10 animate-spin mb-4" />
                <p>Verifying invitation...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-card p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-border">
                <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                    <X className="h-8 w-8" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">Unavailable</h2>
                <p className="text-muted-foreground mb-6">{error}</p>
                <Button onClick={() => router.push("/")} variant="outline">Go Home</Button>
            </div>
        );
    }

    // Content Config
    const institutionName = invite?.institution?.trading_name || invite?.institution?.legal_name || "the institution";

    const steps = [
        {
            title: "You’ve been invited to manage an institution on Yiba Verified",
            icon: ShieldCheck, // fall back
            emoji: "👋",
            children: (
                <>
                    <p className="mb-4">
                        You’ve been invited to join Yiba Verified as an Institution Administrator.
                        This role allows you to manage accreditation-related submissions, learner records, and institutional compliance in one secure place.
                    </p>
                    <p className="text-xs md:text-sm bg-muted/50 p-3 rounded-lg border border-border/50">
                        This invitation was sent to <strong className="text-foreground">{invite?.email}</strong> and is specific to your institution.
                    </p>
                </>
            ),
        },
        {
            title: "What is Yiba Verified?",
            icon: FileCheck2,
            emoji: "🛡️",
            children: (
                <>
                    <p className="mb-4">
                        Yiba Verified is a QCTO-aligned platform that helps institutions manage qualification verification, Form 5 readiness, and compliance workflows — transparently and securely.
                    </p>
                    <p className="mb-4">It’s built for trust, auditability, and collaboration, not marketing.</p>
                    <ul className="text-left space-y-2 bg-muted/30 p-4 rounded-xl">
                        <li className="flex gap-2"><Check className="h-4 w-4 text-green-500 mt-0.5" /> QCTO-aligned workflows</li>
                        <li className="flex gap-2"><Check className="h-4 w-4 text-green-500 mt-0.5" /> Clear audit trails</li>
                        <li className="flex gap-2"><Check className="h-4 w-4 text-green-500 mt-0.5" /> Secure document handling</li>
                        <li className="flex gap-2"><Check className="h-4 w-4 text-green-500 mt-0.5" /> Designed for institutions, not individuals</li>
                    </ul>
                </>
            ),
        },
        {
            title: "What you’ll be able to do",
            icon: LayoutDashboard,
            emoji: "📊",
            children: (
                <>
                    <p className="mb-4">
                        As an Institution Admin, you’ll have access to tools that simplify compliance while keeping full visibility across submissions and reviews.
                    </p>
                    <ul className="text-left space-y-2 bg-muted/30 p-4 rounded-xl">
                        <li className="flex gap-2"><Check className="h-4 w-4 text-primary mt-0.5" /> Manage accreditation and readiness submissions</li>
                        <li className="flex gap-2"><Check className="h-4 w-4 text-primary mt-0.5" /> Upload and track required documents</li>
                        <li className="flex gap-2"><Check className="h-4 w-4 text-primary mt-0.5" /> Interact with QCTO reviewers</li>
                        <li className="flex gap-2"><Check className="h-4 w-4 text-primary mt-0.5" /> Monitor progress in real time</li>
                    </ul>
                </>
            ),
        },
        {
            title: "What happens next?",
            icon: Unlock,
            emoji: "🔓",
            children: (
                <>
                    <div className="bg-muted/30 p-5 rounded-xl text-left space-y-3 mb-4">
                        <div className="flex items-center gap-3">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white text-xs font-bold">1</span>
                            <span>You’ll log in or create your account</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white text-xs font-bold">2</span>
                            <span>Your profile will be linked to the institution</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white text-xs font-bold">3</span>
                            <span>No duplicate setup is required</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white text-xs font-bold">4</span>
                            <span>You can start immediately</span>
                        </div>
                    </div>
                    <p>You stay in control — nothing is submitted without your action.</p>
                </>
            ),
        },
        {
            title: "Ready to continue?",
            icon: Check,
            emoji: null, // No emoji for decision, or custom
            children: (
                <div className="flex flex-col h-full justify-center">
                    <p className="mb-6 text-lg">
                        You can accept this invitation now, or take a moment to review and decide later.
                    </p>
                    <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl mb-6">
                        <p className="text-foreground font-medium">Accepting means you’re ready to manage your institution on Yiba Verified.</p>
                    </div>
                    <p className="text-sm">Declining helps us understand how to improve.</p>
                </div>
            ),
        },
    ];

    /* ------------------- SIGNUP FORM RENDER ------------------- */
    if (viewMode === "signup") {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-lg"
            >
                <div className="bg-card/95 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl overflow-hidden p-6 md:p-8">
                    <h2 className="text-2xl font-bold mb-2">Create your account</h2>
                    <p className="text-muted-foreground mb-6">Set up your profile to manage {institutionName}.</p>

                    <form onSubmit={handleSignupSubmit} className="space-y-4 text-left">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" value={name} onChange={e => setName(e.target.value)} required placeholder="Jane Doe" className="h-11" />
                        </div>

                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input value={email} disabled className="bg-muted h-11" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    className="h-11 pr-10"
                                    placeholder="Min 8 characters"
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirm">Confirm Password</Label>
                            <div className="relative">
                                <Input
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    required
                                    className="h-11 pr-10"
                                />
                                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div className="pt-4 flex gap-3">
                            <Button type="button" variant="ghost" onClick={() => setViewMode("review")} className="flex-1 h-11">Back</Button>
                            <Button type="submit" disabled={submitting} className="flex-[2] h-11 btn-primary-premium">
                                {submitting ? <Loader2 className="animate-spin" /> : "Complete Setup"}
                            </Button>
                        </div>
                    </form>
                </div>
            </motion.div>
        );
    }

    /* ------------------- REVIEW WIZARD RENDER ------------------- */
    const isFinalStep = currentStep === steps.length - 1;

    return (
        <div className="w-full max-w-2xl px-4">
            {/* Card Container */}
            <div className="relative bg-card/80 backdrop-blur-md border border-white/20 shadow-glass rounded-[2rem] overflow-hidden min-h-[500px] flex flex-col">

                {/* Progress Indicator */}
                <div className="absolute top-0 left-0 right-0 p-6 flex gap-2 justify-center z-20">
                    {steps.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1.5 rounded-full transition-all duration-500 ease-out ${i === currentStep ? "w-8 bg-primary" : "w-2 bg-muted-foreground/20"
                                }`}
                        />
                    ))}
                </div>

                {/* AnimateSlide Wrapper */}
                <div className="flex-1 relative p-6 pt-16 md:p-10 md:pt-20 overflow-hidden">
                    <AnimatePresence initial={false} custom={direction} mode="wait">
                        <motion.div
                            key={currentStep}
                            custom={direction}
                            variants={{
                                enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0, scale: 0.95, filter: "blur(4px)" }),
                                center: { x: 0, opacity: 1, scale: 1, filter: "blur(0px)" },
                                exit: (dir: number) => ({ x: dir < 0 ? "100%" : "-100%", opacity: 0, scale: 0.95, filter: "blur(4px)" }),
                            }}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ type: "spring", stiffness: 300, damping: 30, duration: 0.4 }}
                            className="absolute inset-0 p-6 md:p-10 pt-4"
                        >
                            <StepContent
                                {...steps[currentStep]}
                                isActive={true}
                            />
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Navigation Footer */}
                <div className="p-6 md:p-8 border-t border-border/50 bg-white/50 dark:bg-black/20 backdrop-blur-sm flex justify-between items-center z-20">
                    <Button
                        variant="ghost"
                        onClick={goToBack}
                        disabled={currentStep === 0}
                        className={`text-muted-foreground hover:text-foreground transition-opacity ${currentStep === 0 ? "opacity-0 pointer-events-none" : "opacity-100"}`}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>

                    {!isFinalStep ? (
                        <Button onClick={goToNext} className="rounded-full px-6 btn-primary-premium">
                            Next <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                    ) : (
                        <div className="flex gap-3 w-full sm:w-auto">
                            <Button variant="outline" onClick={() => setDeclineModalOpen(true)} className="flex-1 sm:flex-initial border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-red-900/30 dark:hover:bg-red-900/10">
                                Decline
                            </Button>
                            <Button onClick={handleAcceptClick} className="flex-[2] sm:flex-initial bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 rounded-full px-8">
                                Accept Invitation
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Decline Modal */}
            <Dialog open={declineModalOpen} onOpenChange={setDeclineModalOpen}>
                <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl">
                    <DialogHeader>
                        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center text-2xl">
                            😔
                        </div>
                        <DialogTitle className="text-center text-xl">We understand — could you tell us why?</DialogTitle>
                        <DialogDescription className="text-center">
                            Your feedback helps us improve Yiba Verified.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-2">
                        <RadioGroup value={declineReason} onValueChange={setDeclineReason} className="gap-3">
                            {DECLINE_REASONS.map((r) => (
                                <div key={r.value} className={`flex items-center space-x-3 border rounded-lg p-3 cursor-pointer transition-colors ${declineReason === r.value ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"}`}>
                                    <RadioItem value={r.value} id={r.value} />
                                    <Label htmlFor={r.value} className="flex-1 cursor-pointer font-normal">{r.label}</Label>
                                </div>
                            ))}
                        </RadioGroup>

                        {declineReason === "other" && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="mt-3">
                                <Input
                                    placeholder="Please specify..."
                                    value={declineReasonOther}
                                    onChange={e => setDeclineReasonOther(e.target.value)}
                                    className="bg-background"
                                />
                            </motion.div>
                        )}
                    </div>

                    <DialogFooter className="sm:justify-between gap-2 mt-2">
                        <Button variant="ghost" onClick={() => setDeclineModalOpen(false)}>Cancel</Button>
                        <Button
                            onClick={handleDeclineSubmit}
                            disabled={declining || !declineReason || (declineReason === "other" && !declineReasonOther)}
                            variant="default"
                        >
                            {declining && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm Decline
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
