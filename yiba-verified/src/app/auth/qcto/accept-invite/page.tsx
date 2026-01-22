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
import { FormErrorMessage, FormHint } from "@/components/ui/form";

function QCTOAcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [invite, setInvite] = useState<{ email: string; full_name: string; role: string } | null>(null);
  const [requiresPassword, setRequiresPassword] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid invite link. No token provided.");
      setLoading(false);
      return;
    }

    const validate = async () => {
      try {
        const res = await fetch(`/api/qcto/invites/validate?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (!data.valid) {
          if (data.reason === "already_used") setError("This invite has already been used.");
          else if (data.reason === "expired") setError("This invite has expired. Please request a new one.");
          else setError("This invite is no longer valid.");
          setLoading(false);
          return;
        }
        setInvite(data.invite);
        setRequiresPassword(!!data.requires_password);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to validate invite");
      } finally {
        setLoading(false);
      }
    };
    validate();
  }, [token]);

  useEffect(() => {
    if (password && password.length < 8) setPasswordError("Password must be at least 8 characters");
    else setPasswordError("");
  }, [password]);

  useEffect(() => {
    if (confirmPassword && password && confirmPassword !== password) setConfirmPasswordError("Passwords do not match");
    else setConfirmPasswordError("");
  }, [confirmPassword, password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (requiresPassword) {
      if (!password || password.length < 8) {
        setPasswordError("Password must be at least 8 characters");
        return;
      }
      if (password !== confirmPassword) {
        setConfirmPasswordError("Passwords do not match");
        return;
      }
    }

    setSubmitting(true);
    try {
      const body: { token: string; password?: string } = { token: token! };
      if (requiresPassword) body.password = password;

      const res = await fetch("/api/qcto/invites/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to accept invite");
      }

      if (data.existing_user) {
        router.push("/login?qcto_accepted=1");
        router.refresh();
        return;
      }

      const signInResult = await signIn("credentials", {
        email: invite!.email,
        password,
        redirect: false,
      });
      if (signInResult?.ok) {
        router.push("/qcto");
        router.refresh();
      } else {
        router.push("/login?registered=1");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to accept invite");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AuthLayout>
        <AuthCard title="Validating invite…" subtitle="Please wait">
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
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
            title="Invalid QCTO Invite"
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

  return (
    <AuthLayout>
      <AuthCard
        title="Join QCTO on Yiba Verified"
        subtitle="Accept your invitation to access QCTO operations"
      >
        <div className="bg-gray-50 rounded-lg p-4 space-y-2 border border-gray-200 mb-4">
          <div>
            <p className="text-xs font-medium text-gray-500">Email</p>
            <p className="text-sm text-gray-900 font-medium">{invite?.email}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Name</p>
            <p className="text-sm text-gray-900">{invite?.full_name}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Role</p>
            <p className="text-sm text-gray-900">{invite?.role?.replace(/_/g, " ")}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {requiresPassword && (
            <>
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordError && <FormErrorMessage>{passwordError}</FormErrorMessage>}
                {!passwordError && <FormHint>At least 8 characters</FormHint>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm password *</Label>
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPasswordError && <FormErrorMessage>{confirmPasswordError}</FormErrorMessage>}
              </div>
            </>
          )}

          {!requiresPassword && (
            <p className="text-sm text-gray-600">You already have an account. Accept to add QCTO access, then sign in.</p>
          )}

          {error && <Alert variant="error" description={error} className="mb-0" />}

          <Button
            type="submit"
            className="w-full h-10 font-semibold"
            disabled={submitting || (requiresPassword && (!!passwordError || !!confirmPasswordError || !password || !confirmPassword))}
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {submitting ? "Accepting…" : "Accept invite"}
          </Button>

          <p className="text-center text-sm text-gray-600">
            <Link href="/login" className="text-blue-700 hover:underline font-medium">Sign in</Link> if you already have an account.
          </p>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}

export default function QCTOAcceptInvitePage() {
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
      <QCTOAcceptInviteContent />
    </Suspense>
  );
}
