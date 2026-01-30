"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Mail, Clock, X, CheckCircle } from "lucide-react";
import { ChangeEmailModal } from "./ChangeEmailModal";

type ProfileFormProps = {
  firstName: string;
  lastName: string;
  email: string;
  emailVerified: Date | null;
};

export function ProfileForm({ firstName, lastName, email, emailVerified }: ProfileFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [pendingEmailChange, setPendingEmailChange] = useState<{
    newEmail: string;
    expiresAt: string;
    requestId: string;
  } | null>(null);

  // Check for error query param
  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "token_expired") {
      setMessage({ type: "error", text: "The email verification link has expired. Please request a new one." });
    } else if (error === "invalid_token") {
      setMessage({ type: "error", text: "Invalid verification link. Please request a new email change." });
    } else if (error === "verification_failed") {
      setMessage({ type: "error", text: "Email verification failed. Please try again." });
    }
  }, [searchParams]);

  // Check for pending email change
  useEffect(() => {
    checkPendingEmailChange();
  }, []);

  const checkPendingEmailChange = async () => {
    try {
      const response = await fetch("/api/account/email/pending");
      if (response.ok) {
        const data = await response.json();
        if (data.pending) {
          setPendingEmailChange({
            newEmail: data.newEmail,
            expiresAt: data.expiresAt,
            requestId: data.requestId,
          });
        } else {
          setPendingEmailChange(null);
        }
      }
    } catch (err) {
      console.error("Failed to check pending email change:", err);
    }
  };

  const handleCancelPendingChange = async () => {
    if (!pendingEmailChange) return;

    try {
      const response = await fetch("/api/account/email/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: pendingEmailChange.requestId }),
      });

      if (response.ok) {
        setPendingEmailChange(null);
        setMessage({ type: "success", text: "Email change request cancelled." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Failed to cancel request." });
    }
  };

  const getTimeRemaining = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const first_name = (formData.get("firstName") as string)?.trim() || "";
    const last_name = (formData.get("lastName") as string)?.trim() || "";

    if (!first_name || !last_name) {
      setMessage({ type: "error", text: "First name and last name are required." });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ first_name, last_name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Failed to save changes." });
        return;
      }
      setMessage({ type: "success", text: "Changes saved successfully." });
      router.refresh();
    } catch {
      setMessage({ type: "error", text: "Failed to save changes." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            name="firstName"
            defaultValue={firstName}
            placeholder="First name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            name="lastName"
            defaultValue={lastName}
            placeholder="Last name"
          />
        </div>
      </div>
      {/* Email Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="email">Email Address</Label>
          {emailVerified && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-300 dark:border-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Input
            id="email"
            name="email"
            type="email"
            value={email}
            readOnly
            disabled
            className="bg-muted flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setEmailModalOpen(true)}
            className="shrink-0"
          >
            <Mail className="h-4 w-4 mr-1.5" />
            Change
          </Button>
        </div>

        {/* Pending Email Change Banner */}
        {pendingEmailChange && (
          <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 min-w-0">
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Pending change to <span className="font-medium">{pendingEmailChange.newEmail}</span>
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Expires in {getTimeRemaining(pendingEmailChange.expiresAt)}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCancelPendingChange}
              className="text-amber-700 hover:text-amber-800 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/50 shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Change Email Modal */}
      <ChangeEmailModal
        open={emailModalOpen}
        onOpenChange={setEmailModalOpen}
        currentEmail={email}
        onSuccess={() => {
          checkPendingEmailChange();
        }}
      />
      {message && (
        <p
          className={`text-sm ${
            message.type === "success"
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {message.text}
        </p>
      )}
      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
