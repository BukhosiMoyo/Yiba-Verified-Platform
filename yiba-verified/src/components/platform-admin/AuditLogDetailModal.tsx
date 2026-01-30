"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatFieldLabel } from "@/lib/audit-display";
import { User, Building2, FileText, MessageSquare, Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";

type AuditLogEntry = {
  audit_id: string;
  changed_at: Date | string;
  changed_by: string | null;
  change_type: string;
  entity_type: string;
  entity_id: string;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  reason: string | null;
  role_at_time: string;
  changedBy?: {
    user_id: string;
    email: string | null;
    first_name: string | null;
    last_name: string | null;
  } | null;
  institution?: {
    institution_id: string;
    legal_name: string | null;
    trading_name: string | null;
  } | null;
  relatedSubmission?: {
    submission_id: string;
    title: string | null;
    status: string | null;
  } | null;
  relatedQCTORequest?: {
    request_id: string;
    title: string | null;
    status: string | null;
  } | null;
  oldInstitution?: {
    institution_id: string;
    legal_name: string | null;
    trading_name: string | null;
  } | null;
  newInstitution?: {
    institution_id: string;
    legal_name: string | null;
    trading_name: string | null;
  } | null;
  entityUser?: {
    user_id: string;
    email: string | null;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    role: string;
    status: string;
    institution: {
      institution_id: string;
      legal_name: string | null;
      trading_name: string | null;
    } | null;
  } | null;
};

interface AuditLogDetailModalProps {
  entry: AuditLogEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatChangeType(type: string): { label: string; variant: "default" | "secondary" | "destructive" | "outline" } {
  switch (type) {
    case "CREATE":
      return { label: "Created", variant: "default" };
    case "UPDATE":
      return { label: "Updated", variant: "secondary" };
    case "DELETE":
      return { label: "Deleted", variant: "destructive" };
    case "STATUS_CHANGE":
      return { label: "Status Changed", variant: "outline" };
    default:
      return { label: type, variant: "outline" };
  }
}

function formatEntityType(type: string): string {
  return type
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

// Helper to check if a string looks like a UUID
function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

function getDisplayValue(
  value: string | null, 
  fieldName: string | null, 
  oldInstitution?: { institution_id: string; legal_name: string | null; trading_name: string | null } | null,
  newInstitution?: { institution_id: string; legal_name: string | null; trading_name: string | null } | null,
  isOld: boolean = false
): string {
  // Handle empty/null values first
  if (value === null || value === undefined || value === "" || value === "null") {
    return "(empty)";
  }
  
  // PRIORITY 1: Handle institution_id resolution FIRST (before any JSON parsing)
  if (fieldName === "institution_id") {
    const inst = isOld ? oldInstitution : newInstitution;
    if (inst) {
      // If we have resolved institution data, use it immediately
      // This is the most reliable way since the page component already matched the UUID to the institution
      const displayName = inst.trading_name || inst.legal_name || inst.institution_id;
      return displayName;
    }
    // If no institution data but field is institution_id, the resolution might have failed
    // Fall through to show the raw value (shouldn't happen in production)
  }
  
  // PRIORITY 2: Handle other field types (phone, email, name, etc.)
  // Try to parse as JSON (some values like arrays/objects are stored as JSON)
  try {
    const parsed = JSON.parse(value);
    
    // If it's a string after parsing, return it directly (phone numbers, names, emails, etc.)
    if (typeof parsed === "string") {
      return parsed;
    }
    
    // If it's a number or boolean, convert to string
    if (typeof parsed === "number" || typeof parsed === "boolean") {
      return String(parsed);
    }
    
    // If it's null, show empty
    if (parsed === null) {
      return "(empty)";
    }
    
    // If it's an array, show it nicely
    if (Array.isArray(parsed)) {
      return parsed.length > 0 ? parsed.join(", ") : "(empty array)";
    }
    
    // If it's an object, format it
    if (typeof parsed === "object") {
      return JSON.stringify(parsed, null, 2);
    }
    
    return String(parsed);
  } catch {
    // Not JSON - stored as plain string (phone numbers, emails, etc.)
    // Return as-is
    return value;
  }
}

function DiffView({ 
  oldValue, 
  newValue, 
  fieldName,
  oldInstitution,
  newInstitution
}: { 
  oldValue: string | null; 
  newValue: string | null; 
  fieldName: string | null;
  oldInstitution?: { institution_id: string; legal_name: string | null; trading_name: string | null } | null;
  newInstitution?: { institution_id: string; legal_name: string | null; trading_name: string | null } | null;
}) {
  const oldDisplay = getDisplayValue(oldValue, fieldName, oldInstitution, newInstitution, true);
  const newDisplay = getDisplayValue(newValue, fieldName, oldInstitution, newInstitution, false);
  const hasChange = oldDisplay !== newDisplay;
  
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="h-3.5 w-3.5 rounded bg-red-100 border border-red-300 flex items-center justify-center shrink-0">
            <span className="text-[9px] text-red-700 font-bold">−</span>
          </div>
          <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">Old Value</span>
        </div>
        <div className={`border rounded-lg p-3 ${hasChange ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"}`}>
          <p className={`text-sm whitespace-pre-wrap break-words ${hasChange ? "text-gray-900" : "text-gray-500"}`}>
            {oldDisplay}
          </p>
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="h-3.5 w-3.5 rounded bg-green-100 border border-green-300 flex items-center justify-center shrink-0">
            <span className="text-[9px] text-green-700 font-bold">+</span>
          </div>
          <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">New Value</span>
        </div>
        <div className={`border rounded-lg p-3 ${hasChange ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}>
          <p className={`text-sm whitespace-pre-wrap break-words ${hasChange ? "text-gray-900 font-medium" : "text-gray-500"}`}>
            {newDisplay}
          </p>
        </div>
      </div>
    </div>
  );
}

export function AuditLogDetailModal({ entry, open, onOpenChange }: AuditLogDetailModalProps) {
  if (!entry) return null;

  const changeTypeInfo = formatChangeType(entry.change_type);
  const userName = entry.changedBy
    ? `${entry.changedBy.first_name || ""} ${entry.changedBy.last_name || ""}`.trim() || entry.changedBy.email || "—"
    : entry.changed_by || "—";
  const userEmail = entry.changedBy?.email || entry.changed_by || "—";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="pb-3 border-b">
          <DialogTitle className="text-xl font-bold">Audit Entry</DialogTitle>
          <DialogDescription className="text-xs">Change details and metadata</DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Top Row: Metadata in Grid */}
          <div className="grid grid-cols-4 gap-4">
            {/* Timestamp */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-3 w-3 text-gray-500" />
                <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">Timestamp</span>
              </div>
              <p className="text-xs text-gray-900 font-mono">
                {new Date(entry.changed_at).toLocaleDateString("en-ZA", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            {/* User */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <User className="h-3 w-3 text-gray-500" />
                <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">Changed By</span>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-gray-900 truncate">{userName}</p>
                <p className="text-[10px] text-gray-600 truncate">{userEmail}</p>
                <Badge variant="outline" className="text-[9px] px-1 py-0 mt-0.5">
                  {entry.role_at_time.replace(/_/g, " ")}
                </Badge>
              </div>
            </div>

            {/* Action */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">Action</span>
              </div>
              <Badge variant={changeTypeInfo.variant} className="text-xs">{changeTypeInfo.label}</Badge>
            </div>

            {/* Entity & Field */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-3 w-3 text-gray-500" />
                <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">Entity / Field</span>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-gray-900">{formatEntityType(entry.entity_type)}</p>
                <p className="text-xs font-medium text-gray-700">{formatFieldLabel(entry.field_name)}</p>
                <p className="text-[9px] font-mono text-gray-500 truncate">{entry.entity_id}</p>
              </div>
            </div>
          </div>

          {/* Main Content: Two Columns */}
          <div className="grid grid-cols-2 gap-4">
            {/* Left Column */}
            <div className="space-y-3">
              {/* User Profile Details - Show when entity is a USER */}
              {entry.entity_type === "USER" && entry.entityUser && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-gray-500" />
                      <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">Profile Details</span>
                    </div>
                    <Link
                      href={`/platform-admin/users/${entry.entityUser.user_id}`}
                      className="text-[10px] text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      View →
                    </Link>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] font-semibold text-gray-600">Name:</span>
                        <p className="text-gray-900 mt-0.5">
                          {entry.entityUser.first_name || entry.entityUser.last_name
                            ? `${entry.entityUser.first_name || ""} ${entry.entityUser.last_name || ""}`.trim()
                            : "—"}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-gray-600">Email:</span>
                        <p className="text-gray-900 mt-0.5 truncate">{entry.entityUser.email || "—"}</p>
                      </div>
                      {entry.entityUser.phone && (
                        <div>
                          <span className="text-[10px] font-semibold text-gray-600">Phone:</span>
                          <p className="text-gray-900 mt-0.5">{entry.entityUser.phone}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-[10px] font-semibold text-gray-600">Role:</span>
                        <div className="mt-0.5">
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                            {entry.entityUser.role.replace(/_/g, " ")}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-gray-600">Status:</span>
                        <div className="mt-0.5">
                          <Badge 
                            variant={entry.entityUser.status === "ACTIVE" ? "default" : "secondary"} 
                            className="text-[9px] px-1.5 py-0"
                          >
                            {entry.entityUser.status}
                          </Badge>
                        </div>
                      </div>
                      {entry.entityUser.institution && (
                        <div className="col-span-2">
                          <span className="text-[10px] font-semibold text-gray-600">Institution:</span>
                          <div className="mt-0.5">
                            <Link
                              href={`/platform-admin/institutions/${entry.entityUser.institution.institution_id}`}
                              className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {entry.entityUser.institution.trading_name || entry.entityUser.institution.legal_name}
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Related */}
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Building2 className="h-3.5 w-3.5 text-gray-500" />
                  <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">Related</span>
                </div>
                <div className="space-y-1">
                  {entry.institution && (
                    <Link
                      href={`/platform-admin/institutions/${entry.institution.institution_id}`}
                      className="block text-xs text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      Institution: {entry.institution.trading_name || entry.institution.legal_name}
                    </Link>
                  )}
                  {entry.relatedSubmission && (
                    <Link
                      href={`/platform-admin/submissions/${entry.relatedSubmission.submission_id}`}
                      className="block text-xs text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      Submission: {entry.relatedSubmission.title || entry.relatedSubmission.submission_id}
                    </Link>
                  )}
                  {entry.relatedQCTORequest && (
                    <Link
                      href={`/qcto/requests/${entry.relatedQCTORequest.request_id}`}
                      className="block text-xs text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      Request: {entry.relatedQCTORequest.title || entry.relatedQCTORequest.request_id}
                    </Link>
                  )}
                  {!entry.institution && !entry.relatedSubmission && !entry.relatedQCTORequest && (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </div>
              </div>

              {/* Reason */}
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-gray-500" />
                  <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">Reason</span>
                </div>
                <p className="text-xs text-gray-700">{entry.reason || "No reason provided"}</p>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-3">
              {/* Change - Diff View */}
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">Change</span>
                </div>
                <DiffView 
                  oldValue={entry.old_value} 
                  newValue={entry.new_value} 
                  fieldName={entry.field_name}
                  oldInstitution={entry.oldInstitution}
                  newInstitution={entry.newInstitution}
                />
              </div>

              {/* Raw Technical - Collapsible/Compact */}
              <details className="group">
                <summary className="cursor-pointer flex items-center gap-2 mb-1.5 text-[10px] font-semibold text-gray-600 uppercase tracking-wide hover:text-gray-900">
                  <span>Raw (Technical)</span>
                  <span className="text-[9px] text-gray-400 group-open:hidden">▼</span>
                  <span className="text-[9px] text-gray-400 hidden group-open:inline">▲</span>
                </summary>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 mt-1 space-y-1.5">
                  <div>
                    <span className="text-[9px] font-semibold text-gray-600">Old:</span>
                    <pre className="text-[9px] text-gray-700 mt-0.5 whitespace-pre-wrap break-words font-mono bg-white p-1.5 rounded border border-gray-200">
                      {entry.old_value || "(empty)"}
                    </pre>
                  </div>
                  <div>
                    <span className="text-[9px] font-semibold text-gray-600">New:</span>
                    <pre className="text-[9px] text-gray-700 mt-0.5 whitespace-pre-wrap break-words font-mono bg-white p-1.5 rounded border border-gray-200">
                      {entry.new_value || "(empty)"}
                    </pre>
                  </div>
                </div>
              </details>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
