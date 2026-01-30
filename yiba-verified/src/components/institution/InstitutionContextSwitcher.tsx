"use client";

import { useState } from "react";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem } from "@/components/ui/select";
import type { InstitutionDisplay } from "@/lib/currentInstitution";

type InstitutionContextSwitcherProps = {
  institutions: InstitutionDisplay[];
  currentInstitutionId: string | null;
  className?: string;
};

function institutionLabel(inst: InstitutionDisplay): string {
  if (inst.branch_code) {
    return `${inst.legal_name} (${inst.branch_code})`;
  }
  return inst.legal_name;
}

export function InstitutionContextSwitcher({
  institutions,
  currentInstitutionId,
  className,
}: InstitutionContextSwitcherProps) {
  const [loading, setLoading] = useState(false);

  if (institutions.length <= 1) return null;

  const handleChange = async (value: string) => {
    if (value === currentInstitutionId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/institution/context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ institution_id: value }),
      });
      if (res.ok) {
        window.location.reload();
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      <Select
        value={currentInstitutionId ?? undefined}
        onValueChange={handleChange}
        disabled={loading}
        className="w-[220px] max-w-[min(220px,100%)]"
      >
        <SelectContent>
          {institutions.map((inst) => (
            <SelectItem key={inst.institution_id} value={inst.institution_id}>
              {institutionLabel(inst)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
