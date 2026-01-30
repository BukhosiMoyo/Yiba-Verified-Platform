"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, Loader2 } from "lucide-react";

const SERVICE_TYPE_OPTIONS = [
  { value: "ACCREDITATION_HELP", label: "Accreditation help" },
  { value: "ACCOUNTING_SERVICES", label: "Accounting services" },
  { value: "MARKETING_WEBSITES", label: "Websites & marketing" },
  { value: "GENERAL_INQUIRY", label: "General inquiry" },
] as const;

interface FormData {
  name: string;
  email: string;
  organization: string;
  phone: string;
  purpose: string;
  message: string;
}

const initialFormData: FormData = {
  name: "",
  email: "",
  organization: "",
  phone: "",
  purpose: "",
  message: "",
};

export function ContactForm() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handlePurposeChange = (value: string) => {
    setFormData((prev) => ({ ...prev, purpose: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name || !formData.email || !formData.message) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!formData.email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!formData.purpose || !SERVICE_TYPE_OPTIONS.some((o) => o.value === formData.purpose)) {
      setError("Please select what you need help with.");
      return;
    }
    const serviceType = formData.purpose;

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/public/service-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_type: serviceType,
          full_name: formData.name.trim(),
          email: formData.email.trim(),
          organization: formData.organization.trim() || null,
          phone: formData.phone.trim() || null,
          message: formData.message.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send message");
      }
      setIsSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again or email us at hello@yibaverified.co.za.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="text-center py-12">
        <div className="flex justify-center mb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-foreground mb-3">
          Thank you for reaching out!
        </h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          We&apos;ve received your message and will get back to you soon.
        </p>
        <Button
          variant="outline"
          onClick={() => {
            setIsSubmitted(false);
            setFormData(initialFormData);
          }}
        >
          Send Another Message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium text-foreground">
            Name <span className="text-destructive">*</span>
          </label>
          <Input
            id="name"
            name="name"
            placeholder="Your full name"
            value={formData.name}
            onChange={handleChange}
            required
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Email <span className="text-destructive">*</span>
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
            required
            className="h-11"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="organization"
            className="text-sm font-medium text-foreground"
          >
            Organization
          </label>
          <Input
            id="organization"
            name="organization"
            placeholder="Your institution or company"
            value={formData.organization}
            onChange={handleChange}
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="phone" className="text-sm font-medium text-foreground">
            Phone
          </label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="+27..."
            value={formData.phone}
            onChange={handleChange}
            className="h-11"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="purpose" className="text-sm font-medium text-foreground">
          What do you need? <span className="text-destructive">*</span>
        </label>
        <Select value={formData.purpose} onValueChange={handlePurposeChange}>
          <SelectTrigger id="purpose" className="h-11">
            <SelectValue placeholder="Select a topic" />
          </SelectTrigger>
          <SelectContent>
            {SERVICE_TYPE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label htmlFor="message" className="text-sm font-medium text-foreground">
          Message <span className="text-destructive">*</span>
        </label>
        <Textarea
          id="message"
          name="message"
          placeholder="Tell us how we can help..."
          value={formData.message}
          onChange={handleChange}
          required
          rows={5}
          className="resize-none"
        />
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full btn-primary-premium rounded-xl h-12 text-base font-semibold"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          "Send Message"
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        By submitting this form, you agree to our{" "}
        <a href="/privacy-policy" className="underline hover:text-foreground">
          Privacy Policy
        </a>
        .
      </p>
    </form>
  );
}
