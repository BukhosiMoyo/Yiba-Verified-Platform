import type { DeliveryMode } from "@prisma/client";

interface ReadinessData {
  delivery_mode: DeliveryMode;
  qualification_title?: string | null;
  saqa_id?: string | null;
  curriculum_code?: string | null;
  credits?: number | null;
  self_assessment_completed?: boolean | null;
  self_assessment_remarks?: string | null;
  registration_type?: string | null;
  professional_body_registration?: boolean | null;
  training_site_address?: string | null;
  ownership_type?: string | null;
  number_of_training_rooms?: number | null;
  room_capacity?: number | null;
  facilitator_learner_ratio?: string | null;
  learning_material_exists?: boolean | null;
  learning_material_coverage_percentage?: number | null;
  knowledge_module_coverage?: number | null;
  practical_module_coverage?: number | null;
  curriculum_alignment_confirmed?: boolean | null;
  learning_material_nqf_aligned?: boolean | null;
  knowledge_components_complete?: boolean | null;
  practical_components_complete?: boolean | null;
  learning_material_quality_verified?: boolean | null;
  fire_extinguisher_available?: boolean | null;
  emergency_exits_marked?: boolean | null;
  accessibility_for_disabilities?: boolean | null;
  first_aid_kit_available?: boolean | null;
  ohs_representative_name?: string | null;
  lms_name?: string | null;
  internet_connectivity_method?: string | null;
  isp?: string | null;
  lmis_functional?: boolean | null;
  lmis_popia_compliant?: boolean | null;
  wbl_workplace_partner_name?: string | null;
  wbl_agreement_type?: string | null;
  policies_procedures_notes?: string | null;
  facilitators?: Array<{ facilitator_id: string }>;
  documents?: Array<{ document_id: string }>;
}

interface SectionCompletion {
  section_name: string;
  completed: number; // 0-100
  required: boolean;
  missing_fields: string[];
  validation_warnings: string[];
}

/**
 * Calculate section completion for Form 5 readiness record
 */
export function calculateSectionCompletion(readiness: ReadinessData): {
  sections: SectionCompletion[];
  overall_completion: number;
  required_sections_complete: boolean;
  missing_required_sections: string[];
  validation_warnings: string[];
} {
  const deliveryMode = readiness.delivery_mode;
  const isFaceToFace = deliveryMode === "FACE_TO_FACE";
  const isBlended = deliveryMode === "BLENDED";
  const isMobile = deliveryMode === "MOBILE";

  const sections: SectionCompletion[] = [];
  const validationWarnings: string[] = [];

  // Section 2: Qualification Information
  const qualificationFields = [
    readiness.qualification_title,
    readiness.saqa_id,
    readiness.curriculum_code,
    readiness.credits,
    readiness.delivery_mode,
  ];
  const qualificationCompleted = qualificationFields.filter((f) => f !== null && f !== undefined && f !== "").length;
  const qualificationTotal = qualificationFields.length;
  const qualificationCompletion = Math.round((qualificationCompleted / qualificationTotal) * 100);
  sections.push({
    section_name: "section_2_qualification",
    completed: qualificationCompletion,
    required: true,
    missing_fields: [
      !readiness.qualification_title && "qualification_title",
      !readiness.saqa_id && "saqa_id",
      !readiness.curriculum_code && "curriculum_code",
      !readiness.credits && "credits",
    ].filter(Boolean) as string[],
    validation_warnings: [],
  });

  // Section 3.1: Self-Assessment
  const selfAssessmentCompleted = readiness.self_assessment_completed !== null ? 100 : 0;
  sections.push({
    section_name: "section_3_1_self_assessment",
    completed: selfAssessmentCompleted,
    required: true,
    missing_fields: readiness.self_assessment_completed === null ? ["self_assessment_completed"] : [],
    validation_warnings:
      readiness.self_assessment_completed === true && !readiness.self_assessment_remarks
        ? ["Self-assessment remarks are recommended when completed"]
        : [],
  });

  // Section 3.2: Registration & Legal Compliance
  const registrationFields = [readiness.registration_type, readiness.professional_body_registration];
  const registrationCompleted = registrationFields.filter((f) => f !== null && f !== undefined).length;
  const registrationCompletion = Math.round((registrationCompleted / registrationFields.length) * 100);
  sections.push({
    section_name: "section_3_2_registration",
    completed: registrationCompletion,
    required: true,
    missing_fields: [
      !readiness.registration_type && "registration_type",
      readiness.professional_body_registration === null && "professional_body_registration",
    ].filter(Boolean) as string[],
    validation_warnings: [],
  });

  // Section 3.3: Face-to-Face/Physical Delivery (conditional)
  if (isFaceToFace || isBlended) {
    const physicalFields = [
      readiness.training_site_address,
      readiness.ownership_type,
      readiness.number_of_training_rooms,
      readiness.facilitator_learner_ratio,
    ];
    const physicalCompleted = physicalFields.filter((f) => f !== null && f !== undefined && f !== "").length;
    const physicalCompletion = Math.round((physicalCompleted / physicalFields.length) * 100);
    sections.push({
      section_name: "section_3_3_physical_delivery",
      completed: physicalCompletion,
      required: true,
      missing_fields: [
        !readiness.training_site_address && "training_site_address",
        !readiness.ownership_type && "ownership_type",
      ].filter(Boolean) as string[],
      validation_warnings: [],
    });
  }

  // Section 3.4: Physical Resources – Knowledge Module
  const knowledgeFields = [
    readiness.number_of_training_rooms,
    readiness.room_capacity,
    readiness.facilitator_learner_ratio,
  ];
  const knowledgeCompleted = knowledgeFields.filter((f) => f !== null && f !== undefined && f !== "").length;
  const knowledgeCompletion = knowledgeFields.length > 0
    ? Math.round((knowledgeCompleted / knowledgeFields.length) * 100)
    : 0;
  sections.push({
    section_name: "section_3_4_knowledge_resources",
    completed: knowledgeCompletion,
    required: true,
    missing_fields: [],
    validation_warnings: [],
  });

  // Section 3.5: Practical Module Resources (document-based, assume 0% if no documents)
  sections.push({
    section_name: "section_3_5_practical_resources",
    completed: 0, // Document-based, will be calculated separately
    required: true,
    missing_fields: [],
    validation_warnings: [],
  });

  // Section 3.6: WBL
  const wblFields = [
    readiness.wbl_workplace_partner_name,
    readiness.wbl_agreement_type,
  ];
  const wblCompleted = wblFields.filter((f) => f !== null && f !== undefined && f !== "").length;
  const wblCompletion = wblFields.length > 0 ? Math.round((wblCompleted / wblFields.length) * 100) : 0;
  sections.push({
    section_name: "section_3_6_wbl",
    completed: wblCompletion,
    required: true,
    missing_fields: [],
    validation_warnings: [],
  });

  // Section 4: Hybrid/Blended (conditional)
  if (isBlended) {
    const blendedFields = [
      readiness.lms_name,
      readiness.internet_connectivity_method,
      readiness.isp,
    ];
    const blendedCompleted = blendedFields.filter((f) => f !== null && f !== undefined && f !== "").length;
    const blendedCompletion = blendedFields.length > 0
      ? Math.round((blendedCompleted / blendedFields.length) * 100)
      : 0;
    sections.push({
      section_name: "section_4_hybrid_blended",
      completed: blendedCompletion,
      required: true,
      missing_fields: [],
      validation_warnings: [],
    });
  }

  // Section 5: Mobile Unit (conditional)
  if (isMobile) {
    sections.push({
      section_name: "section_5_mobile_unit",
      completed: 0, // Document-based
      required: true,
      missing_fields: [],
      validation_warnings: [],
    });
  }

  // Section 6: LMIS
  const lmisFields = [readiness.lmis_functional, readiness.lmis_popia_compliant];
  const lmisCompleted = lmisFields.filter((f) => f !== null && f !== undefined).length;
  const lmisCompletion = lmisFields.length > 0 ? Math.round((lmisCompleted / lmisFields.length) * 100) : 0;
  sections.push({
    section_name: "section_6_lmis",
    completed: lmisCompletion,
    required: true,
    missing_fields: [],
    validation_warnings: [],
  });

  // Section 7: Policies & Procedures
  const policiesCompletion = readiness.policies_procedures_notes ? 100 : 0;
  sections.push({
    section_name: "section_7_policies",
    completed: policiesCompletion,
    required: true,
    missing_fields: !readiness.policies_procedures_notes ? ["policies_procedures_notes"] : [],
    validation_warnings: [],
  });

  // Section 8: OHS
  const ohsFields = [
    readiness.fire_extinguisher_available,
    readiness.emergency_exits_marked,
    readiness.accessibility_for_disabilities,
    readiness.first_aid_kit_available,
    readiness.ohs_representative_name,
  ];
  const ohsCompleted = ohsFields.filter((f) => f !== null && f !== undefined && f !== "").length;
  const ohsCompletion = Math.round((ohsCompleted / ohsFields.length) * 100);
  sections.push({
    section_name: "section_8_ohs",
    completed: ohsCompletion,
    required: true,
    missing_fields: [],
    validation_warnings: [],
  });

  // Section 9: Learning Material
  const learningMaterialFields = [
    readiness.learning_material_exists,
    readiness.learning_material_coverage_percentage,
    readiness.learning_material_nqf_aligned,
    readiness.knowledge_components_complete,
    readiness.practical_components_complete,
    readiness.learning_material_quality_verified,
  ];
  const learningMaterialCompleted = learningMaterialFields.filter(
    (f) => f !== null && f !== undefined
  ).length;
  const learningMaterialCompletion = Math.round((learningMaterialCompleted / learningMaterialFields.length) * 100);
  
  // Check for learning material coverage requirement (≥50%)
  if (
    readiness.learning_material_coverage_percentage != null &&
    (readiness.learning_material_coverage_percentage ?? 0) < 50
  ) {
    validationWarnings.push(
      `Learning material coverage is ${readiness.learning_material_coverage_percentage}%, which is below the 50% requirement per Form 5 Section 9`
    );
  }

  sections.push({
    section_name: "section_9_learning_material",
    completed: learningMaterialCompletion,
    required: true,
    missing_fields: [],
    validation_warnings:
      readiness.learning_material_coverage_percentage != null &&
      (readiness.learning_material_coverage_percentage ?? 0) < 50
        ? ["Learning material coverage must be ≥50% per Form 5 Section 9"]
        : [],
  });

  // Calculate overall completion
  const totalCompletion = sections.reduce((sum, s) => sum + s.completed, 0);
  const overallCompletion = sections.length > 0 ? Math.round(totalCompletion / sections.length) : 0;

  // Check required sections
  const requiredSections = sections.filter((s) => s.required);
  const requiredSectionsComplete = requiredSections.every((s) => s.completed === 100);
  const missingRequiredSections = requiredSections
    .filter((s) => s.completed < 100)
    .map((s) => s.section_name);

  return {
    sections,
    overall_completion: overallCompletion,
    required_sections_complete: requiredSectionsComplete,
    missing_required_sections: missingRequiredSections,
    validation_warnings: validationWarnings,
  };
}

/**
 * Validate readiness record for submission
 * Returns validation errors if record cannot be submitted
 */
export function validateReadinessForSubmission(readiness: ReadinessData): {
  can_submit: boolean;
  errors: string[];
  warnings: string[];
} {
  const completion = calculateSectionCompletion(readiness);
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check qualification information (Section 2)
  if (!readiness.qualification_title || !readiness.saqa_id || !readiness.curriculum_code || !readiness.credits) {
    errors.push("Qualification information (Section 2) is incomplete. All fields are required.");
  }

  // Check self-assessment (Section 3.1)
  if (readiness.self_assessment_completed === null) {
    errors.push("Self-assessment (Section 3.1) must be completed.");
  }
  if (readiness.self_assessment_completed === true && !readiness.self_assessment_remarks) {
    warnings.push("Self-assessment remarks are recommended when completed.");
  }

  // Check registration (Section 3.2)
  if (!readiness.registration_type) {
    errors.push("Registration type (Section 3.2) is required.");
  }

  // Check learning material coverage (Section 9)
  const overallCoverage = readiness.learning_material_coverage_percentage;
  if (overallCoverage != null && (overallCoverage ?? 0) < 50) {
    errors.push(
      `Learning material coverage is ${overallCoverage}%, which is below the 50% requirement per Form 5 Section 9`
    );
  }

  // Check required sections based on delivery mode
  if (readiness.delivery_mode === "FACE_TO_FACE" || readiness.delivery_mode === "BLENDED") {
    if (!readiness.training_site_address || !readiness.ownership_type) {
      errors.push("Physical delivery readiness (Section 3.3) is incomplete. Property & premises information is required.");
    }
  }

  if (readiness.delivery_mode === "BLENDED") {
    if (!readiness.lms_name) {
      errors.push("LMS information (Section 4) is required for Blended delivery mode.");
    }
  }

  // Check minimum completion
  if (completion.overall_completion < 80) {
    warnings.push(
      `Overall completion is ${completion.overall_completion}%. Consider completing more sections before submission.`
    );
  }

  // Check required sections
  if (!completion.required_sections_complete) {
    errors.push(
      `The following required sections are incomplete: ${completion.missing_required_sections.join(", ")}`
    );
  }

  // Add validation warnings from completion calculation
  warnings.push(...completion.validation_warnings);

  return {
    can_submit: errors.length === 0,
    errors,
    warnings,
  };
}
