"use client";

import { Lightbulb, ThumbsUp, Shield } from "lucide-react";

const READINESS_SIDEBAR_CONTENT: Record<
  number,
  { tips?: string[]; suggestions?: string[]; bestPractices?: string[] }
> = {
  1: {
    tips: [
      "Use the exact qualification title as registered on SAQA.",
      "Curriculum code must match the official OQSF document.",
    ],
    suggestions: ["Confirm NQF level from the SAQA record before entering."],
    bestPractices: [
      "Double-check the SAQA ID; errors can delay QCTO approval.",
      "Delivery mode affects which sections are required (e.g. LMS for Blended or Mobile).",
    ],
  },
  2: {
    tips: [
      "Be honest in your self-assessment; it informs the QCTO review.",
      "Remarks can strengthen your application when they are specific.",
    ],
    suggestions: ["Attach supporting evidence via the Documents section above."],
    bestPractices: ["Keep remarks concise but evidence-based. Avoid vague statements."],
  },
  3: {
    tips: [
      "Registration proof must be current and legible.",
      "Tax Compliance and entity registration should be in the same legal name as the institution.",
    ],
    suggestions: [
      "If you have professional body registration, upload the certificate in Documents.",
    ],
    bestPractices: [
      "Ensure entity registration matches the training site and qualification scope.",
    ],
  },
  4: {
    tips: [
      "Use the full physical address; partial addresses can cause delays.",
      "Ownership or lease documents must match the training site address.",
    ],
    suggestions: [
      "Include room capacity and facilitator:learner ratio to demonstrate delivery capacity.",
    ],
    bestPractices: [
      "Proof of ownership or lease should clearly show the premises used for training.",
    ],
  },
  5: {
    tips: [
      "At least 50% curriculum coverage is required for sample learning materials.",
      "Mapping to knowledge and practical modules strengthens the application.",
    ],
    suggestions: ["Upload a sample that shows alignment to the OQSF structure."],
    bestPractices: [
      "Align materials to the OQSF curriculum; note any gaps and how they will be addressed.",
    ],
  },
  6: {
    tips: [
      "Evacuation plans must be visibly displayed on site.",
      "Fire extinguisher and first-aid records should be kept up to date.",
    ],
    suggestions: ["Include the OHS representative’s appointment letter in Documents."],
    bestPractices: [
      "OHS representative should be trained and appointed in writing.",
      "Accessibility for disabilities supports inclusive delivery.",
    ],
  },
  7: {
    tips: [
      "This section is required for Blended and Mobile delivery only; optional for Face to Face.",
      "Include LMS vendor, version, and licence documentation.",
    ],
    suggestions: ["Describe backup frequency and where data is stored."],
    bestPractices: [
      "Clearly describe backup and security measures; QCTO expects evidence of data protection.",
    ],
  },
  8: {
    tips: [
      "WBL agreements should clearly define roles, duration, and assessment responsibility.",
      "Workplace partner must be qualified to mentor and assess.",
    ],
    suggestions: [
      "Include logbook template and monitoring schedule with the WBL agreement in Documents.",
    ],
    bestPractices: [
      "Ensure the workplace partner can provide the practical component required by the curriculum.",
    ],
  },
  9: {
    tips: [
      "All seven policy types (Finance, HR, Teaching & Learning, Assessment, Appeals, OHS, Refunds) must be documented and uploaded.",
      "Note effective and review dates where available.",
    ],
    suggestions: ["Upload each policy via the Documents section; name files clearly."],
    bestPractices: [
      "Policies must be institution-wide and apply to all programmes, not just one qualification.",
    ],
  },
  10: {
    tips: [
      "At least one facilitator with CV and contract is required.",
      "List roles clearly: Facilitator, Assessor, Moderator as applicable.",
    ],
    suggestions: [
      "Include SAQA evaluation of qualifications where applicable.",
      "Work permits for foreign nationals must be uploaded if applicable.",
    ],
    bestPractices: [
      "Qualifications and industry experience must be clearly stated; SAQA evaluation helps speed up QCTO review.",
    ],
  },
};

interface ReadinessFormSidebarProps {
  step: number;
  className?: string;
}

export function ReadinessFormSidebar({ step, className = "" }: ReadinessFormSidebarProps) {
  const content = READINESS_SIDEBAR_CONTENT[step] ?? {};
  const { tips = [], suggestions = [], bestPractices = [] } = content;
  const hasAny = tips.length > 0 || suggestions.length > 0 || bestPractices.length > 0;

  if (!hasAny) {
    return (
      <aside
        className={`rounded-xl border border-blue-200/60 bg-blue-50/40 p-4 ${className}`}
        aria-label="Tips and best practices"
      >
        <p className="text-sm text-gray-500">No tips for this step.</p>
      </aside>
    );
  }

  return (
    <aside
      className={`rounded-xl border border-blue-200/60 bg-gradient-to-b from-blue-50/50 to-slate-50/60 p-5 space-y-5 ${className}`}
      aria-label="Tips, suggestions, and best practices"
    >
      {tips.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-2">
            <Lightbulb className="h-4 w-4 text-amber-500" aria-hidden />
            Tips
          </h3>
          <ul className="text-sm text-gray-600 space-y-1.5 list-disc list-inside">
            {tips.map((t, i) => (
              <li key={i} className="leading-relaxed">
                {t}
              </li>
            ))}
          </ul>
        </section>
      )}
      {suggestions.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-2">
            <ThumbsUp className="h-4 w-4 text-blue-500" aria-hidden />
            Suggestions
          </h3>
          <ul className="text-sm text-gray-600 space-y-1.5 list-disc list-inside">
            {suggestions.map((s, i) => (
              <li key={i} className="leading-relaxed">
                {s}
              </li>
            ))}
          </ul>
        </section>
      )}
      {bestPractices.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-emerald-500" aria-hidden />
            Best practices
          </h3>
          <ul className="text-sm text-gray-600 space-y-1.5 list-disc list-inside">
            {bestPractices.map((b, i) => (
              <li key={i} className="leading-relaxed">
                {b}
              </li>
            ))}
          </ul>
        </section>
      )}
    </aside>
  );
}
