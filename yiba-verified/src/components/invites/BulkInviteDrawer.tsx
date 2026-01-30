"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, X, Loader2, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface BulkInviteDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  institutions: any[];
}

interface ParsedInvite {
  email: string;
  role: string;
  institution_id?: string;
  lineNumber: number;
  errors?: string[];
}

export function BulkInviteDrawer({
  open,
  onOpenChange,
  onSuccess,
  institutions,
}: BulkInviteDrawerProps) {
  const [mode, setMode] = useState<"manual" | "csv">("manual");
  const [manualEntries, setManualEntries] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedInvites, setParsedInvites] = useState<ParsedInvite[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const institutionMap = new Map(
    institutions.map((inst) => [
      inst.institution_id,
      inst.trading_name || inst.legal_name,
    ])
  );

  const parseCSV = (text: string): ParsedInvite[] => {
    const lines = text.split("\n").filter((line) => line.trim());
    const invites: ParsedInvite[] = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Skip header row if present
    const startIndex = lines[0]?.toLowerCase().includes("email") ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split(",").map((p) => p.trim().replace(/^"|"$/g, ""));
      const errors: string[] = [];

      if (parts.length < 2) {
        errors.push("Missing required fields (email, role)");
        invites.push({
          email: parts[0] || "",
          role: "",
          lineNumber: i + 1,
          errors,
        });
        continue;
      }

      const email = parts[0].toLowerCase();
      const role = parts[1].toUpperCase();
      const institutionName = parts[2]?.trim();

      if (!email || !emailRegex.test(email)) {
        errors.push("Invalid email format");
      }

      // Bulk invites are only for INSTITUTION_ADMIN
      if (role !== "INSTITUTION_ADMIN") {
        errors.push("Bulk invites are only available for INSTITUTION_ADMIN role");
      }

      let institution_id: string | undefined;
      if (institutionName) {
        const found = institutions.find(
          (inst) =>
            inst.trading_name?.toLowerCase() === institutionName.toLowerCase() ||
            inst.legal_name?.toLowerCase() === institutionName.toLowerCase()
        );
        if (found) {
          institution_id = found.institution_id;
        } else {
          errors.push(`Institution "${institutionName}" not found`);
        }
      } else if (role === "INSTITUTION_ADMIN") {
        errors.push("Institution required for INSTITUTION_ADMIN");
      }

      invites.push({
        email,
        role,
        institution_id,
        lineNumber: i + 1,
        errors: errors.length > 0 ? errors : undefined,
      });
    }

    return invites;
  };

  const parseManualEntries = (text: string): ParsedInvite[] => {
    const lines = text.split("\n").filter((line) => line.trim());
    const invites: ParsedInvite[] = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Format: email,role,institution (optional)
      const parts = line.split(",").map((p) => p.trim());
      const errors: string[] = [];

      if (parts.length < 2) {
        errors.push("Format: email,role,institution (optional)");
        invites.push({
          email: parts[0] || "",
          role: "",
          lineNumber: i + 1,
          errors,
        });
        continue;
      }

      const email = parts[0].toLowerCase();
      const role = parts[1].toUpperCase();
      const institutionName = parts[2]?.trim();

      if (!email || !emailRegex.test(email)) {
        errors.push("Invalid email format");
      }

      const validRoles = [
        "PLATFORM_ADMIN",
        "QCTO_USER",
        "INSTITUTION_ADMIN",
        "INSTITUTION_STAFF",
        "STUDENT",
      ];
      if (!validRoles.includes(role)) {
        errors.push(`Invalid role`);
      }

      let institution_id: string | undefined;
      if (institutionName) {
        const found = institutions.find(
          (inst) =>
            inst.trading_name?.toLowerCase() === institutionName.toLowerCase() ||
            inst.legal_name?.toLowerCase() === institutionName.toLowerCase()
        );
        if (found) {
          institution_id = found.institution_id;
        } else {
          errors.push(`Institution not found`);
        }
      }

      invites.push({
        email,
        role,
        institution_id,
        lineNumber: i + 1,
        errors: errors.length > 0 ? errors : undefined,
      });
    }

    return invites;
  };

  const handleFileUpload = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = parseCSV(text);
      setParsedInvites(parsed);
      setCsvFile(file);
    } catch (error) {
      toast.error("Failed to parse CSV file");
      console.error(error);
    }
  };

  const handleManualParse = () => {
    const parsed = parseManualEntries(manualEntries);
    setParsedInvites(parsed);
  };

  const handleSubmit = async () => {
    const validInvites = parsedInvites.filter((inv) => !inv.errors);
    if (validInvites.length === 0) {
      toast.error("No valid invites to submit");
      return;
    }

    setSubmitting(true);
    setProgress(0);

    try {
      const response = await fetch("/api/invites/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invites: validInvites.map((inv) => ({
            email: inv.email,
            role: inv.role,
            institution_id: inv.institution_id,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create bulk invites");
      }

      const data = await response.json();
      setProgress(100);

      toast.success(
        `Created ${data.created} invite${data.created !== 1 ? "s" : ""}${
          data.errors > 0 ? ` (${data.errors} errors)` : ""
        }`
      );

      if (data.error_details && data.error_details.length > 0) {
        console.warn("Bulk invite errors:", data.error_details);
      }

      // Reset form
      setManualEntries("");
      setCsvFile(null);
      setParsedInvites([]);
      setProgress(0);
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create bulk invites");
    } finally {
      setSubmitting(false);
    }
  };

  const validCount = parsedInvites.filter((inv) => !inv.errors).length;
  const errorCount = parsedInvites.filter((inv) => inv.errors).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">Bulk Invite Institution Admins</DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Create multiple institution admin invites at once. Invites will be queued and sent gradually. Only INSTITUTION_ADMIN role is supported for bulk invites.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Mode Selection */}
          <div className="flex gap-3 p-1 bg-gray-100 rounded-lg">
            <Button
              variant={mode === "manual" ? "default" : "outline"}
              onClick={() => setMode("manual")}
              className={`flex-1 transition-all duration-200 ${
                mode === "manual"
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                  : "text-gray-700 hover:text-gray-900 hover:bg-white"
              }`}
            >
              Manual Entry
            </Button>
            <Button
              variant={mode === "csv" ? "default" : "outline"}
              onClick={() => setMode("csv")}
              className={`flex-1 transition-all duration-200 ${
                mode === "csv"
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                  : "text-gray-700 hover:text-gray-900 hover:bg-white"
              }`}
            >
              CSV Upload
            </Button>
          </div>

          {/* Manual Entry Mode */}
          {mode === "manual" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-900">
                  Enter invites (one per line)
                </Label>
                <Textarea
                  value={manualEntries}
                  onChange={(e) => setManualEntries(e.target.value)}
                  placeholder="email@example.com,INSTITUTION_ADMIN,Institution Name&#10;user2@example.com,INSTITUTION_ADMIN,My Institution"
                  rows={10}
                  className="font-mono text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg resize-none"
                />
                <p className="text-xs text-gray-500">
                  Format: email,INSTITUTION_ADMIN,institution. One invite per line. Only INSTITUTION_ADMIN role is supported for bulk invites.
                </p>
              </div>
              <Button 
                onClick={handleManualParse} 
                variant="outline" 
                className="w-full border-gray-300 hover:bg-gray-50 hover:border-gray-400 text-gray-700"
              >
                Parse Entries
              </Button>
            </div>
          )}

          {/* CSV Upload Mode */}
          {mode === "csv" && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50/50 hover:border-blue-400 hover:bg-blue-50/30 transition-all duration-200 cursor-pointer"
                onClick={() => !csvFile && fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                  className="hidden"
                />
                {csvFile ? (
                  <div className="space-y-3">
                    <FileText className="h-10 w-10 mx-auto text-blue-600" />
                    <p className="text-sm font-semibold text-gray-900">{csvFile.name}</p>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCsvFile(null);
                        setParsedInvites([]);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="h-10 w-10 mx-auto text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Click to upload CSV file
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Format: email,INSTITUTION_ADMIN,institution. Only INSTITUTION_ADMIN role is supported.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="border-gray-300 hover:bg-white hover:border-blue-400 hover:text-blue-600"
                    >
                      Choose File
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Parsed Results */}
          {parsedInvites.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-gray-900">
                    {validCount} valid invite{validCount !== 1 ? "s" : ""}
                  </p>
                  {errorCount > 0 && (
                    <p className="text-sm text-red-600 font-medium">
                      {errorCount} error{errorCount !== 1 ? "s" : ""} need attention
                    </p>
                  )}
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || validCount === 0}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Create {validCount} Invite{validCount !== 1 ? "s" : ""}
                    </>
                  )}
                </Button>
              </div>

              {submitting && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>Processing invites...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              <div className="max-h-96 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-4 bg-gray-50/30">
                {parsedInvites.map((invite, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border transition-all duration-200 ${
                      invite.errors
                        ? "bg-red-50/80 border-red-200/80 shadow-sm"
                        : "bg-green-50/80 border-green-200/80 shadow-sm"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{invite.email}</p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {invite.role.replace(/_/g, " ")}
                          {invite.institution_id &&
                            ` • ${institutionMap.get(invite.institution_id)}`}
                        </p>
                      </div>
                      {invite.errors ? (
                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                      ) : (
                        <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                      )}
                    </div>
                    {invite.errors && (
                      <ul className="mt-2 text-xs text-red-700 list-disc list-inside space-y-0.5">
                        {invite.errors.map((error, i) => (
                          <li key={i}>{error}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
