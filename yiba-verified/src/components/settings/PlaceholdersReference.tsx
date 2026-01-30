"use client";

import { INVITE_PLACEHOLDERS, PLACEHOLDER_LABELS } from "@/lib/email/templates/placeholders";
import { Card } from "@/components/ui/card";

export function PlaceholdersReference() {
  return (
    <Card className="border-border bg-muted/30 p-4">
      <h4 className="text-sm font-semibold text-foreground mb-2">Placeholders</h4>
      <p className="text-xs text-muted-foreground mb-3">
        Use these in subject and body. They are replaced when the email is sent.
      </p>
      <ul className="space-y-2 text-xs">
        {INVITE_PLACEHOLDERS.map((key) => (
          <li key={key} className="flex flex-wrap gap-x-2 gap-y-0.5">
            <code className="rounded bg-border px-1.5 py-0.5 font-mono text-foreground">
              {"{{" + key + "}}"}
            </code>
            <span className="text-muted-foreground">— {PLACEHOLDER_LABELS[key]}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
