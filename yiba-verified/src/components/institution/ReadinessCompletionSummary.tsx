"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Readiness } from "@prisma/client";

interface ReadinessCompletionSummaryProps {
  readiness: Readiness;
}

/**
 * ReadinessCompletionSummary Component
 * 
 * Displays a summary of section completion status for the readiness record.
 * Helps users see which sections are complete and what needs attention.
 */
export function ReadinessCompletionSummary({ readiness }: ReadinessCompletionSummaryProps) {
  const readinessData = readiness as any;

  // Define sections with their completion checks
  const sections = [
    {
      id: "qualification",
      name: "Qualification Information",
      completed: !!(readiness.qualification_title && readiness.saqa_id && readiness.curriculum_code && readiness.delivery_mode),
      required: true,
    },
    {
      id: "self_assessment",
      name: "Self-Assessment",
      completed: readinessData.self_assessment_completed !== null,
      required: false,
    },
    {
      id: "registration",
      name: "Registration & Legal Compliance",
      completed: !!(readinessData.registration_type || readinessData.professional_body_registration !== null),
      required: false,
    },
    {
      id: "infrastructure",
      name: "Infrastructure & Resources",
      completed: !!readinessData.training_site_address,
      required: false,
    },
    {
      id: "learning_materials",
      name: "Learning Material Alignment",
      completed: readinessData.learning_material_exists !== null,
      required: false,
    },
    {
      id: "ohs",
      name: "Occupational Health & Safety",
      completed: readinessData.fire_extinguisher_available !== null || readinessData.emergency_exits_marked !== null,
      required: false,
    },
    {
      id: "lms",
      name: "LMS & Online Delivery",
      completed: readinessData.lms_name && (readiness.delivery_mode === "BLENDED" || readiness.delivery_mode === "MOBILE")
        ? !!readinessData.lms_name
        : true, // Not required for FACE_TO_FACE
      required: readiness.delivery_mode === "BLENDED" || readiness.delivery_mode === "MOBILE",
    },
    {
      id: "wbl",
      name: "Workplace-Based Learning",
      completed: !!readinessData.wbl_workplace_partner_name,
      required: false,
    },
    {
      id: "policies",
      name: "Policies & Procedures",
      completed: !!readinessData.policies_procedures_notes,
      required: false,
    },
    {
      id: "facilitators",
      name: "Human Resources (Facilitators)",
      completed: !!readinessData.facilitators_notes,
      required: false,
    },
  ];

  const completedCount = sections.filter((s) => s.completed).length;
  const requiredSections = sections.filter((s) => s.required);
  const requiredCompleted = requiredSections.filter((s) => s.completed).length;
  const allRequiredComplete = requiredSections.length === requiredCompleted;

  const completionPercentage = Math.round((completedCount / sections.length) * 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Readiness Completion Summary</CardTitle>
        <CardDescription>
          Progress overview and section completion status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Completion</span>
              <span className="text-sm text-muted-foreground">{completionPercentage}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5">
              <div
                className="bg-primary h-2.5 rounded-full transition-all"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {completedCount} of {sections.length} sections completed
            </p>
          </div>

          {/* Section Checklist */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Section Status</h4>
            <div className="grid gap-2 md:grid-cols-2">
              {sections.map((section) => (
                <div
                  key={section.id}
                  className="flex items-center justify-between p-2 border rounded-md"
                >
                  <span className="text-sm">{section.name}</span>
                  <div className="flex items-center gap-2">
                    {section.required && (
                      <Badge variant="outline" className="text-xs">Required</Badge>
                    )}
                    <Badge variant={section.completed ? "default" : "outline"}>
                      {section.completed ? "Complete ✓" : "Incomplete"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submission Status */}
          <div className="pt-4 border-t">
            {allRequiredComplete ? (
              <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  ✓ All required sections are complete
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  You can submit this readiness record for QCTO review when ready.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  ⚠️ Some required sections are incomplete
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  Please complete all required sections before submitting for review.
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
