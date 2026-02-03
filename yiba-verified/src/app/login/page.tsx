"use client";

import { Suspense, useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthSocialButton } from "@/components/auth/AuthSocialButton";
import { GoogleIcon } from "@/components/icons/google";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { Role } from "@/lib/rbac";

const roleRedirects: Partial<Record<Role, string>> = {
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

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect if user is already logged in
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role) {
      const role = session.user.role as Role;
      const next = searchParams.get("next");
      const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : null;
      const path = safeNext || (role && roleRedirects[role]);
      if (path) {
        router.replace(path);
      }
    }
  }, [status, session, router, searchParams]);

  // Check if user just registered
  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setSuccess("Account created successfully! You can sign in now.");
      // Clean up URL
      router.replace("/login", { scroll: false });
    }
    // Check if email was changed
    if (searchParams.get("emailChanged") === "true") {
      setSuccess("Email changed successfully! Please sign in with your new email address.");
      // Clean up URL
      router.replace("/login", { scroll: false });
    }
  }, [searchParams, router]);

  // Show loading state while checking session
  if (status === "loading") {
    return (
      <AuthLayout>
        <AuthCard
          header={
            <div className="space-y-2">
              <Image src="/Yiba%20Verified%20Logo.webp" alt="Yiba Verified" width={200} height={40} className="h-10 object-contain object-left dark:hidden" sizes="200px" priority loading="eager" />
              <Image src="/YIBA%20VERIFIED%20DARK%20MODE%20LOGO.webp" alt="Yiba Verified" width={200} height={40} className="h-10 object-contain object-left hidden dark:block" sizes="200px" priority loading="eager" />
              <p className="text-sm text-foreground">Sign in to your account</p>
            </div>
          }
        >
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </AuthCard>
      </AuthLayout>
    );
  }

  // Show redirecting state when authenticated (useEffect will redirect)
  if (status === "authenticated") {
    return (
      <AuthLayout>
        <AuthCard
          header={
            <div className="space-y-2">
              <Image src="/Yiba%20Verified%20Logo.webp" alt="Yiba Verified" width={200} height={40} className="h-10 object-contain object-left dark:hidden" sizes="200px" priority loading="eager" />
              <Image src="/YIBA%20VERIFIED%20DARK%20MODE%20LOGO.webp" alt="Yiba Verified" width={200} height={40} className="h-10 object-contain object-left hidden dark:block" sizes="200px" priority loading="eager" />
              <p className="text-sm text-foreground">Sign in to your account</p>
            </div>
          }
        >
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Redirecting…</p>
          </div>
        </AuthCard>
      </AuthLayout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
        setLoading(false);
        return;
      }

      if (result?.ok) {
        // Log login activity
        try {
          await fetch("/api/account/activity/log", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ activityType: "LOGIN" }),
          });
        } catch (err) {
          // Don't block login if activity logging fails
          console.error("Failed to log activity:", err);
        }

        // Fetch session to get role for redirect (ensures session is ready)
        const response = await fetch("/api/auth/session");
        const data = await response.json();
        const role = data?.user?.role as Role | undefined;
        const path = role && roleRedirects[role];

        if (path) {
          const next = searchParams.get("next");
          const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : null;
          const redirectPath = safeNext || path;
          // Refresh so the next page gets a fresh RSC fetch with the new session, then navigate
          router.refresh();
          router.replace(redirectPath);
        } else {
          router.replace("/unauthorized");
        }
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <AuthCard
        header={
          <div className="space-y-2">
            <Image src="/Yiba%20Verified%20Logo.webp" alt="Yiba Verified" width={200} height={40} className="h-10 object-contain object-left dark:hidden" sizes="200px" priority loading="eager" />
            <Image src="/YIBA%20VERIFIED%20DARK%20MODE%20LOGO.webp" alt="Yiba Verified" width={200} height={40} className="h-10 object-contain object-left hidden dark:block" sizes="200px" priority loading="eager" />
            <p className="text-sm text-foreground">Sign in to your account</p>
          </div>
        }
      >
        <div className="space-y-4">
          <AuthSocialButton
            provider="Google"
            icon={<GoogleIcon className="h-5 w-5" />}
            onClick={() => signIn("google")}
          />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="h-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" strokeWidth={1.5} />
                  ) : (
                    <Eye className="h-4 w-4" strokeWidth={1.5} />
                  )}
                </button>
              </div>
            </div>
            <div className="flex items-center">
              <Checkbox
                id="remember-me"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                label="Remember me"
              />
            </div>
            {success && (
              <Alert variant="success" description={success} className="mb-0 rounded-xl border-border/60" />
            )}
            {error && (
              <Alert variant="error" description={error} className="mb-0 rounded-xl border-border/60" />
            )}
            <Button
              type="submit"
              className="w-full h-11 font-semibold rounded-xl"
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" strokeWidth={2} />}
              {loading ? "Signing in..." : "Sign in"}
            </Button>

          </form>
        </div>
      </AuthCard>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <AuthLayout>
          <AuthCard
            header={
              <div className="space-y-2">
                <Image src="/Yiba%20Verified%20Logo.webp" alt="Yiba Verified" width={200} height={40} className="h-10 object-contain object-left dark:hidden" sizes="200px" priority loading="eager" />
                <Image src="/YIBA%20VERIFIED%20DARK%20MODE%20LOGO.webp" alt="Yiba Verified" width={200} height={40} className="h-10 object-contain object-left hidden dark:block" sizes="200px" priority loading="eager" />
                <p className="text-sm text-foreground">Sign in to your account</p>
              </div>
            }
          >
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          </AuthCard>
        </AuthLayout>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
