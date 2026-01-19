"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { Role } from "@/lib/rbac";

const roleRedirects: Record<Role, string> = {
  PLATFORM_ADMIN: "/platform-admin",
  QCTO_USER: "/qcto",
  INSTITUTION_ADMIN: "/institution",
  INSTITUTION_STAFF: "/institution",
  STUDENT: "/student",
};

export default function LoginPage() {
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
      if (role && roleRedirects[role]) {
        router.replace(roleRedirects[role]);
      }
    }
  }, [status, session, router]);

  // Check if user just registered
  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setSuccess("Account created successfully! You can sign in now.");
      // Clean up URL
      router.replace("/login", { scroll: false });
    }
  }, [searchParams, router]);

  // Show loading state while checking session
  if (status === "loading") {
    return (
      <AuthLayout>
        <AuthCard title="Yiba Verified" subtitle="Sign in to your account">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </AuthCard>
      </AuthLayout>
    );
  }

  // Don't render form if user is authenticated (redirect will happen)
  if (status === "authenticated") {
    return null;
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
        // Fetch session to get role for redirect
        const response = await fetch("/api/auth/session");
        const session = await response.json();
        const role = session?.user?.role as Role | undefined;

        if (role && roleRedirects[role]) {
          const next = searchParams.get("next");
          const redirectPath = next || roleRedirects[role];
          router.push(redirectPath);
          router.refresh();
        } else {
          router.push("/unauthorized");
        }
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <AuthCard title="Yiba Verified" subtitle="Sign in to your account">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
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
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <Link
                href="/forgot-password"
                className="text-sm text-blue-700 hover:text-blue-800 hover:underline"
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
            <Alert
              variant="success"
              description={success}
              className="mb-0"
            />
          )}
          {error && (
            <Alert
              variant="error"
              description={error}
              className="mb-0"
            />
          )}
          <Button
            type="submit"
            className="w-full h-10 font-semibold"
            disabled={loading}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" strokeWidth={2} />}
            {loading ? "Signing in..." : "Sign in"}
          </Button>

        </form>
      </AuthCard>
    </AuthLayout>
  );
}
