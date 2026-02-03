"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Mail, Clock, X, CheckCircle, Camera, Loader2, User } from "lucide-react";
import { ChangeEmailModal } from "./ChangeEmailModal";

import { ImageCropperModal } from "@/components/ui/ImageCropperModal";
import { cn } from "@/lib/utils";

type ProfileFormProps = {
  firstName: string;
  lastName: string;
  email: string;
  emailVerified: Date | null;
  image?: string | null;
};

export function ProfileForm({ firstName, lastName, email, emailVerified, image }: ProfileFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [pendingEmailChange, setPendingEmailChange] = useState<{
    newEmail: string;
    expiresAt: string;
    requestId: string;
  } | null>(null);

  const [cropperOpen, setCropperOpen] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Please select an image file." });
      return;
    }
    // We can do a preliminary size check, but cropping might reduce it. 
    // Let's just create object URL and open cropper.
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setSelectedImageSrc(reader.result?.toString() || null);
      setCropperOpen(true);
    });
    reader.readAsDataURL(file);
    // Reset input so same file triggers change
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    // Check size after crop
    if (croppedBlob.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "Image size too large (max 5MB)." });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      // Append as a file
      formData.append("file", croppedBlob, "profile-pic.jpg");

      const res = await fetch("/api/account/profile/image", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to upload image");
      }

      router.refresh();
      setMessage({ type: "success", text: "Profile picture updated!" });
    } catch (err: any) {
      console.error(err);
      setMessage({ type: "error", text: err.message || "Failed to upload image." });
    } finally {
      setUploading(false);
    }
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

  const initials = `${firstName[0]}${lastName[0]}`.toUpperCase();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-6">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />
        <div className="relative group">
          {image ? (
            <img
              src={image}
              alt="Profile"
              className="h-20 w-20 rounded-full object-cover border-2 border-border"
            />
          ) : (
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center border-2 border-border text-2xl font-semibold text-muted-foreground">
              {initials}
            </div>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={cn(
              "absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md transition-transform hover:scale-105",
              uploading && "opacity-70 cursor-not-allowed"
            )}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          </button>
        </div>
        <div>
          <h3 className="text-lg font-medium">Profile Picture</h3>
          <p className="text-sm text-muted-foreground">
            Click the camera icon to upload. Max 5MB.
          </p>
        </div>
      </div>

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
          className={`text-sm ${message.type === "success"
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

      {selectedImageSrc && (
        <ImageCropperModal
          open={cropperOpen}
          onOpenChange={setCropperOpen}
          imageSrc={selectedImageSrc}
          onCropComplete={handleCropComplete}
          aspect={1}
        />
      )}
    </form>
  );
}
