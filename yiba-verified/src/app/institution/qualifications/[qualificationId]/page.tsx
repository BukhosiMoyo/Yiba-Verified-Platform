
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { QualificationOverviewInstitution } from "@/components/institution/QualificationOverviewInstitution";
import type { InstitutionQualificationSafe } from "@/components/institution/QualificationOverviewInstitution";
import { ChevronLeft, Loader2, GraduationCap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";

export default function InstitutionQualificationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const qualificationId = params?.qualificationId as string;
  const [qualification, setQualification] = useState<InstitutionQualificationSafe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Apply state
  const [applying, setApplying] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState<string>("ON_SITE");
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  useEffect(() => {
    if (!qualificationId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      fetch(`/api/institutions/qualifications/${qualificationId}`),
      fetch(`/api/institutions/readiness?qualification_id=${qualificationId}`)
    ])
      .then(async ([qualRes, readRes]) => {
        if (cancelled) return;

        if (qualRes.status === 404) {
          setError("Qualification not found");
          return;
        }
        if (qualRes.status === 403) {
          setError("You don't have access to this qualification.");
          return;
        }
        if (!qualRes.ok) {
          throw new Error("Failed to load qualification");
        }
        const qualData = await qualRes.json();
        setQualification(qualData);

        if (readRes.ok) {
          const readData = await readRes.json();
          // Check if items array has entries
          if (readData.items && readData.items.length > 0) {
            setAlreadyApplied(true);
          }
        }
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

  const handleApply = async () => {
    if (!qualification) return;
    try {
      setApplying(true);
      const res = await fetch("/api/institutions/readiness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qualification_id: qualification.id, // Ensure ID is mapped correctly
          delivery_mode: deliveryMode,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to apply");
      }

      const readiness = await res.json();
      toast.success("Application started successfully!");
      setApplyOpen(false);
      router.push(`/institution/readiness/${readiness.readiness_id}`);
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setApplying(false);
    }
  };

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <QualificationOverviewInstitution qualification={qualification} />
        </div>

        <div className="space-y-6">
          {/* Action Card */}
          <Card>
            <CardHeader>
              <CardTitle>Action</CardTitle>
              <CardDescription>Start the process to offer this qualification.</CardDescription>
            </CardHeader>
            <CardContent>
              {alreadyApplied ? (
                <Alert className="bg-muted border-primary/20">
                  <GraduationCap className="h-4 w-4" />
                  <AlertTitle>Applied</AlertTitle>
                  <AlertDescription>Your institution has already started the application for this qualification.</AlertDescription>
                </Alert>
              ) : (
                <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full" size="lg">Apply to Offer</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Apply to Offer Qualification</DialogTitle>
                      <DialogDescription>Select your delivery mode to begin the readiness process (Form 5).</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Qualification</Label>
                        <div className="font-medium">{qualification.name}</div>
                      </div>
                      <div className="space-y-2">
                        <Label>Delivery Mode</Label>
                        <Select value={deliveryMode} onValueChange={setDeliveryMode}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ON_SITE">Physical / Contact</SelectItem>
                            <SelectItem value="ONLINE">Online</SelectItem>
                            <SelectItem value="HYBRID">Hybrid / Blended</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setApplyOpen(false)}>Cancel</Button>
                      <Button onClick={handleApply} disabled={applying}>
                        {applying ? "Creating..." : "Start Application"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </CardContent>
            {alreadyApplied && (
              <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/institution/readiness">View My Applications</Link>
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
