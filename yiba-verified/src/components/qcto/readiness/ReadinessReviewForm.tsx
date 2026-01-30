"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Check,
  X,
  AlertTriangle,
  FileSignature,
  BookOpen,
  CheckCircle2,
  XCircle,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ReadinessReviewFormProps {
  readiness: {
    readiness_id: string;
    readiness_status: string;
    qualification_title: string | null;
    learning_material_coverage_percentage?: number | null;
    learning_material_nqf_aligned?: boolean | null;
    knowledge_components_complete?: boolean | null;
    practical_components_complete?: boolean | null;
    learning_material_quality_verified?: boolean | null;
  };
}

/**
 * Readiness Review Form Component (Form 5 Section 10)
 * 
 * Enhanced review form supporting:
 * - Per-criterion Yes/No reviews with mandatory remarks
 * - Learning material verification (≥50% coverage, NQF alignment)
 * - Final recommendation (Section 10) with verifier signature and SME name
 * - Return for correction with structured reasons
 */
export function ReadinessReviewForm({ readiness }: ReadinessReviewFormProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"review" | "recommendation">("review");

  // Review status
  const [status, setStatus] = useState<
    "UNDER_REVIEW" | "RETURNED_FOR_CORRECTION" | "RECOMMENDED" | "REJECTED" | null
  >(null);

  // Section 10: Final Recommendation
  const [recommendation, setRecommendation] = useState<"RECOMMENDED" | "NOT_RECOMMENDED" | null>(null);
  const [verifierRemarks, setVerifierRemarks] = useState("");
  const [smeName, setSmeName] = useState("");
  const [smeSignature, setSmeSignature] = useState<File | null>(null);
  const [reviewNotes, setReviewNotes] = useState(""); // Internal notes

  // Learning Material Verification
  const [learningMaterialVerified, setLearningMaterialVerified] = useState({
    coverage_verified: readiness.learning_material_coverage_percentage != null &&
                      (readiness.learning_material_coverage_percentage ?? 0) >= 50,
    nqf_aligned: readiness.learning_material_nqf_aligned || false,
    knowledge_complete: readiness.knowledge_components_complete || false,
    practical_complete: readiness.practical_components_complete || false,
    quality_verified: readiness.learning_material_quality_verified || false,
  });

  // Return for correction
  const [returnReasons, setReturnReasons] = useState<string[]>([]);
  const [returnRemarks, setReturnRemarks] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<typeof status>(null);

  const canReview =
    readiness.readiness_status === "SUBMITTED" ||
    readiness.readiness_status === "UNDER_REVIEW" ||
    readiness.readiness_status === "RETURNED_FOR_CORRECTION";

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Signature file must be less than 5MB");
        return;
      }
      setSmeSignature(file);
    }
  };

  const handleReturnReasonToggle = (reason: string) => {
    setReturnReasons((prev) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canReview) {
      setError("This readiness record cannot be reviewed");
      return;
    }

    // Validation based on action
    if (status === "RETURNED_FOR_CORRECTION") {
      if (returnReasons.length === 0 && !returnRemarks.trim()) {
        setError("Please provide at least one return reason or remarks");
        return;
      }
    } else if (status === "RECOMMENDED" || status === "REJECTED") {
      // Final recommendation requires Section 10 fields
      if (!recommendation) {
        setError("Please select a final recommendation (RECOMMENDED or NOT_RECOMMENDED)");
        return;
      }
      if (!verifierRemarks.trim()) {
        setError("Verifier remarks are mandatory for final recommendation");
        return;
      }
      if (!smeName.trim()) {
        setError("SME name is required for final recommendation");
        return;
      }
      if (!smeSignature) {
        setError("SME signature is required for final recommendation");
        return;
      }
    } else if (!status) {
      setError("Please select a review status");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Convert signature file to base64 if provided
      let signatureBase64: string | undefined;
      if (smeSignature) {
        signatureBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result);
          };
          reader.onerror = reject;
          reader.readAsDataURL(smeSignature);
        });
      }

      const response = await fetch(`/api/qcto/readiness/${readiness.readiness_id}/review`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          recommendation: recommendation || undefined,
          verifier_remarks: verifierRemarks.trim() || undefined,
          sme_name: smeName.trim() || undefined,
          sme_signature: signatureBase64,
          review_notes: reviewNotes.trim() || undefined,
          learning_material_verification: {
            coverage_percentage: readiness.learning_material_coverage_percentage,
            nqf_aligned: learningMaterialVerified.nqf_aligned,
            knowledge_components_complete: learningMaterialVerified.knowledge_complete,
            practical_components_complete: learningMaterialVerified.practical_complete,
            quality_verified: learningMaterialVerified.quality_verified,
          },
          return_reasons: returnReasons.length > 0 ? returnReasons : undefined,
          return_remarks: returnRemarks.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to review readiness record`);
      }

      // Show success toast
      const statusMessages = {
        UNDER_REVIEW: "Readiness record marked as under review.",
        RETURNED_FOR_CORRECTION: "Readiness record returned for correction.",
        RECOMMENDED: "Readiness record recommended successfully!",
        REJECTED: "Readiness record rejected.",
      };
      toast.success(statusMessages[status] || "Review submitted successfully!");

      // Refresh the page to show updated status
      router.refresh();
    } catch (err: any) {
      const errorMessage = err.message || "An error occurred";
      setError(errorMessage);
      toast.error(`Failed to submit review: ${errorMessage}`);
      setIsSubmitting(false);
    }
  };

  if (!canReview) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            This readiness record cannot be reviewed. Current status: {readiness.readiness_status}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive border border-destructive/20 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-medium">Error:</span>
            <span className="ml-2">{error}</span>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "review" | "recommendation")}>
        <TabsList className="grid w-full grid-cols-2 h-12 p-1 bg-muted/60">
          <TabsTrigger 
            value="review" 
            className="h-full text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            Review Actions
          </TabsTrigger>
          <TabsTrigger 
            value="recommendation"
            className="h-full text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            Final Recommendation (Section 10)
          </TabsTrigger>
        </TabsList>

        {/* Review Actions Tab */}
        <TabsContent value="review" className="space-y-6">
          {/* Review Status */}
          <div>
            <Label className="text-base font-semibold">Review Status</Label>
            <p className="text-sm text-muted-foreground mt-1 mb-3">Select an action to proceed with the review</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button
                type="button"
                variant={status === "UNDER_REVIEW" ? "default" : "outline"}
                onClick={() => setStatus("UNDER_REVIEW")}
                disabled={isSubmitting}
                className={`flex-1 gap-2 h-14 text-sm font-medium transition-all ${
                  status === "UNDER_REVIEW"
                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md ring-2 ring-blue-600 ring-offset-2 dark:ring-offset-background"
                    : "hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 dark:hover:bg-blue-950/50 dark:hover:border-blue-700 dark:hover:text-blue-400"
                }`}
              >
                <Loader2 className="h-5 w-5 shrink-0" />
                Under Review
              </Button>
              <Button
                type="button"
                variant={status === "RETURNED_FOR_CORRECTION" ? "default" : "outline"}
                onClick={() => {
                  setStatus("RETURNED_FOR_CORRECTION");
                  setActiveTab("recommendation");
                }}
                disabled={isSubmitting}
                className={`flex-1 gap-2 h-14 text-sm font-medium transition-all ${
                  status === "RETURNED_FOR_CORRECTION"
                    ? "bg-amber-600 hover:bg-amber-700 text-white shadow-md ring-2 ring-amber-600 ring-offset-2 dark:ring-offset-background"
                    : "hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700 dark:hover:bg-amber-950/50 dark:hover:border-amber-700 dark:hover:text-amber-400"
                }`}
              >
                <ArrowLeft className="h-5 w-5 shrink-0" />
                Return
              </Button>
              <Button
                type="button"
                variant={status === "RECOMMENDED" ? "default" : "outline"}
                onClick={() => {
                  setStatus("RECOMMENDED");
                  setActiveTab("recommendation");
                }}
                disabled={isSubmitting}
                className={`flex-1 gap-2 h-14 text-sm font-medium transition-all ${
                  status === "RECOMMENDED"
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md ring-2 ring-emerald-600 ring-offset-2 dark:ring-offset-background"
                    : "hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 dark:hover:bg-emerald-950/50 dark:hover:border-emerald-700 dark:hover:text-emerald-400"
                }`}
              >
                <Check className="h-5 w-5 shrink-0" />
                Recommend
              </Button>
              <Button
                type="button"
                variant={status === "REJECTED" ? "destructive" : "outline"}
                onClick={() => {
                  setPendingStatus("REJECTED");
                  setShowConfirmDialog(true);
                }}
                disabled={isSubmitting}
                className={`flex-1 gap-2 h-14 text-sm font-medium transition-all ${
                  status === "REJECTED"
                    ? "bg-red-600 hover:bg-red-700 text-white shadow-md ring-2 ring-red-600 ring-offset-2 dark:ring-offset-background"
                    : "hover:bg-red-50 hover:border-red-300 hover:text-red-700 dark:hover:bg-red-950/50 dark:hover:border-red-700 dark:hover:text-red-400"
                }`}
              >
                <X className="h-5 w-5 shrink-0" />
                Reject
              </Button>
            </div>
          </div>

          {/* Learning Material Verification */}
          <Card className="border-l-4 border-l-emerald-500">
            <CardHeader>
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-emerald-600" />
                <div>
                  <CardTitle className="text-lg">Learning Material Verification (Section 9)</CardTitle>
                  <CardDescription>Verify learning material meets Form 5 requirements</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className={`flex items-center justify-between p-4 rounded-lg border-2 transition-colors ${
                  learningMaterialVerified.coverage_verified 
                    ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/30" 
                    : "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/30"
                }`}>
                  <div>
                    <Label className="text-sm font-medium">Coverage ≥50%</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Current: {readiness.learning_material_coverage_percentage || 0}%
                    </p>
                  </div>
                  {learningMaterialVerified.coverage_verified ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Met</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-100 dark:bg-red-900/50">
                      <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      <span className="text-sm font-medium text-red-700 dark:text-red-300">Not Met</span>
                    </div>
                  )}
                </div>
                <div className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-sm ${
                  learningMaterialVerified.nqf_aligned 
                    ? "border-emerald-300 bg-emerald-50/50 dark:border-emerald-700 dark:bg-emerald-950/30" 
                    : "border-border hover:border-muted-foreground/30"
                }`}
                onClick={() => !isSubmitting && setLearningMaterialVerified((prev) => ({ ...prev, nqf_aligned: !prev.nqf_aligned }))}
                >
                  <Label className="text-sm font-medium cursor-pointer">NQF Level Aligned</Label>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setLearningMaterialVerified((prev) => ({ ...prev, nqf_aligned: true })); }}
                      disabled={isSubmitting}
                      className={`px-4 py-2 rounded-l-md text-sm font-medium transition-all ${
                        learningMaterialVerified.nqf_aligned
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-muted hover:bg-muted/80 text-muted-foreground"
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setLearningMaterialVerified((prev) => ({ ...prev, nqf_aligned: false })); }}
                      disabled={isSubmitting}
                      className={`px-4 py-2 rounded-r-md text-sm font-medium transition-all ${
                        !learningMaterialVerified.nqf_aligned
                          ? "bg-slate-600 text-white shadow-sm dark:bg-slate-500"
                          : "bg-muted hover:bg-muted/80 text-muted-foreground"
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>
                <div className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-sm ${
                  learningMaterialVerified.knowledge_complete 
                    ? "border-emerald-300 bg-emerald-50/50 dark:border-emerald-700 dark:bg-emerald-950/30" 
                    : "border-border hover:border-muted-foreground/30"
                }`}
                onClick={() => !isSubmitting && setLearningMaterialVerified((prev) => ({ ...prev, knowledge_complete: !prev.knowledge_complete }))}
                >
                  <Label className="text-sm font-medium cursor-pointer">Knowledge Components Complete</Label>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setLearningMaterialVerified((prev) => ({ ...prev, knowledge_complete: true })); }}
                      disabled={isSubmitting}
                      className={`px-4 py-2 rounded-l-md text-sm font-medium transition-all ${
                        learningMaterialVerified.knowledge_complete
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-muted hover:bg-muted/80 text-muted-foreground"
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setLearningMaterialVerified((prev) => ({ ...prev, knowledge_complete: false })); }}
                      disabled={isSubmitting}
                      className={`px-4 py-2 rounded-r-md text-sm font-medium transition-all ${
                        !learningMaterialVerified.knowledge_complete
                          ? "bg-slate-600 text-white shadow-sm dark:bg-slate-500"
                          : "bg-muted hover:bg-muted/80 text-muted-foreground"
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>
                <div className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-sm ${
                  learningMaterialVerified.practical_complete 
                    ? "border-emerald-300 bg-emerald-50/50 dark:border-emerald-700 dark:bg-emerald-950/30" 
                    : "border-border hover:border-muted-foreground/30"
                }`}
                onClick={() => !isSubmitting && setLearningMaterialVerified((prev) => ({ ...prev, practical_complete: !prev.practical_complete }))}
                >
                  <Label className="text-sm font-medium cursor-pointer">Practical Components Complete</Label>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setLearningMaterialVerified((prev) => ({ ...prev, practical_complete: true })); }}
                      disabled={isSubmitting}
                      className={`px-4 py-2 rounded-l-md text-sm font-medium transition-all ${
                        learningMaterialVerified.practical_complete
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-muted hover:bg-muted/80 text-muted-foreground"
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setLearningMaterialVerified((prev) => ({ ...prev, practical_complete: false })); }}
                      disabled={isSubmitting}
                      className={`px-4 py-2 rounded-r-md text-sm font-medium transition-all ${
                        !learningMaterialVerified.practical_complete
                          ? "bg-slate-600 text-white shadow-sm dark:bg-slate-500"
                          : "bg-muted hover:bg-muted/80 text-muted-foreground"
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>
                <div className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-sm md:col-span-2 ${
                  learningMaterialVerified.quality_verified 
                    ? "border-emerald-300 bg-emerald-50/50 dark:border-emerald-700 dark:bg-emerald-950/30" 
                    : "border-border hover:border-muted-foreground/30"
                }`}
                onClick={() => !isSubmitting && setLearningMaterialVerified((prev) => ({ ...prev, quality_verified: !prev.quality_verified }))}
                >
                  <Label className="text-sm font-medium cursor-pointer">Quality & Understandability Verified</Label>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setLearningMaterialVerified((prev) => ({ ...prev, quality_verified: true })); }}
                      disabled={isSubmitting}
                      className={`px-4 py-2 rounded-l-md text-sm font-medium transition-all ${
                        learningMaterialVerified.quality_verified
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-muted hover:bg-muted/80 text-muted-foreground"
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setLearningMaterialVerified((prev) => ({ ...prev, quality_verified: false })); }}
                      disabled={isSubmitting}
                      className={`px-4 py-2 rounded-r-md text-sm font-medium transition-all ${
                        !learningMaterialVerified.quality_verified
                          ? "bg-slate-600 text-white shadow-sm dark:bg-slate-500"
                          : "bg-muted hover:bg-muted/80 text-muted-foreground"
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>
              </div>
              {readiness.learning_material_coverage_percentage != null &&
                (readiness.learning_material_coverage_percentage ?? 0) < 50 && (
                  <div className="rounded-lg bg-red-50 border-2 border-red-300 p-4 dark:bg-red-950/50 dark:border-red-800">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                      <p className="text-sm text-red-800 dark:text-red-200">
                        <strong>Warning:</strong> Learning material coverage is below 50% requirement (
                        {readiness.learning_material_coverage_percentage}%). This must be addressed before approval.
                      </p>
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>

          {/* Return for Correction */}
          {status === "RETURNED_FOR_CORRECTION" && (
            <Card className="border-l-4 border-l-orange-500">
              <CardHeader>
                <CardTitle className="text-lg">Return for Correction</CardTitle>
                <CardDescription>Specify reasons for returning this readiness record</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold">Return Reasons (Select all that apply)</Label>
                  <div className="grid gap-2 mt-3">
                    {[
                      "Missing required documents",
                      "Incomplete sections",
                      "Learning material coverage below 50%",
                      "Invalid or expired documents",
                      "Incorrect information",
                      "Non-compliance with Form 5 requirements",
                      "Other (specify in remarks)",
                    ].map((reason) => (
                      <label 
                        key={reason} 
                        className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-sm ${
                          returnReasons.includes(reason)
                            ? "border-amber-400 bg-amber-50 dark:border-amber-600 dark:bg-amber-950/40"
                            : "border-border hover:border-amber-200 dark:hover:border-amber-800"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={returnReasons.includes(reason)}
                          onChange={() => handleReturnReasonToggle(reason)}
                          disabled={isSubmitting}
                          className="h-5 w-5 rounded border-2 border-amber-400 text-amber-600 focus:ring-amber-500 dark:border-amber-600"
                        />
                        <span className={`text-sm font-medium ${
                          returnReasons.includes(reason) 
                            ? "text-amber-800 dark:text-amber-200" 
                            : "text-foreground"
                        }`}>{reason}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="returnRemarks">Return Remarks *</Label>
                  <Textarea
                    id="returnRemarks"
                    placeholder="Provide detailed explanation of what needs to be corrected..."
                    value={returnRemarks}
                    onChange={(e) => setReturnRemarks(e.target.value)}
                    disabled={isSubmitting}
                    rows={4}
                    className="mt-2"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    This will be visible to the institution. Be specific about what needs to be corrected.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Internal Review Notes */}
          <div>
            <Label htmlFor="reviewNotes">Internal Review Notes (Optional)</Label>
            <Textarea
              id="reviewNotes"
              placeholder="Internal notes for QCTO use only (not visible to institution)..."
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              disabled={isSubmitting}
              rows={3}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Internal notes for QCTO reviewers. Not visible to the institution.
            </p>
          </div>
        </TabsContent>

        {/* Final Recommendation Tab (Section 10) */}
        <TabsContent value="recommendation" className="space-y-6">
          {(status === "RECOMMENDED" || status === "REJECTED") && (
            <>
              <Card className="border-l-4 border-l-indigo-500">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <FileSignature className="h-5 w-5 text-indigo-600" />
                    <div>
                      <CardTitle className="text-lg">Form 5 Section 10: Final Recommendation</CardTitle>
                      <CardDescription>Verifier recommendation with signature (required)</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="recommendation" className="text-sm font-semibold">Final Recommendation *</Label>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <button
                        type="button"
                        onClick={() => setRecommendation("RECOMMENDED")}
                        disabled={isSubmitting}
                        className={`flex items-center justify-center gap-3 p-5 rounded-xl border-2 font-semibold text-base transition-all ${
                          recommendation === "RECOMMENDED"
                            ? "border-emerald-500 bg-emerald-600 text-white shadow-lg ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-background"
                            : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-400 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:border-emerald-600"
                        }`}
                      >
                        <CheckCircle2 className="h-6 w-6 shrink-0" />
                        RECOMMENDED
                      </button>
                      <button
                        type="button"
                        onClick={() => setRecommendation("NOT_RECOMMENDED")}
                        disabled={isSubmitting}
                        className={`flex items-center justify-center gap-3 p-5 rounded-xl border-2 font-semibold text-base transition-all ${
                          recommendation === "NOT_RECOMMENDED"
                            ? "border-red-500 bg-red-600 text-white shadow-lg ring-2 ring-red-500 ring-offset-2 dark:ring-offset-background"
                            : "border-red-200 bg-red-50 text-red-700 hover:border-red-400 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300 dark:hover:border-red-600"
                        }`}
                      >
                        <XCircle className="h-6 w-6 shrink-0" />
                        NOT RECOMMENDED
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      Per Form 5 Section 10, select RECOMMENDED or NOT_RECOMMENDED
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="verifierRemarks">Verifier Remarks *</Label>
                    <Textarea
                      id="verifierRemarks"
                      placeholder="Mandatory remarks explaining your recommendation decision..."
                      value={verifierRemarks}
                      onChange={(e) => setVerifierRemarks(e.target.value)}
                      disabled={isSubmitting}
                      rows={4}
                      className="mt-2"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Mandatory per Form 5 Section 10. This will be visible to the institution.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="smeName">Subject Matter Expert (SME) Name *</Label>
                    <Input
                      id="smeName"
                      placeholder="Enter SME name"
                      value={smeName}
                      onChange={(e) => setSmeName(e.target.value)}
                      disabled={isSubmitting}
                      className="mt-2"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Required per Form 5 Section 10
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="smeSignature">SME Signature *</Label>
                    <div className="mt-2">
                      <Input
                        id="smeSignature"
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleSignatureUpload}
                        disabled={isSubmitting}
                        required
                      />
                      {smeSignature && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Selected: {smeSignature.name}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Required per Form 5 Section 10. Upload signature image or PDF (max 5MB)
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {status !== "RECOMMENDED" && status !== "REJECTED" && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground text-center py-4">
                  Select "Recommend" or "Reject" in the Review Actions tab to access Final Recommendation (Section
                  10)
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Submit Button */}
      <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t-2">
        <Button 
          type="submit" 
          disabled={isSubmitting || !status} 
          size="lg"
          className={`h-14 px-8 text-base font-semibold shadow-lg transition-all ${
            status 
              ? "bg-primary hover:bg-primary/90" 
              : "bg-muted text-muted-foreground"
          }`}
        >
          {isSubmitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
          {isSubmitting ? "Submitting Review..." : "Submit Review"}
        </Button>
        {status && (
          <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-muted/50">
            <span className="text-sm text-muted-foreground">Selected:</span>
            <Badge 
              variant="outline" 
              className={`font-medium ${
                status === "RECOMMENDED" ? "border-emerald-500 text-emerald-700 dark:text-emerald-400" :
                status === "REJECTED" ? "border-red-500 text-red-700 dark:text-red-400" :
                status === "RETURNED_FOR_CORRECTION" ? "border-amber-500 text-amber-700 dark:text-amber-400" :
                "border-blue-500 text-blue-700 dark:text-blue-400"
              }`}
            >
              {status.replace(/_/g, " ")}
            </Badge>
            {recommendation && (
              <Badge 
                variant="outline"
                className={`font-medium ${
                  recommendation === "RECOMMENDED" 
                    ? "border-emerald-500 text-emerald-700 dark:text-emerald-400" 
                    : "border-red-500 text-red-700 dark:text-red-400"
                }`}
              >
                {recommendation.replace(/_/g, " ")}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Dialog for Destructive Actions */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Rejection</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this readiness record? This action will mark the record as REJECTED
              and require a final recommendation with verifier remarks and SME signature. This action cannot be easily undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowConfirmDialog(false);
              setPendingStatus(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingStatus) {
                  setStatus(pendingStatus);
                  setActiveTab("recommendation");
                }
                setShowConfirmDialog(false);
                setPendingStatus(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirm Rejection
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}
