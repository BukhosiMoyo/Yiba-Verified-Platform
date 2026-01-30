"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ClipboardCheck,
  FileText,
  Info,
} from "lucide-react";

interface ReviewHelperPanelProps {
  readiness: {
    readiness_id: string;
    delivery_mode: string;
    section_completion_data?: any;
    documents?: Array<{ document_id: string }>;
    learning_material_coverage_percentage?: number | null;
    readiness_status: string;
  };
  documentFlags?: Array<{
    document_id: string;
    reason: string;
    status: string;
  }>;
}

/**
 * Review Helper Panel Component
 * 
 * Sidebar panel showing:
 * - Overall submission completeness %
 * - Missing mandatory sections
 * - Missing documents
 * - High-risk indicators
 * - Auto-generated checklist
 */
export function ReviewHelperPanel({ readiness, documentFlags = [] }: ReviewHelperPanelProps) {
  // Calculate overall completion
  const calculateOverallCompletion = (): number => {
    if (!readiness.section_completion_data || typeof readiness.section_completion_data !== "object") {
      return 0;
    }
    const completionData = readiness.section_completion_data as Record<string, { completed?: number }>;
    const sections = Object.values(completionData);
    if (sections.length === 0) return 0;
    const total = sections.reduce((sum, s) => sum + (s.completed || 0), 0);
    return Math.round(total / sections.length);
  };

  const overallCompletion = calculateOverallCompletion();

  // Determine required sections based on delivery mode
  const getRequiredSections = () => {
    const baseSections = [
      "section_2_qualification",
      "section_3_1_self_assessment",
      "section_3_2_registration",
      "section_3_4_knowledge_resources",
      "section_3_5_practical_resources",
      "section_3_6_wbl",
      "section_6_lmis",
      "section_7_policies",
      "section_8_ohs",
      "section_9_learning_material",
    ];

    if (readiness.delivery_mode === "FACE_TO_FACE") {
      return [...baseSections, "section_3_3_physical_delivery"];
    } else if (readiness.delivery_mode === "BLENDED") {
      return [...baseSections, "section_3_3_physical_delivery", "section_4_hybrid_blended"];
    } else if (readiness.delivery_mode === "MOBILE") {
      return [...baseSections, "section_5_mobile_unit"];
    }

    return baseSections;
  };

  // Check missing mandatory sections
  const getMissingSections = (): string[] => {
    const requiredSections = getRequiredSections();
    if (!readiness.section_completion_data || typeof readiness.section_completion_data !== "object") {
      return requiredSections;
    }
    const completionData = readiness.section_completion_data as Record<string, { completed?: number; required?: boolean }>;
    return requiredSections.filter((section) => {
      const sectionData = completionData[section];
      return !sectionData || sectionData.completed === undefined || sectionData.completed < 100;
    });
  };

  const missingSections = getMissingSections();

  // Get high-risk indicators
  const getHighRiskIndicators = (): Array<{ type: string; message: string; severity: "high" | "medium" | "low" }> => {
    const risks: Array<{ type: string; message: string; severity: "high" | "medium" | "low" }> = [];

    // Low completion
    if (overallCompletion < 70) {
      risks.push({
        type: "completion",
        message: `Low overall completion (${overallCompletion}%)`,
        severity: "high",
      });
    } else if (overallCompletion < 85) {
      risks.push({
        type: "completion",
        message: `Moderate completion (${overallCompletion}%)`,
        severity: "medium",
      });
    }

    // Learning material coverage
    if (
      readiness.learning_material_coverage_percentage != null &&
      (readiness.learning_material_coverage_percentage ?? 0) < 50
    ) {
      risks.push({
        type: "learning_material",
        message: `Learning material coverage below 50% requirement (${readiness.learning_material_coverage_percentage}%)`,
        severity: "high",
      });
    }

    // Flagged documents
    const activeFlags = documentFlags.filter((f) => f.status === "FLAGGED");
    if (activeFlags.length > 0) {
      risks.push({
        type: "documents",
        message: `${activeFlags.length} document${activeFlags.length !== 1 ? "s" : ""} flagged`,
        severity: activeFlags.length > 3 ? "high" : "medium",
      });
    }

    // Missing sections
    if (missingSections.length > 0) {
      risks.push({
        type: "sections",
        message: `${missingSections.length} mandatory section${missingSections.length !== 1 ? "s" : ""} incomplete`,
        severity: missingSections.length > 3 ? "high" : "medium",
      });
    }

    return risks;
  };

  const highRiskIndicators = getHighRiskIndicators();

  // Generate checklist
  const getChecklist = () => {
    const checklist: Array<{ item: string; completed: boolean; critical: boolean }> = [];

    // Qualification information
    checklist.push({
      item: "Qualification information complete (Section 2)",
      completed: !missingSections.includes("section_2_qualification"),
      critical: true,
    });

    // Self-assessment
    checklist.push({
      item: "Self-assessment completed (Section 3.1)",
      completed: !missingSections.includes("section_3_1_self_assessment"),
      critical: true,
    });

    // Registration
    checklist.push({
      item: "Registration & Legal Compliance (Section 3.2)",
      completed: !missingSections.includes("section_3_2_registration"),
      critical: true,
    });

    // Physical delivery (if applicable)
    if (readiness.delivery_mode === "FACE_TO_FACE" || readiness.delivery_mode === "BLENDED") {
      checklist.push({
        item: "Physical Delivery Readiness (Section 3.3)",
        completed: !missingSections.includes("section_3_3_physical_delivery"),
        critical: true,
      });
    }

    // Learning material
    checklist.push({
      item: "Learning Material ≥50% coverage (Section 9)",
      completed:
        readiness.learning_material_coverage_percentage != null &&
        (readiness.learning_material_coverage_percentage ?? 0) >= 50,
      critical: true,
    });

    // Documents
    checklist.push({
      item: "Required documents uploaded",
      completed: (readiness.documents?.length || 0) > 0,
      critical: true,
    });

    // No flagged documents
    checklist.push({
      item: "No flagged documents",
      completed: documentFlags.filter((f) => f.status === "FLAGGED").length === 0,
      critical: false,
    });

    return checklist;
  };

  const checklist = getChecklist();
  const completedItems = checklist.filter((item) => item.completed).length;
  const criticalItems = checklist.filter((item) => item.critical).length;
  const completedCriticalItems = checklist.filter((item) => item.critical && item.completed).length;

  return (
    <Card className="sticky top-4 border-l-4 border-l-blue-500 max-h-[calc(100vh-2rem)] flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 dark:bg-blue-500/20">
            <ClipboardCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <CardTitle className="text-lg">Review Helper</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">Submission checklist and indicators</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 overflow-y-auto flex-1">
        {/* Overall Completeness */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">Overall Completeness</span>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{overallCompletion}%</span>
          </div>
          <Progress value={overallCompletion} className="h-2" />
        </div>

        {/* Checklist Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">Checklist</span>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {completedItems}/{checklist.length}
            </span>
          </div>
          <div className="space-y-2">
            {checklist.map((item, index) => (
              <div key={index} className="flex items-start gap-2">
                {item.completed ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-xs ${
                      item.completed ? "text-slate-600 dark:text-slate-400" : item.critical ? "text-red-700 dark:text-red-400 font-medium" : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {item.item}
                    {item.critical && (
                      <Badge variant="outline" className="ml-2 text-[10px]">
                        Critical
                      </Badge>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {criticalItems > 0 && (
            <div className="mt-3 rounded-lg bg-amber-50/50 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-700/50 p-2">
              <p className="text-xs text-amber-900 dark:text-amber-300">
                <strong>Critical Items:</strong> {completedCriticalItems}/{criticalItems} completed
              </p>
            </div>
          )}
        </div>

        {/* High-Risk Indicators */}
        {highRiskIndicators.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">High-Risk Indicators</span>
            </div>
            <div className="space-y-2">
              {highRiskIndicators.map((risk, index) => (
                <div
                  key={index}
                  className={`rounded-lg p-2 border ${
                    risk.severity === "high"
                      ? "bg-red-50/50 dark:bg-red-900/20 border-red-200/60 dark:border-red-700/50"
                      : risk.severity === "medium"
                        ? "bg-amber-50/50 dark:bg-amber-900/20 border-amber-200/60 dark:border-amber-700/50"
                        : "bg-blue-50/50 dark:bg-blue-900/20 border-blue-200/60 dark:border-blue-700/50"
                  }`}
                >
                  <p className="text-xs text-slate-900 dark:text-slate-100">{risk.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Missing Sections */}
        {missingSections.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">Missing Sections</span>
            </div>
            <div className="space-y-1">
              {missingSections.slice(0, 5).map((section, index) => (
                <div key={index} className="flex items-center gap-2">
                  <XCircle className="h-3 w-3 text-red-600 dark:text-red-400 shrink-0" />
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {section.replace(/section_\d+_/g, "").replace(/_/g, " ")}
                  </p>
                </div>
              ))}
              {missingSections.length > 5 && (
                <p className="text-xs text-slate-500 dark:text-slate-400">+{missingSections.length - 5} more</p>
              )}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="rounded-lg bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200/60 dark:border-blue-700/50 p-3">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-900 dark:text-blue-300">
              Review all sections and documents before making a final recommendation. Check for missing evidence and
              flagged issues.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
