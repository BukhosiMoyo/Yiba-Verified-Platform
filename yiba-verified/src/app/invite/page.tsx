"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthState } from "@/components/auth/AuthState";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormItem, FormErrorMessage, FormHint } from "@/components/ui/form";
import type { Role } from "@/lib/rbac";

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

function InviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [invite, setInvite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Validate invite token on mount
  useEffect(() => {
    if (!token) {
      setError("Invalid invite link. No token provided.");
      setLoading(false);
      return;
    }

    const validateInvite = async () => {
      try {
        const response = await fetch(`/api/invites/validate?token=${encodeURIComponent(token)}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to validate invite");
        }

        if (!data.valid) {
          if (data.reason === "already_used") {
            setError("This invite has already been used.");
          } else if (data.reason === "expired") {
            setError("This invite has expired. Please request a new invite.");
          } else {
            setError("This invite is no longer valid.");
          }
          setLoading(false);
          return;
        }

        setInvite(data.invite);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to validate invite");
      } finally {
        setLoading(false);
      }
    };

    validateInvite();
  }, [token]);

  // Validate password on change
  useEffect(() => {
    if (password && password.length < 8) {
      setPasswordError("Password must be at least 8 characters");
    } else {
      setPasswordError("");
    }
  }, [password]);

  // Validate password match on change
  useEffect(() => {
    if (confirmPassword && password && confirmPassword !== password) {
      setConfirmPasswordError("Passwords do not match");
    } else {
      setConfirmPasswordError("");
    }
  }, [confirmPassword, password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Client-side validation
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (!password) {
      setPasswordError("Password is required");
      return;
    }
    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }
    if (!confirmPassword) {
      setConfirmPasswordError("Please confirm your password");
      return;
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      return;
    }

    setSubmitting(true);

    try {
      // Accept invite
      const response = await fetch("/api/invites/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          name: name.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to accept invite");
      }

      // Auto sign in
      const signInResult = await signIn("credentials", {
        email: invite.email,
        password,
        redirect: false,
      });

      if (signInResult?.ok) {
        // Fetch session to get role for redirect
        const sessionResponse = await fetch("/api/auth/session");
        const session = await sessionResponse.json();
        const role = session?.user?.role as Role | undefined;

        if (role && roleRedirects[role]) {
          // For STUDENT role, check onboarding status and redirect accordingly
          if (role === "STUDENT") {
            // Check onboarding status
            const onboardingResponse = await fetch("/api/student/onboarding/status");
            const onboardingData = await onboardingResponse.json();
            
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
        // Account created but sign in failed - redirect to login
        router.push("/login?registered=true");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept invite");
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <AuthLayout>
        <AuthCard title="Validating invite..." subtitle="Please wait">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </AuthCard>
      </AuthLayout>
    );
  }

  // Error state (invalid/expired/used)
  if (error && !invite) {
    return (
      <AuthLayout>
        <AuthCard>
          <AuthState
            variant="error"
            title="Invalid Invite"
            description={error}
            actions={
              <div className="flex flex-col gap-3 mt-4">
                <Button
                  onClick={() => router.push("/login")}
                  className="w-full h-10"
                >
                  Back to Sign In
                </Button>
              </div>
            }
          />
        </AuthCard>
      </AuthLayout>
    );
  }

  // Already used state
  if (invite && error && error.includes("already been used")) {
    return (
      <AuthLayout>
        <AuthCard>
          <AuthState
            variant="info"
            title="Invite Already Used"
            description="This invite has already been used. If you have an account, please sign in."
            actions={
              <div className="flex flex-col gap-3 mt-4">
                <Button
                  onClick={() => router.push("/login")}
                  className="w-full h-10"
                >
                  Back to Sign In
                </Button>
              </div>
            }
          />
        </AuthCard>
      </AuthLayout>
    );
  }

  // Valid invite - show form
  return (
    <AuthLayout>
      <AuthCard
        title="You're invited to Yiba Verified"
        subtitle="Complete your account setup to get started"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Invite Info */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 border border-gray-200">
            <div>
              <p className="text-xs font-medium text-gray-500">Email</p>
              <p className="text-sm text-gray-900 font-medium">{invite?.email}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Role</p>
              <p className="text-sm text-gray-900">
                {invite?.role?.replace(/_/g, " ") || "—"}
              </p>
            </div>
            {invite?.institution && (
              <div>
                <p className="text-xs font-medium text-gray-500">Institution</p>
                <p className="text-sm text-gray-900">
                  {invite.institution.trading_name || invite.institution.legal_name}
                </p>
              </div>
            )}
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">
              Full name
            </Label>
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

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </Label>
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" strokeWidth={1.5} />
                ) : (
                  <Eye className="h-4 w-4" strokeWidth={1.5} />
                )}
              </button>
            </div>
            {passwordError && <FormErrorMessage>{passwordError}</FormErrorMessage>}
            {!passwordError && (
              <FormHint>Password must be at least 8 characters long</FormHint>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label
              htmlFor="confirm-password"
              className="text-sm font-medium text-gray-700"
            >
              Confirm password
            </Label>
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" strokeWidth={1.5} />
                ) : (
                  <Eye className="h-4 w-4" strokeWidth={1.5} />
                )}
              </button>
            </div>
            {confirmPasswordError && (
              <FormErrorMessage>{confirmPasswordError}</FormErrorMessage>
            )}
          </div>

          {error && (
            <Alert variant="error" description={error} className="mb-0" />
          )}

          <Button
            type="submit"
            className="w-full h-10 font-semibold"
            disabled={
              submitting ||
              !!passwordError ||
              !!confirmPasswordError ||
              !name.trim() ||
              !password ||
              !confirmPassword
            }
          >
            {submitting && (
              <Loader2 className="h-4 w-4 animate-spin mr-2" strokeWidth={2} />
            )}
            {submitting ? "Creating account..." : "Accept invite"}
          </Button>

          <div className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-blue-700 hover:text-blue-800 hover:underline font-medium"
            >
              Sign in
            </Link>
          </div>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}

export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <AuthLayout>
          <AuthCard title="Loading…" subtitle="Please wait">
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          </AuthCard>
        </AuthLayout>
      }
    >
      <InviteContent />
    </Suspense>
  );
}
