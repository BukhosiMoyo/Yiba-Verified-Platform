"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, User, FileText, MessageSquare, AlertTriangle, CheckCircle2, XCircle, ArrowRight, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AuditLog {
  audit_id: string;
  entity_type: string;
  entity_id: string;
  change_type: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  reason: string | null;
  changed_at: Date;
  user_role: string | null; // Role at time of change
  changedBy: {
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
  } | null;
}

// Helper to get user type label (QCTO or Institution)
function getUserTypeLabel(role: string | null): { label: string; isQcto: boolean } | null {
  if (!role) return null;
  
  // QCTO roles
  if (role.startsWith("QCTO_") || role === "PLATFORM_ADMIN") {
    return { label: "QCTO", isQcto: true };
  }
  
  // Institution roles
  if (role === "INSTITUTION_ADMIN" || role === "INSTITUTION_STAFF") {
    return { label: "Institution", isQcto: false };
  }
  
  // Student
  if (role === "STUDENT") {
    return { label: "Student", isQcto: false };
  }
  
  return null;
}

interface ReviewHistoryProps {
  readinessId: string;
}

/**
 * Review History Component
 * 
 * Displays all review actions and changes for a readiness record.
 * Shows audit log entries related to reviews, status changes, document flags, and section reviews.
 */
export function ReviewHistory({ readinessId }: ReviewHistoryProps) {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReviewHistory();
  }, [readinessId]);

  const fetchReviewHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/qcto/readiness/${readinessId}/review-history`);
      if (!response.ok) {
        throw new Error("Failed to fetch review history");
      }
      const data = await response.json();
      setAuditLogs(data.logs || []);
    } catch (err: any) {
      setError(err.message || "Failed to load review history");
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (log: AuditLog) => {
    let newValue: any = null;
    try {
      if (log.new_value) {
        newValue = JSON.parse(log.new_value);
      }
    } catch {
      newValue = log.new_value;
    }

    if (log.field_name === "readiness_status" && newValue) {
      const status = typeof newValue === "string" ? newValue : newValue.readiness_status;
      if (status === "RECOMMENDED") {
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      }
      if (status === "REJECTED") {
        return <XCircle className="h-4 w-4 text-red-600" />;
      }
      if (status === "RETURNED_FOR_CORRECTION") {
        return <ArrowRight className="h-4 w-4 text-amber-600" />;
      }
    }
    if (log.field_name.includes("flag") || log.entity_type === "DOCUMENT" && log.change_type === "STATUS_CHANGE") {
      return <AlertTriangle className="h-4 w-4 text-orange-600" />;
    }
    if (log.change_type === "CREATE") {
      return <FileText className="h-4 w-4 text-blue-600" />;
    }
    return <MessageSquare className="h-4 w-4 text-slate-600" />;
  };

  const getActionBadge = (log: AuditLog) => {
    let newValue: any = null;
    try {
      if (log.new_value) {
        newValue = JSON.parse(log.new_value);
      }
    } catch {
      newValue = log.new_value;
    }

    if (log.field_name === "readiness_status" && newValue) {
      const status = typeof newValue === "string" ? newValue : newValue.readiness_status;
      const statusColors: Record<string, string> = {
        UNDER_REVIEW: "bg-blue-500",
        RETURNED_FOR_CORRECTION: "bg-amber-500",
        REVIEWED: "bg-indigo-500",
        RECOMMENDED: "bg-emerald-500",
        REJECTED: "bg-red-500",
      };
      return (
        <Badge className={statusColors[status] || "bg-slate-500"}>
          {status?.replace(/_/g, " ") || "Status changed"}
        </Badge>
      );
    }
    if (log.field_name.includes("flag")) {
      return <Badge variant="outline" className="border-orange-500 text-orange-700">Flagged</Badge>;
    }
    return null;
  };

  const formatActionDescription = (log: AuditLog) => {
    // Parse new_value if it's JSON
    let newValue: any = null;
    try {
      if (log.new_value) {
        newValue = JSON.parse(log.new_value);
      }
    } catch {
      // Not JSON, use as string
      newValue = log.new_value;
    }

    // Handle readiness status changes
    if (log.field_name === "readiness_status" && newValue) {
      const status = typeof newValue === "string" ? newValue : newValue.readiness_status;
      if (status === "RECOMMENDED") {
        return "Final recommendation: RECOMMENDED";
      }
      if (status === "REJECTED") {
        return "Final recommendation: REJECTED";
      }
      if (status === "RETURNED_FOR_CORRECTION") {
        return "Returned for correction";
      }
      if (status === "UNDER_REVIEW") {
        return "Started review";
      }
      if (status === "REVIEWED") {
        return "Review completed";
      }
      if (status === "SUBMITTED") {
        return "Submitted for review";
      }
      if (status) {
        return `Status changed to ${status.replace(/_/g, " ")}`;
      }
    }
    
    // Handle status field changes (generic)
    if (log.field_name === "status" && newValue) {
      const status = typeof newValue === "string" ? newValue : newValue.status;
      if (status) {
        return `Status updated to ${status.replace(/_/g, " ")}`;
      }
    }
    
    // Handle document operations
    if (log.change_type === "CREATE" && log.entity_type === "DOCUMENT") {
      return "Document uploaded";
    }
    if (log.change_type === "STATUS_CHANGE" && log.entity_type === "DOCUMENT") {
      return "Document status changed";
    }
    if (log.change_type === "UPDATE" && log.entity_type === "DOCUMENT") {
      return "Document updated";
    }
    
    // Handle flags
    if (log.field_name === "flags" || log.field_name.includes("flag")) {
      return `Document flagged: ${log.reason || "No reason provided"}`;
    }
    
    // Handle readiness recommendation
    if (log.entity_type === "READINESS_RECOMMENDATION") {
      return "Recommendation updated";
    }
    
    // Handle readiness record operations
    if (log.entity_type === "READINESS") {
      if (log.change_type === "CREATE") {
        return "Readiness record created";
      }
      if (log.change_type === "UPDATE") {
        // Try to provide meaningful description based on field name
        const fieldDescriptions: Record<string, string> = {
          submission_type: "Submission type updated",
          submission_date: "Submission date updated",
          section_completion_data: "Section progress updated",
          section_criteria_responses: "Criteria responses updated",
          self_assessment_completed: "Self-assessment updated",
          qualification_title: "Qualification title updated",
          delivery_mode: "Delivery mode updated",
          training_site_address: "Training site updated",
        };
        if (fieldDescriptions[log.field_name]) {
          return fieldDescriptions[log.field_name];
        }
        // Format field name to be more readable
        const readableFieldName = log.field_name
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
        return `${readableFieldName} updated`;
      }
    }
    
    // Fallback: format change_type and field_name to be readable
    const changeTypeFormatted = (log.change_type || "Updated")
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
    const fieldNameFormatted = log.field_name
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    return `${changeTypeFormatted}: ${fieldNameFormatted}`;
  };

  if (loading) {
    return (
      <Card className="border-l-4 border-l-slate-500">
        <CardHeader>
          <CardTitle>Review History</CardTitle>
          <CardDescription>Loading review history...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 p-4">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-l-4 border-l-red-500">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <CardTitle>Review History</CardTitle>
              <CardDescription>Error loading history</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-900/20 p-4">
            <p className="text-sm text-red-900 dark:text-red-300">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (auditLogs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Review History</CardTitle>
          <CardDescription>No review history available yet</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-l-4 border-l-slate-500">
      <CardHeader>
        <CardTitle>Review History</CardTitle>
        <CardDescription>
          Complete audit trail of all review actions and status changes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <div className="space-y-4">
            {auditLogs.map((log) => (
              <div
                key={log.audit_id}
                className="flex gap-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 p-4 hover:bg-slate-100/50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  {getActionIcon(log)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                      {formatActionDescription(log)}
                    </p>
                    {getActionBadge(log)}
                  </div>
                  {log.reason && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 whitespace-pre-wrap">{log.reason}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
                    {log.changedBy && (
                      <div className="flex items-center gap-1.5">
                        <User className="h-3 w-3" />
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {log.changedBy.first_name} {log.changedBy.last_name}
                        </span>
                        {(() => {
                          const userType = getUserTypeLabel(log.user_role);
                          if (!userType) return null;
                          return (
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              userType.isQcto
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                            }`}>
                              {userType.label}
                            </span>
                          );
                        })()}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatDistanceToNow(new Date(log.changed_at), { addSuffix: true })}</span>
                    </div>
                    <div className="text-slate-400 dark:text-slate-500">
                      {new Date(log.changed_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
