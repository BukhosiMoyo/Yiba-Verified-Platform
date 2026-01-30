"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Loader2, UserMinus } from "lucide-react";
import { toast } from "sonner";

type AssignmentRole = "REVIEWER" | "AUDITOR";

interface ReviewerInfo {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

interface Assignment {
  id: string;
  assigned_to: string;
  assigned_at: string;
  status: string;
  assignment_role: string;
  notes: string | null;
  reviewer: ReviewerInfo;
  assigner: { user_id: string; first_name: string; last_name: string; email: string };
}

interface ReadinessAssignmentBlockProps {
  readinessId: string;
  institutionProvince: string;
  canAssign: boolean;
  initialAssignments: Assignment[];
}

function reviewerDisplay(r: ReviewerInfo) {
  const name = [r.first_name, r.last_name].filter(Boolean).join(" ") || r.email;
  return name;
}

export function ReadinessAssignmentBlock({
  readinessId,
  institutionProvince,
  canAssign,
  initialAssignments,
}: ReadinessAssignmentBlockProps) {
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments);
  const [loading, setLoading] = useState(false);
  const [assignRole, setAssignRole] = useState<AssignmentRole | null>(null);
  const [eligible, setEligible] = useState<Array<{ user_id: string; first_name: string; last_name: string; email: string; role: string }>>([]);
  const [eligibleLoading, setEligibleLoading] = useState(false);

  const refetchAssignments = async () => {
    try {
      const res = await fetch(
        `/api/qcto/reviews/assign?reviewType=READINESS&reviewId=${encodeURIComponent(readinessId)}`
      );
      if (res.ok) {
        const data = await res.json();
        setAssignments(data.assignments ?? []);
      }
    } catch {
      // ignore
    }
  };

  const primaryReviewer = assignments.find((a) => a.assignment_role === "REVIEWER");
  const auditor = assignments.find((a) => a.assignment_role === "AUDITOR");

  useEffect(() => {
    if (assignRole) {
      setEligibleLoading(true);
      fetch(
        `/api/qcto/reviews/eligible?reviewType=READINESS&reviewId=${encodeURIComponent(readinessId)}&assignmentRole=${assignRole}`
      )
        .then((r) => r.json())
        .then((data) => {
          setEligible(data.eligibleReviewers ?? []);
        })
        .finally(() => setEligibleLoading(false));
    } else {
      setEligible([]);
    }
  }, [readinessId, assignRole]);

  const handleAssign = async (userId: string, role: AssignmentRole) => {
    setLoading(true);
    try {
      const res = await fetch("/api/qcto/reviews/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewType: "READINESS",
          reviewId: readinessId,
          assignedToUserId: userId,
          assignmentRole: role,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed to assign");
      }
      toast.success("Assigned successfully");
      setAssignRole(null);
      await refetchAssignments();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to assign");
    } finally {
      setLoading(false);
    }
  };

  const handleUnassign = async (userId: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/qcto/reviews/unassign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewType: "READINESS",
          reviewId: readinessId,
          assignedToUserId: userId,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed to unassign");
      }
      toast.success("Unassigned successfully");
      await refetchAssignments();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to unassign");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-l-4 border-l-sky-500">
      <CardHeader>
        <CardTitle>Assignment</CardTitle>
        <CardDescription>
          Reviewer and auditor for this readiness (province: {institutionProvince})
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">Assigned Reviewer</div>
          {primaryReviewer ? (
            <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
              <div>
                <span className="font-medium">{reviewerDisplay(primaryReviewer.reviewer)}</span>
                <Badge variant="secondary" className="ml-2 text-xs">
                  {primaryReviewer.reviewer.role.replace(/^QCTO_/, "").replace(/_/g, " ")}
                </Badge>
              </div>
              {canAssign && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleUnassign(primaryReviewer.assigned_to)}
                  disabled={loading}
                >
                  <UserMinus className="h-4 w-4 mr-1" />
                  Unassign
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
              Not assigned
              {canAssign && (
                <div className="mt-2">
                  {assignRole === "REVIEWER" ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <Select
                        className="w-[220px]"
                        value=""
                        onValueChange={(v) => v && handleAssign(v, "REVIEWER")}
                        disabled={loading}
                      >
                        <option value="">Select reviewer…</option>
                        {eligible.map((u) => (
                          <option key={u.user_id} value={u.user_id}>
                            {[u.first_name, u.last_name].filter(Boolean).join(" ") || u.email} ({u.role.replace(/^QCTO_/, "").replace(/_/g, " ")})
                          </option>
                        ))}
                      </Select>
                      {eligibleLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setAssignRole(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAssignRole("REVIEWER")}
                      disabled={loading}
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Assign Reviewer
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">Assigned Auditor</div>
          {auditor ? (
            <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
              <div>
                <span className="font-medium">{reviewerDisplay(auditor.reviewer)}</span>
                <Badge variant="secondary" className="ml-2 text-xs">
                  {auditor.reviewer.role.replace(/^QCTO_/, "").replace(/_/g, " ")}
                </Badge>
              </div>
              {canAssign && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleUnassign(auditor.assigned_to)}
                  disabled={loading}
                >
                  <UserMinus className="h-4 w-4 mr-1" />
                  Unassign
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
              Not assigned
              {canAssign && (
                <div className="mt-2">
                  {assignRole === "AUDITOR" ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <Select
                        className="w-[220px]"
                        value=""
                        onValueChange={(v) => v && handleAssign(v, "AUDITOR")}
                        disabled={loading}
                      >
                        <option value="">Select auditor…</option>
                        {eligible.map((u) => (
                          <option key={u.user_id} value={u.user_id}>
                            {[u.first_name, u.last_name].filter(Boolean).join(" ") || u.email} ({u.role.replace(/^QCTO_/, "").replace(/_/g, " ")})
                          </option>
                        ))}
                      </Select>
                      {eligibleLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setAssignRole(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAssignRole("AUDITOR")}
                      disabled={loading}
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Assign Auditor
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
