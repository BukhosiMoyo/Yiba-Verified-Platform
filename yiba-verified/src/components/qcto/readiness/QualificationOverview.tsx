import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Hash, Layers, BookOpen, Users, Target } from "lucide-react";

interface QualificationOverviewProps {
  readiness: {
    qualification_registry_id?: string | null;
    qualification_title: string;
    saqa_id: string;
    nqf_level: number | null;
    credits: number | null;
    curriculum_code: string;
    delivery_mode: string;
    occupational_category: string | null;
    intended_learner_intake: number | null;
  };
}

/**
 * Qualification Overview Component
 * 
 * Displays Form 5 Section 2: Qualification Information
 * Shows qualification context that is immutable after submission
 */
export function QualificationOverview({ readiness }: QualificationOverviewProps) {
  const formatDeliveryMode = (mode: string) => {
    return mode.replace(/_/g, " ");
  };

  const getDeliveryModeBadge = (mode: string) => {
    const modeMap: Record<string, { label: string; className: string }> = {
      FACE_TO_FACE: { label: "Face-to-Face", className: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300" },
      BLENDED: { label: "Blended", className: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300" },
      MOBILE: { label: "Mobile Unit", className: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300" },
    };
    return modeMap[mode] || { label: formatDeliveryMode(mode), className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" };
  };

  return (
    <Card className="border-l-4 border-l-indigo-500">
      <CardHeader className="bg-gradient-to-r from-indigo-50/60 to-white dark:from-indigo-950/30 dark:to-transparent border-b">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20">
            <GraduationCap className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl">Qualification Information</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Form 5 Section 2 - Qualification context (immutable after submission)
            </p>
          </div>
          {readiness.qualification_registry_id ? (
            <Badge className="shrink-0 bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">Verified qualification</Badge>
          ) : (
            <Badge className="shrink-0 bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">Unregistered / Manual</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="flex gap-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 p-4">
            <GraduationCap className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Qualification Title</span>
              <p className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{readiness.qualification_title}</p>
            </div>
          </div>

          <div className="flex gap-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 p-4">
            <Hash className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">SAQA ID</span>
              <p className="text-base font-mono font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{readiness.saqa_id}</p>
            </div>
          </div>

          <div className="flex gap-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 p-4">
            <Layers className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">NQF Level</span>
              <p className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                {readiness.nqf_level ? `NQF ${readiness.nqf_level}` : "—"}
              </p>
            </div>
          </div>

          {readiness.credits && (
            <div className="flex gap-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 p-4">
              <BookOpen className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Credits</span>
                <p className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{readiness.credits} credits</p>
              </div>
            </div>
          )}

          <div className="flex gap-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 p-4">
            <BookOpen className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Curriculum Code</span>
              <p className="text-base font-mono font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{readiness.curriculum_code}</p>
            </div>
          </div>

          <div className="flex gap-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 p-4">
            <Target className="h-5 w-5 text-teal-500 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Delivery Mode</span>
              <div className="mt-0.5">
                <Badge className={getDeliveryModeBadge(readiness.delivery_mode).className}>
                  {getDeliveryModeBadge(readiness.delivery_mode).label}
                </Badge>
              </div>
            </div>
          </div>

          {readiness.occupational_category && (
            <div className="flex gap-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 p-4">
              <Users className="h-5 w-5 text-violet-500 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Occupational Category</span>
                <p className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{readiness.occupational_category}</p>
              </div>
            </div>
          )}

          {readiness.intended_learner_intake && (
            <div className="flex gap-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 p-4">
              <Users className="h-5 w-5 text-violet-500 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Intended Learner Intake</span>
                <p className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{readiness.intended_learner_intake} learners</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
