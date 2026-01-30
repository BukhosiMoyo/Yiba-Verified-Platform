"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Check, X, Shield, FileCheck, LayoutDashboard, UserPlus } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthState } from "@/components/auth/AuthState";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormErrorMessage, FormHint } from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioItem } from "@/components/ui/radio-group";
import type { Role } from "@/lib/rbac";

const DECLINE_REASONS: { value: string; label: string }[] = [
  { value: "already_using_other_platform", label: "Already using another platform" },
  { value: "not_responsible", label: "Not responsible for this institution" },
  { value: "not_interested", label: "Not interested" },
  { value: "other", label: "Other" },
];

const roleRedirects: Record<Role, string> = {
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
};

type ViewMode = "review" | "signup";

interface InviteData {
  email: string;
  role: string;
  institution_id?: string | null;
  institution?: { legal_name?: string; trading_name?: string } | null;
}

function InviteReviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [invite, setInvite] = useState<InviteData | null>(null);
  const [existingUser, setExistingUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("review");
  const [declineModalOpen, setDeclineModalOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [declineReasonOther, setDeclineReasonOther] = useState("");
  const [declining, setDeclining] = useState(false);

  // Signup form state (when viewMode === "signup")
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const institutionName =
    invite?.institution?.trading_name || invite?.institution?.legal_name || "the institution";

  const validateAndTrack = useCallback(async () => {
    if (!token) {
      setError("Invalid invite link. No token provided.");
      setLoading(false);
      return;
    }
    const response = await fetch(`/api/invites/validate?token=${encodeURIComponent(token)}`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to validate invite");
    }
    if (!data.valid) {
      if (data.reason === "already_used") setError("This invite has already been used.");
      else if (data.reason === "expired") setError("This invite has expired. Please request a new invite.");
      else setError("This invite is no longer valid.");
      setLoading(false);
      return;
    }
    setInvite(data.invite);
    setExistingUser(!!data.existing_user);
    setLoading(false);
    // Track view (fire-and-forget)
    fetch("/api/invites/track/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    }).catch(() => {});
  }, [token]);

  useEffect(() => {
    const ac = new AbortController();
    validateAndTrack();
    return () => ac.abort();
  }, [validateAndTrack]);

  useEffect(() => {
    if (password && password.length < 8) setPasswordError("Password must be at least 8 characters");
    else setPasswordError("");
  }, [password]);

  useEffect(() => {
    if (confirmPassword && password && confirmPassword !== password) setConfirmPasswordError("Passwords do not match");
    else setConfirmPasswordError("");
  }, [confirmPassword, password]);

  const handleAccept = () => {
    if (existingUser) {
      const callbackUrl = `/invite/accept-callback?token=${encodeURIComponent(token ?? "")}`;
      router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      return;
    }
    setViewMode("signup");
  };

  const handleDeclineClick = () => {
    setDeclineModalOpen(true);
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
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to decline");
      setDeclineModalOpen(false);
      router.push(`/invite/declined?token=${encodeURIComponent(token ?? "")}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to decline");
      setDeclining(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (!password || password.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/invites/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name: name.trim(), password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to accept invite");

      const signInResult = await signIn("credentials", {
        email: invite?.email,
        password,
        redirect: false,
      });
      if (signInResult?.ok) {
        const sessionRes = await fetch("/api/auth/session");
        const session = await sessionRes.json();
        const role = session?.user?.role as Role | undefined;
        if (role && roleRedirects[role]) {
          if (role === "STUDENT") {
            const onboardingRes = await fetch("/api/student/onboarding/status");
            const onboardingData = await onboardingRes.json();
            if (onboardingData.data && !onboardingData.data.completed) {
              router.push("/student/onboarding");
            } else {
              router.push(roleRedirects[role]);
            }
          } else {
            router.push(roleRedirects[role]);
          }
          router.refresh();
        } else {
          router.push("/unauthorized");
        }
      } else {
        router.push("/login?registered=true");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept invite");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AuthLayout>
        <AuthCard title="Validating invite..." subtitle="Please wait">
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </AuthCard>
      </AuthLayout>
    );
  }

  if (error && !invite) {
    return (
      <AuthLayout>
        <AuthCard>
          <AuthState
            variant="error"
            title="Invalid Invite"
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

  // Signup form (after clicking Accept for new user)
  if (viewMode === "signup") {
    return (
      <AuthLayout>
        <AuthCard
          title="Complete your account"
          subtitle="You're almost there — set your name and password"
        >
          <form onSubmit={handleSignupSubmit} className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Email</p>
              <p className="text-sm font-medium text-foreground">{invite?.email}</p>
              <p className="text-xs font-medium text-muted-foreground">Role</p>
              <p className="text-sm text-foreground">{invite?.role?.replace(/_/g, " ") ?? "—"}</p>
              {institutionName && (
                <>
                  <p className="text-xs font-medium text-muted-foreground">Institution</p>
                  <p className="text-sm text-foreground">{institutionName}</p>
                </>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={submitting}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={submitting}
                  className="h-10 pr-10"
                  aria-invalid={!!passwordError}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordError && <FormErrorMessage>{passwordError}</FormErrorMessage>}
              {!passwordError && <FormHint>At least 8 characters</FormHint>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={submitting}
                  className="h-10 pr-10"
                  aria-invalid={!!confirmPasswordError}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPasswordError && <FormErrorMessage>{confirmPasswordError}</FormErrorMessage>}
            </div>
            {error && <Alert variant="error" description={error} />}
            <Button
              type="submit"
              className="w-full h-10 font-semibold"
              disabled={submitting || !!passwordError || !!confirmPasswordError || !name.trim() || !password || !confirmPassword}
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {submitting ? "Creating account..." : "Accept and continue"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setViewMode("review")}
              disabled={submitting}
            >
              Back to review
            </Button>
          </form>
        </AuthCard>
      </AuthLayout>
    );
  }

  // Step-based Invite Review
  const steps = [
    {
      title: "Welcome",
      icon: UserPlus,
      content: (
        <>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            You've been invited to manage {institutionName} on Yiba Verified
          </h3>
          <p className="text-muted-foreground text-sm">
            This invitation is for <strong>{invite?.email}</strong> as{" "}
            <strong>{invite?.role?.replace(/_/g, " ")}</strong>. Yiba Verified is the QCTO-recognised platform for qualification verification and accreditation.
          </p>
        </>
      ),
    },
    {
      title: "What this platform is",
      icon: LayoutDashboard,
      content: (
        <>
          <h3 className="text-lg font-semibold text-foreground mb-2">What is Yiba Verified?</h3>
          <p className="text-muted-foreground text-sm">
            Yiba Verified helps institutions manage accreditation processes, submit Form 5 readiness, and work transparently with QCTO reviewers. It's built for trust and compliance — not marketing.
          </p>
        </>
      ),
    },
    {
      title: "What you'll be able to do",
      icon: FileCheck,
      content: (
        <>
          <h3 className="text-lg font-semibold text-foreground mb-2">Your capabilities</h3>
          <ul className="text-muted-foreground text-sm space-y-2 list-disc list-inside">
            <li>Manage institutional accreditation processes</li>
            <li>Submit Form 5 readiness</li>
            <li>Interact with QCTO reviewers</li>
            <li>Track progress transparently</li>
          </ul>
        </>
      ),
    },
    {
      title: "What happens when you accept",
      icon: Shield,
      content: (
        <>
          <h3 className="text-lg font-semibold text-foreground mb-2">Next steps</h3>
          <p className="text-muted-foreground text-sm">
            When you accept, you'll create or log into your account and be automatically linked to {institutionName}. No duplicate setup — you can get started right away.
          </p>
        </>
      ),
    },
  ];

  return (
    <AuthLayout>
      <div className="w-full max-w-[520px] space-y-0 pb-24">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-foreground">Review your invitation</h1>
          <p className="text-sm text-muted-foreground mt-1">
            A few things to know before you continue
          </p>
        </div>

        <div className="space-y-8">
          {steps.map((step, i) => (
            <section key={i} className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <step.icon className="h-5 w-5" strokeWidth={1.5} />
                </span>
                <div className="min-w-0 flex-1">{step.content}</div>
              </div>
            </section>
          ))}
        </div>

        {/* Sticky footer */}
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-4 py-4 lg:px-6">
          <div className="mx-auto max-w-[520px] flex flex-col sm:flex-row gap-3">
            <Button
              className="flex-1 h-11 font-semibold"
              onClick={handleAccept}
            >
              <Check className="h-4 w-4 mr-2" />
              Accept invitation
            </Button>
            <Button
              variant="outline"
              className="flex-1 h-11"
              onClick={handleDeclineClick}
            >
              <X className="h-4 w-4 mr-2" />
              Decline invitation
            </Button>
          </div>
        </div>

        {/* Decline reason modal */}
        <Dialog open={declineModalOpen} onOpenChange={setDeclineModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Decline invitation</DialogTitle>
              <DialogDescription>
                Would you mind telling us why? (Optional — helps us improve.)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <RadioGroup value={declineReason} onValueChange={setDeclineReason}>
                {DECLINE_REASONS.map((r) => (
                  <RadioItem key={r.value} value={r.value} label={r.label} id={r.value} />
                ))}
              </RadioGroup>
              {declineReason === "other" && (
                <div className="space-y-2">
                  <Label htmlFor="decline-other">Other (optional)</Label>
                  <Input
                    id="decline-other"
                    value={declineReasonOther}
                    onChange={(e) => setDeclineReasonOther(e.target.value)}
                    placeholder="Brief reason"
                    disabled={declining}
                    className="h-10"
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeclineModalOpen(false)} disabled={declining}>
                Cancel
              </Button>
              <Button onClick={handleDeclineSubmit} disabled={declining}>
                {declining ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Decline
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthLayout>
  );
}

export default InviteReviewContent;
