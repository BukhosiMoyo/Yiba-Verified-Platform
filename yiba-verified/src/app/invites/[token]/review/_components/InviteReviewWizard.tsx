"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Loader2,
    Check,
    X,
    ShieldCheck,
    FileCheck2,
    LayoutDashboard,
    Unlock,
    ChevronRight,
    ArrowLeft,
    ArrowRight,
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
import { ThemeToggle } from "@/components/shared/ThemeToggle"; // Assumes this exists

interface InviteData {
    email: string;
    role: string;
    institution_id?: string | null;
    institution?: { legal_name?: string; trading_name?: string } | null;
}

const DECLINE_REASONS = [
    { value: "already_using_other_platform", label: "We're using another platform" },
    { value: "manual_process", label: "We prefer a manual process" },
    { value: "not_responsible", label: "Not responsible for this role" },
    { value: "not_ready", label: "Not ready at this time" },
    { value: "other", label: "Other" },
];

const roleRedirects: Record<string, string> = {
    PLATFORM_ADMIN: "/platform-admin",
    QCTO_USER: "/qcto",
    INSTITUTION_ADMIN: "/institution",
    INSTITUTION_STAFF: "/institution",
    STUDENT: "/student",
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
    const [email, setEmail] = useState("");

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

    const steps = [
        {
            title: "Manage your institution on Yiba Verified",
            icon: ShieldCheck,
            emoji: "👋",
            children: (
                <>
                    <p className="mb-4 text-lg leading-relaxed">
                        Hi there! You’ve been invited to join <strong>{invite?.institution?.trading_name || "your institution"}</strong> as an Administrator.
                    </p>
                    <p className="text-muted-foreground mb-6">
                        Yiba Verified is the QCTO-recognised platform for managing accreditation, learner records, and compliance in one secure place.
                    </p>
                    <div className="text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30">
                        This invite was sent to <strong>{invite?.email}</strong>.
                    </div>
                </>
            ),
        },
        {
            title: "What is Yiba Verified?",
            icon: FileCheck2,
            emoji: "🛡️",
            children: (
                <>
                    <p className="mb-6 text-muted-foreground">
                        We help institutions move away from paper trails and email chains.
                    </p>
                    <ul className="space-y-3">
                        <li className="flex gap-3 items-center bg-muted/40 p-3 rounded-xl border border-border/40">
                            <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                                <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                            <span className="font-medium">QCTO-aligned workflows</span>
                        </li>
                        <li className="flex gap-3 items-center bg-muted/40 p-3 rounded-xl border border-border/40">
                            <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                                <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                            <span className="font-medium">Clear audit trails & history</span>
                        </li>
                        <li className="flex gap-3 items-center bg-muted/40 p-3 rounded-xl border border-border/40">
                            <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                                <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                            <span className="font-medium">Secure document handling</span>
                        </li>
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
                    <p className="mb-6 text-muted-foreground">
                        As an Institution Admin, you have full visibility and control.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
                            <div className="font-semibold mb-1">Upload Data</div>
                            <div className="text-sm text-muted-foreground">Submit learners and enrolments securely.</div>
                        </div>
                        <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
                            <div className="font-semibold mb-1">Track Progress</div>
                            <div className="text-sm text-muted-foreground">See verification status in real-time.</div>
                        </div>
                        <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
                            <div className="font-semibold mb-1">Audit Ready</div>
                            <div className="text-sm text-muted-foreground">Everything is logged and searchable.</div>
                        </div>
                        <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
                            <div className="font-semibold mb-1">Manage Staff</div>
                            <div className="text-sm text-muted-foreground">Invite team members to help.</div>
                        </div>
                    </div>
                </>
            ),
        },
        {
            title: "What happens next?",
            icon: Unlock,
            emoji: "🔓",
            children: (
                <div className="space-y-4">
                    <div className="relative pl-6 border-l-2 border-primary/20 space-y-8 py-2">
                        <div className="relative">
                            <span className="absolute -left-[31px] top-0 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center ring-4 ring-background">1</span>
                            <h4 className="font-semibold">Create your account</h4>
                            <p className="text-sm text-muted-foreground">Set a secure password to access the portal.</p>
                        </div>
                        <div className="relative">
                            <span className="absolute -left-[31px] top-0 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center ring-4 ring-background">2</span>
                            <h4 className="font-semibold">Linked automatically</h4>
                            <p className="text-sm text-muted-foreground">Your profile is instantly linked to {invite?.institution?.trading_name}.</p>
                        </div>
                        <div className="relative">
                            <span className="absolute -left-[31px] top-0 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center ring-4 ring-background">3</span>
                            <h4 className="font-semibold">Start managing</h4>
                            <p className="text-sm text-muted-foreground">You can start uploading or inviting staff immediately.</p>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            title: "Ready to continue?",
            icon: Check,
            emoji: "✨",
            children: (
                <div className="flex flex-col h-full items-center text-center justify-center pb-8">
                    <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 text-4xl">
                        🚀
                    </div>
                    <h3 className="text-2xl font-bold mb-3">One last step</h3>
                    <p className="text-muted-foreground text-lg mb-8 max-w-md">
                        Accept the invitation to activate your administrator access for <strong>{invite?.institution?.trading_name}</strong>.
                    </p>

                    <div className="w-full max-w-sm bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30 p-4 rounded-xl text-yellow-800 dark:text-yellow-200 text-sm">
                        By accepting, you agree to our Terms of Service and Privacy Policy.
                    </div>
                </div>
            ),
        },
    ];

    // --- Navigation Logic ---
    const goToNext = () => {
        if (currentStep < steps.length - 1) {
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

    // --- Actions ---
    const handleAcceptClick = () => {
        if (existingUser) {
            const callbackUrl = `/invite/accept-callback?token=${encodeURIComponent(token)}`;
            router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
        } else {
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
            router.push(`/invite/declined?token=${encodeURIComponent(token)}`);
        } catch (err) {
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

            const result = await signIn("credentials", {
                email: email.trim(),
                password,
                redirect: false,
            });

            if (result?.ok) {
                const sessionRes = await fetch("/api/auth/session");
                const session = await sessionRes.json();
                const role = session?.user?.role as string;
                // Basic redirect map
                const path = roleRedirects[role] || "/institution";
                router.push(path);
            } else {
                router.push("/login?registered=true");
            }
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to create account");
            setSubmitting(false);
        }
    };


    // --- Loading / Error States ---
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-white/80 animate-pulse">
                <Loader2 className="h-12 w-12 animate-spin mb-4 text-primary" />
                <p className="text-lg font-medium text-foreground">Verifying invitation...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full max-w-md mx-auto p-8 bg-card rounded-2xl shadow-2xl border border-destructive/20 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-destructive" />
                <div className="mx-auto h-20 w-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6 text-destructive">
                    <X className="h-10 w-10" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Invitation Invalid</h2>
                <p className="text-muted-foreground mb-8 text-lg">{error}</p>
                <Button onClick={() => router.push("/")} variant="outline" className="w-full h-12 text-base">
                    Return to Home
                </Button>
            </div>
        );
    }

    const isFinalStep = currentStep === steps.length - 1;

    // --- Signup Mode Rendering ---
    if (viewMode === "signup") {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-lg relative z-10"
            >
                <div className="bg-card/90 dark:bg-card/60 backdrop-blur-xl border border-border/50 shadow-2xl rounded-3xl overflow-hidden p-6 md:p-10">
                    <div className="flex justify-between items-center mb-6">
                        <Button variant="ghost" size="sm" onClick={() => setViewMode("review")} className="-ml-3 text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Review
                        </Button>
                        <ThemeToggle variant="icon-sm" />
                    </div>

                    <h2 className="text-3xl font-bold tracking-tight mb-2">Create Account</h2>
                    <p className="text-muted-foreground mb-8">Set up your profile to manage {invite?.institution?.trading_name || "your institution"}.</p>

                    <form onSubmit={handleSignupSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" value={name} onChange={e => setName(e.target.value)} required placeholder="Jane Doe" className="h-12 text-lg bg-background/50" />
                        </div>

                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input value={email} disabled className="bg-muted h-12 text-lg opacity-70" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    className="h-12 text-lg pr-10 bg-background/50"
                                    placeholder="••••••••"
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1">
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
                                    className="h-12 text-lg pr-10 bg-background/50"
                                    placeholder="••••••••"
                                />
                                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1">
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <Button type="submit" disabled={submitting} className="w-full h-12 text-lg mt-4 font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]">
                            {submitting ? <Loader2 className="animate-spin mr-2" /> : "Complete Setup"}
                        </Button>
                    </form>
                </div>
            </motion.div>
        );
    }


    return (
        <div className="w-full max-w-5xl px-4 relative flex flex-col items-center justify-center min-h-[600px] h-full">

            {/* Toggle Positioned Fixed Top Right */}
            <div className="fixed top-6 right-6 z-50">
                <ThemeToggle variant="icon" className="bg-background/20 hover:bg-background/40 backdrop-blur-md rounded-full h-12 w-12 border border-border/20 shadow-lg" />
            </div>

            <div className="grid grid-cols-1 place-items-center w-full relative perspective-[1200px]">

                {/* Carousel Stack Container - Increased Height */}
                <div className="relative w-full max-w-[800px] h-[85vh] max-h-[950px] min-h-[600px] flex items-center justify-center">

                    {/* Progress Pills (Floating Top Center) */}
                    <div className="absolute -top-12 left-0 right-0 flex justify-center gap-2 mb-8 z-40">
                        {steps.map((_, i) => (
                            <div
                                key={i}
                                className={`h-2 rounded-full transition-all duration-500 shadow-sm ${i === currentStep
                                    ? "w-12 bg-primary ring-2 ring-primary/20"
                                    : i < currentStep
                                        ? "w-4 bg-primary/40"
                                        : "w-2 bg-muted-foreground/20"
                                    }`}
                            />
                        ))}
                    </div>

                    <AnimatePresence initial={false} custom={direction} mode="popLayout">
                        <motion.div
                            key={currentStep}
                            custom={direction}
                            variants={{
                                enter: (dir: number) => ({
                                    x: dir > 0 ? "110%" : "-110%",
                                    scale: 0.85,
                                    opacity: 0,
                                    rotateY: dir > 0 ? 15 : -15,
                                    zIndex: 0
                                }),
                                center: {
                                    x: 0,
                                    scale: 1,
                                    opacity: 1,
                                    rotateY: 0,
                                    zIndex: 10,
                                    filter: "blur(0px)"
                                },
                                exit: (dir: number) => ({
                                    x: dir < 0 ? "110%" : "-110%",
                                    scale: 0.85,
                                    opacity: 0,
                                    rotateY: dir < 0 ? 15 : -15,
                                    zIndex: 0,
                                    filter: "blur(4px)"
                                }),
                            }}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ type: "spring", stiffness: 200, damping: 25, mass: 0.8 }}
                            className="absolute w-full h-full bg-card/95 dark:bg-card/70 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-2xl dark:shadow-black/50 rounded-[2rem] overflow-hidden flex flex-col text-left"
                        >
                            {/* Card Content Wrapper */}
                            <div className="flex-1 flex flex-col overflow-hidden relative">

                                {/* Step Content - Hidden Scrollbar */}
                                <div className="flex-1 overflow-y-auto p-8 md:p-12 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                                    <StepContent
                                        {...steps[currentStep]}
                                        isActive={true}
                                    />
                                </div>

                                {/* Sticky Footer */}
                                <div className="p-6 md:p-8 border-t border-border/40 bg-background/50 backdrop-blur-md flex justify-between items-center z-20 mt-auto shrink-0">
                                    <Button
                                        variant="ghost"
                                        onClick={goToBack}
                                        disabled={currentStep === 0}
                                        className={`transition-all hover:bg-muted/50 ${currentStep === 0 ? "opacity-0 pointer-events-none" : "opacity-100"}`}
                                    >
                                        <ArrowLeft className="mr-2 h-5 w-5" /> Back
                                    </Button>

                                    {!isFinalStep ? (
                                        <Button onClick={goToNext} size="lg" className="rounded-full px-8 font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                                            Next Step <ArrowRight className="ml-2 h-5 w-5" />
                                        </Button>
                                    ) : (
                                        <div className="flex flex-wrap gap-4 justify-end">
                                            <Button
                                                variant="ghost"
                                                onClick={() => setDeclineModalOpen(true)}
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                                            >
                                                <X className="mr-2 h-5 w-5" /> Decline
                                            </Button>
                                            <Button
                                                onClick={handleAcceptClick}
                                                size="lg"
                                                className="rounded-full px-10 font-bold shadow-xl shadow-primary/25 bg-gradient-to-r from-primary to-blue-600 hover:to-blue-700 transition-all hover:scale-105"
                                            >
                                                Accept Invitation <Check className="ml-2 h-5 w-5" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>

                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Decline Modal */}
            <Dialog open={declineModalOpen} onOpenChange={setDeclineModalOpen}>
                <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border border-border/50 shadow-2xl">
                    <DialogHeader>
                        <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center text-4xl shadow-inner">
                            😔
                        </div>
                        <DialogTitle className="text-center text-2xl font-bold">Decline Invitation?</DialogTitle>
                        <DialogDescription className="text-center text-base mt-2">
                            We're sorry to see you go. Please tell us a bit about why you're declining so we can improve.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <RadioGroup value={declineReason} onValueChange={setDeclineReason} className="gap-3">
                            {DECLINE_REASONS.map((r) => (
                                <label
                                    key={r.value}
                                    htmlFor={r.value}
                                    className={`flex items-center space-x-3 border rounded-xl p-4 cursor-pointer transition-all hover:bg-muted/50 ${declineReason === r.value
                                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                                        : "border-border"
                                        }`}
                                >
                                    <RadioItem value={r.value} id={r.value} />
                                    <span className="flex-1 font-medium">{r.label}</span>
                                </label>
                            ))}
                        </RadioGroup>

                        {declineReason === "other" && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="mt-4">
                                <Label className="mb-2 block ml-1">Please specify details</Label>
                                <Input
                                    placeholder="Type your reason here..."
                                    value={declineReasonOther}
                                    onChange={e => setDeclineReasonOther(e.target.value)}
                                    className="bg-background h-12"
                                    autoFocus
                                />
                            </motion.div>
                        )}
                    </div>

                    <DialogFooter className="sm:justify-between gap-3 mt-4">
                        <Button variant="outline" className="flex-1" onClick={() => setDeclineModalOpen(false)}>Back</Button>
                        <Button
                            onClick={handleDeclineSubmit}
                            disabled={declining || !declineReason || (declineReason === "other" && !declineReasonOther)}
                            variant="destructive"
                            className="flex-1 shadow-lg shadow-red-500/20"
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
