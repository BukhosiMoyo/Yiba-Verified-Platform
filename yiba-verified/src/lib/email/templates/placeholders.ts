/**
 * Safe placeholders for invite email templates.
 * Only these keys are replaced; no arbitrary user HTML.
 */
export const INVITE_PLACEHOLDERS = [
  "recipient_name",
  "institution_name",
  "inviter_name",
  "role",
  "invite_link",
  "action_url",
  "expiry_date",
] as const;

/** Human-readable labels for placeholder reference in UI */
export const PLACEHOLDER_LABELS: Record<(typeof INVITE_PLACEHOLDERS)[number], string> = {
  recipient_name: "Recipient name or email local part",
  institution_name: "Institution name",
  inviter_name: "Person who sent the invite",
  role: "Role label",
  invite_link: "Tracked invite URL",
  action_url: "Primary action link (e.g. invite or reset link)",
  expiry_date: "Expiry date for the link (e.g. invite or token expiry)",
};

export type InvitePlaceholderKey = (typeof INVITE_PLACEHOLDERS)[number];

export interface InviteTemplateContext {
  recipient_name: string;
  institution_name: string;
  inviter_name: string;
  role: string;
  invite_link: string;
  action_url?: string;
  expiry_date?: string;
}

const PLACEHOLDER_PATTERN = /\{\{(\w+)\}\}/g;

/**
 * Replace safe placeholders in a string. Unknown placeholders are left as-is.
 */
export function replacePlaceholders(
  text: string,
  context: Partial<InviteTemplateContext>
): string {
  return text.replace(PLACEHOLDER_PATTERN, (_, key: string) => {
    if (INVITE_PLACEHOLDERS.includes(key as InvitePlaceholderKey)) {
      const value = context[key as InvitePlaceholderKey];
      return value != null ? String(value) : "";
    }
    return `{{${key}}}`;
  });
}
