"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { QualificationOverviewInstitution } from "@/components/institution/QualificationOverviewInstitution";
import type { InstitutionQualificationSafe } from "@/components/institution/QualificationOverviewInstitution";
import { ChevronLeft, Loader2 } from "lucide-react";

export default function InstitutionQualificationDetailPage() {
  const params = useParams();
  const qualificationId = params?.qualificationId as string;
  const [qualification, setQualification] = useState<InstitutionQualificationSafe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!qualificationId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/institutions/qualifications/${qualificationId}`)
      .then((res) => {
        if (res.status === 404) {
          setError("Qualification not found");
          return null;
        }
        if (res.status === 403) {
          setError("You don't have access to this qualification.");
          return null;
        }
        if (!res.ok) {
          return res.json().then((d) => {
            throw new Error(d.error || "Failed to load");
          });
        }
        return res.json();
      })
      .then((data) => {
        if (!cancelled && data) setQualification(data);
        else if (!cancelled) setQualification(null);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "An error occurred");
          setQualification(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [qualificationId]);

  if (loading) {
    return (
      <div className="p-4 md:p-8 space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error || !qualification) {
    return (
      <div className="p-4 md:p-8 space-y-4">
        <p className="text-destructive">{error ?? "Not found"}</p>
        <Button variant="outline" asChild>
          <Link href="/institution/qualifications" className="gap-1">
            <ChevronLeft className="h-4 w-4" /> Qualifications
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/institution/qualifications" className="gap-1">
            <ChevronLeft className="h-4 w-4" /> Qualifications
          </Link>
        </Button>
      </div>

      <QualificationOverviewInstitution qualification={qualification} />
    </div>
  );
}
