/**
 * Document type requirements for each readiness form section
 * Maps section numbers to required document types
 */

export const READINESS_SECTION_DOCUMENTS: Record<
  number,
  {
    required: string[];
    optional: string[];
    description: string;
  }
> = {
  1: {
    required: [],
    optional: [],
    description: "Qualification information (no documents required)",
  },
  2: {
    required: [],
    optional: ["Self-Assessment Evidence"],
    description: "Supporting evidence for self-assessment (optional)",
  },
  3: {
    required: ["Registration Proof", "Tax Compliance PIN"],
    optional: ["Professional Body Registration"],
    description: "Registration and legal compliance documents",
  },
  4: {
    required: ["Proof of Ownership/Lease"],
    optional: ["Furniture & Equipment Checklist", "Inventory Upload"],
    description: "Infrastructure and physical resources documentation",
  },
  5: {
    required: ["Sample Learning Material (≥50% coverage)"],
    optional: ["Curriculum Alignment Evidence"],
    description: "Learning material alignment documentation",
  },
  6: {
    required: ["Evacuation Plan"],
    optional: ["OHS Audit Report", "OHS Appointment Letter"],
    description: "Occupational Health & Safety documentation",
  },
  7: {
    required: [],
    optional: ["LMS Licence Proof"],
    description: "LMS documentation (required for Blended/Mobile delivery)",
  },
  8: {
    required: ["WBL Agreement"],
    optional: ["Logbook Template", "Monitoring Schedule"],
    description: "Workplace-Based Learning documentation",
  },
  9: {
    required: [
      "Finance Policy",
      "HR Policy",
      "Teaching & Learning Policy",
      "Assessment Policy",
      "Appeals Policy",
      "OHS Policy",
      "Refunds Policy",
    ],
    optional: [],
    description: "Policies and procedures documentation",
  },
  10: {
    required: ["CV", "Contract/SLA"],
    optional: ["SAQA Evaluation", "Work Permit"],
    description: "Facilitator documentation (per facilitator)",
  },
};

/**
 * Get required document types for a section
 */
export function getRequiredDocumentsForSection(sectionNumber: number): string[] {
  return READINESS_SECTION_DOCUMENTS[sectionNumber]?.required || [];
}

/**
 * Get optional document types for a section
 */
export function getOptionalDocumentsForSection(sectionNumber: number): string[] {
  return READINESS_SECTION_DOCUMENTS[sectionNumber]?.optional || [];
}

/**
 * Get all document types (required + optional) for a section
 */
export function getAllDocumentsForSection(sectionNumber: number): string[] {
  const section = READINESS_SECTION_DOCUMENTS[sectionNumber];
  if (!section) return [];
  return [...section.required, ...section.optional];
}

/**
 * Check if a section requires documents
 */
export function sectionRequiresDocuments(sectionNumber: number): boolean {
  const section = READINESS_SECTION_DOCUMENTS[sectionNumber];
  return section ? section.required.length > 0 || section.optional.length > 0 : false;
}
