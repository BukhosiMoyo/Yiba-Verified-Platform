"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type ProfileFormProps = {
  firstName: string;
  lastName: string;
  email: string;
  emailVerified: Date | null;
};

export function ProfileForm({ firstName, lastName, email, emailVerified }: ProfileFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="flex items-center gap-2">
          <Input
            id="email"
            name="email"
            type="email"
            value={email}
            readOnly
            disabled
            className="bg-muted"
          />
          {emailVerified && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-300 dark:border-green-800">
              Verified
            </Badge>
          )}
        </div>
      </div>
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
