"use client";

import { useState, useEffect } from "react";
import { Mail, Lock, AlertCircle, CheckCircle, Loader2, X, Eye, EyeOff, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ChangeEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentEmail: string;
  onSuccess?: () => void;
}

type ModalState = "form" | "success" | "pending";

export function ChangeEmailModal({
  open,
  onOpenChange,
  currentEmail,
  onSuccess,
}: ChangeEmailModalProps) {
  const [state, setState] = useState<ModalState>("form");
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pendingInfo, setPendingInfo] = useState<{
    newEmail: string;
    expiresAt: string;
    requestId: string;
  } | null>(null);

  // Check for pending request on open
  useEffect(() => {
    if (open) {
      checkPendingRequest();
    } else {
      // Reset form when closed
      setNewEmail("");
      setPassword("");
      setError("");
      setState("form");
    }
  }, [open]);

  const checkPendingRequest = async () => {
    try {
      const response = await fetch("/api/account/email/pending");
      if (response.ok) {
        const data = await response.json();
        if (data.pending) {
          setPendingInfo({
            newEmail: data.newEmail,
            expiresAt: data.expiresAt,
            requestId: data.requestId,
          });
          setState("pending");
        }
      }
    } catch (err) {
      console.error("Failed to check pending request:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/account/email/request-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail, currentPassword: password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to request email change");
        return;
      }

      setState("success");
      onSuccess?.();
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!pendingInfo) return;
    setIsLoading(true);

    try {
      const response = await fetch("/api/account/email/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: pendingInfo.requestId }),
      });

      if (response.ok) {
        setPendingInfo(null);
        setState("form");
      } else {
        const data = await response.json();
        setError(data.error || "Failed to cancel request");
      }
    } catch (err) {
      setError("Failed to cancel request");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/account/email/resend", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to resend verification email");
        return;
      }

      // Update expiry time
      if (pendingInfo && data.expiresAt) {
        setPendingInfo({ ...pendingInfo, expiresAt: data.expiresAt });
      }
    } catch (err) {
      setError("Failed to resend verification email");
    } finally {
      setIsLoading(false);
    }
  };

  const getTimeRemaining = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        {state === "form" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Change Email Address
              </DialogTitle>
              <DialogDescription>
                A verification link will be sent to your new email address.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {/* Current Email */}
              <div className="space-y-2">
                <Label htmlFor="current-email">Current Email</Label>
                <Input
                  id="current-email"
                  type="email"
                  value={currentEmail}
                  disabled
                  className="bg-muted"
                />
              </div>

              {/* New Email */}
              <div className="space-y-2">
                <Label htmlFor="new-email">New Email Address</Label>
                <Input
                  id="new-email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Enter your new email"
                  required
                  autoComplete="email"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Confirm Your Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your current password"
                    required
                    autoComplete="current-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Info box */}
              <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  A verification link will be sent to your new email. Your current email will be notified of this change for security.
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900">
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading || !newEmail || !password}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Mail className="h-4 w-4 mr-2" />
                  )}
                  Request Change
                </Button>
              </div>
            </form>
          </>
        )}

        {state === "success" && (
          <div className="text-center py-6">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Check Your New Email</h3>
            <p className="text-sm text-muted-foreground mb-4">
              We've sent a verification link to:
            </p>
            <p className="font-medium text-foreground mb-4">{newEmail}</p>
            <p className="text-sm text-muted-foreground mb-6">
              Click the link in that email to complete the change. The link expires in 24 hours.
            </p>
            <div className="space-y-2 text-xs text-muted-foreground mb-6">
              <p>Didn't receive it?</p>
              <p>• Check your spam folder</p>
            </div>
            <Button onClick={() => onOpenChange(false)} className="w-full">
              Close
            </Button>
          </div>
        )}

        {state === "pending" && pendingInfo && (
          <div className="py-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-amber-500" />
                Pending Email Change
              </DialogTitle>
            </DialogHeader>

            <div className="mt-4 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-800 dark:text-amber-200 mb-2">
                You have a pending email change request:
              </p>
              <p className="font-medium text-amber-900 dark:text-amber-100 mb-2">
                {pendingInfo.newEmail}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Expires in {getTimeRemaining(pendingInfo.expiresAt)}
              </p>
            </div>

            {error && (
              <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            <div className="mt-6 space-y-2">
              <Button
                onClick={handleResend}
                disabled={isLoading}
                className="w-full"
                variant="outline"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                Resend Verification Email
              </Button>
              <Button
                onClick={handleCancel}
                disabled={isLoading}
                variant="ghost"
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel Request
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
