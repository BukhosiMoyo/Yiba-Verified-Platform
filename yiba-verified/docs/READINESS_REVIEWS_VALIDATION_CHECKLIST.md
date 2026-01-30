# Form 5 Readiness Review System - Validation Checklist

## Quick Validation Checklist

Use this checklist to verify all critical functionality is working correctly.

---

## ✅ Phase 9.1: QCTO Visibility Rules

### API Level Validation
- [x] **QCTO Listing API** (`/api/qcto/readiness`):
  - ✅ Uses `notIn: ["NOT_STARTED", "IN_PROGRESS"]` in where clause
  - ✅ Only returns records with status: SUBMITTED, UNDER_REVIEW, RETURNED_FOR_CORRECTION, REVIEWED, RECOMMENDED, REJECTED

- [x] **QCTO Detail API** (`/api/qcto/readiness/[readinessId]`):
  - ✅ Uses `notIn: ["NOT_STARTED", "IN_PROGRESS"]` in where clause
  - ✅ Additional safety check: `if (readiness.readiness_status === "NOT_STARTED" || readiness.readiness_status === "IN_PROGRESS") notFound()`

- [x] **QCTO Document APIs**:
  - ✅ `/api/qcto/readiness/[readinessId]/documents/[documentId]/flag` - Uses `notIn` filter
  - ✅ `/api/qcto/readiness/[readinessId]/documents/[documentId]/verify` - Uses `notIn` filter
  - ✅ `/api/qcto/readiness/[readinessId]/review-history` - Uses `notIn` filter

- [x] **QCTO Stats API** (`/api/qcto/institutions/[institutionId]/readiness-stats`):
  - ✅ Excludes draft records from calculations

### UI Level Validation
- [x] **QCTO Listing Page** (`/qcto/readiness/page.tsx`):
  - ✅ `STATUS_OPTIONS` array excludes `NOT_STARTED` and `IN_PROGRESS`
  - ✅ `formatStatus` function doesn't include draft statuses

- [x] **QCTO Detail Page** (`/qcto/readiness/[readinessId]/page.tsx`):
  - ✅ Server-side query excludes drafts
  - ✅ Additional safety check returns `notFound()` for drafts

**✅ VERIFIED: All QCTO visibility rules are properly implemented at both API and UI levels.**

---

## ✅ Phase 9.2: Submission Flow

### Immutability Validation
- [x] **API Level** (`/api/institutions/readiness/[readinessId]/route.ts`):
  - ✅ Checks `isSubmitted` status (SUBMITTED, UNDER_REVIEW, RETURNED_FOR_CORRECTION, REVIEWED, RECOMMENDED, REJECTED)
  - ✅ Blocks updates to qualification fields if `isSubmitted === true`
  - ✅ Returns error: "Qualification information is immutable after submission"

- [x] **UI Level** (`ReadinessFormFullPage.tsx`):
  - ✅ Sets `qualificationFieldsLocked = isSubmitted`
  - ✅ Passes `qualificationFieldsLocked` prop to `ReadinessFormStepContent`
  - ✅ Fields are disabled when locked

- [x] **Form Component** (`ReadinessFormStepContent.tsx`):
  - ✅ All qualification fields have `disabled={qualificationFieldsLocked}`
  - ✅ Shows warning message when fields are locked

### Validation Validation
- [x] **Validation Function** (`readinessCompletion.ts`):
  - ✅ `validateReadinessForSubmission` checks:
    - Section 2: qualification_title, saqa_id, curriculum_code, credits
    - Section 3.1: self_assessment_completed
    - Section 3.2: registration_type
    - Section 9: learning_material_coverage_percentage >= 50
    - Delivery mode-specific requirements

- [x] **Validation API** (`/api/institutions/readiness/[readinessId]/validate-submission`):
  - ✅ Returns `can_submit`, `errors`, `warnings`
  - ✅ Used before submission in `handleSubmitForReview`

- [x] **Submission Handler** (`ReadinessFormFullPage.tsx`):
  - ✅ Calls validation API before submission
  - ✅ Blocks submission if validation fails
  - ✅ Shows clear error messages

**✅ VERIFIED: Submission flow with immutability and validation is properly implemented.**

---

## ✅ Phase 9.3: Review Flow

### Review Form Validation
- [x] **ReadinessReviewForm Component**:
  - ✅ Handles status changes (UNDER_REVIEW, RETURNED_FOR_CORRECTION, RECOMMENDED, REJECTED)
  - ✅ Validates final recommendation requirements (verifier_remarks, sme_name, sme_signature)
  - ✅ Validates return for correction (reasons or remarks)
  - ✅ Handles learning material verification
  - ✅ Submits criterion reviews

### API Validation
- [x] **Review API** (`/api/qcto/readiness/[readinessId]/review/route.ts`):
  - ✅ Validates status values
  - ✅ Validates recommendation values (RECOMMENDED or NOT_RECOMMENDED)
  - ✅ Validates final recommendation requirements
  - ✅ Creates/updates `ReadinessRecommendation` records
  - ✅ Creates/updates `ReadinessSectionReview` records
  - ✅ Updates learning material verification fields
  - ✅ Uses `mutateWithAudit` for all changes

### Document Flagging Validation
- [x] **Flag API** (`/api/qcto/readiness/[readinessId]/documents/[documentId]/flag/route.ts`):
  - ✅ Creates `DocumentFlag` records
  - ✅ Uses `mutateWithAudit`
  - ✅ Validates QCTO access
  - ✅ Validates readiness record is not draft

- [x] **Verify API** (`/api/qcto/readiness/[readinessId]/documents/[documentId]/verify/route.ts`):
  - ✅ Updates `DocumentFlag` status to VERIFIED
  - ✅ Updates `Document` status to ACCEPTED
  - ✅ Uses `mutateWithAudit`

**✅ VERIFIED: Review flow with section reviews, document flagging, and final recommendation is properly implemented.**

---

## ✅ Phase 9.4: Document Management

### Inline Upload Validation
- [x] **InlineDocumentUpload Component**:
  - ✅ Handles file selection
  - ✅ Validates file size (10MB limit)
  - ✅ Shows upload progress
  - ✅ Calls `/api/institutions/readiness/[readinessId]/documents`
  - ✅ Shows success/error feedback

### Vault Selection Validation
- [x] **DocumentVaultSelector Component**:
  - ✅ Fetches documents from `/api/institutions/documents/vault`
  - ✅ Supports search functionality
  - ✅ Links documents via `/api/institutions/readiness/[readinessId]/documents/link`
  - ✅ Shows loading states
  - ✅ Handles errors gracefully

### Document Actions Validation
- [x] **DocumentsEvidenceViewer Component**:
  - ✅ Displays document cards
  - ✅ Shows document status (Submitted, Flagged, Verified)
  - ✅ Handles preview (opens download link)
  - ✅ Handles download
  - ✅ Handles flagging (opens modal)
  - ✅ Handles verification

**✅ VERIFIED: Document management (upload, vault selection, flagging, verification) is properly implemented.**

---

## ✅ Phase 9.5: Form 5 Compliance

### Section Display Validation
- [x] **ReadinessContentDisplay Component**:
  - ✅ Displays all Form 5 sections:
    - Section 2: Qualification Information
    - Section 3.1: Self-Assessment
    - Section 3.2: Registration & Legal Compliance
    - Section 3.3: Physical Delivery (conditional)
    - Section 3.4: Knowledge Module Resources
    - Section 3.5: Practical Module Resources
    - Section 3.6: WBL
    - Section 4: Hybrid/Blended (conditional)
    - Section 5: Mobile Unit (conditional)
    - Section 6: LMIS
    - Section 7: Policies & Procedures
    - Section 8: OHS
    - Section 9: Learning Material

- [x] **Delivery Mode Logic**:
  - ✅ Face-to-Face: Shows 3.3, 3.4, 3.5, 3.6, 6, 7, 8, 9
  - ✅ Blended: Shows 3.3, 3.4, 3.5, 3.6, 4, 6, 7, 8, 9
  - ✅ Mobile Unit: Shows 3.4, 3.5, 3.6, 5, 6, 7, 8, 9

### Field Validation
- [x] **Qualification Fields**:
  - ✅ qualification_title, saqa_id, curriculum_code, credits, nqf_level
  - ✅ occupational_category, intended_learner_intake
  - ✅ delivery_mode

- [x] **Learning Material Fields**:
  - ✅ learning_material_coverage_percentage (validated >= 50%)
  - ✅ learning_material_nqf_aligned
  - ✅ knowledge_components_complete
  - ✅ practical_components_complete
  - ✅ learning_material_quality_verified

- [x] **LMIS Fields**:
  - ✅ lmis_functional
  - ✅ lmis_popia_compliant
  - ✅ lmis_data_storage_description
  - ✅ lmis_access_control_description

**✅ VERIFIED: Form 5 compliance with all sections and delivery mode logic is properly implemented.**

---

## ✅ Additional Validations

### Completion Tracking
- [x] **Completion Calculation** (`readinessCompletion.ts`):
  - ✅ Calculates per-section completion percentages
  - ✅ Identifies missing required fields
  - ✅ Generates validation warnings
  - ✅ Calculates overall completion

- [x] **Completion API** (`/api/institutions/readiness/[readinessId]/completion`):
  - ✅ Returns completion data
  - ✅ Used by form for progress tracking

### Trust Score
- [x] **Trust Score Calculation** (`institutionTrustScore.ts`):
  - ✅ Calculates score based on multiple factors
  - ✅ Stores in `InstitutionTrustScore` model
  - ✅ Returns trend (UP/DOWN/STABLE)

- [x] **Trust Score API** (`/api/qcto/institutions/[institutionId]/trust-score`):
  - ✅ Returns trust score data
  - ✅ Used by `InstitutionTrustScore` component

### Audit & Traceability
- [x] **All Actions Audited**:
  - ✅ Review submissions use `mutateWithAudit`
  - ✅ Document flagging uses `mutateWithAudit`
  - ✅ Document verification uses `mutateWithAudit`
  - ✅ Status changes create audit logs

- [x] **Review History**:
  - ✅ `ReviewHistory` component displays audit logs
  - ✅ API endpoint `/api/qcto/readiness/[readinessId]/review-history` returns audit logs
  - ✅ Shows reviewer identities, timestamps, actions

**✅ VERIFIED: All additional features (completion tracking, trust score, audit logging) are properly implemented.**

---

## Summary

### ✅ All Critical Validations Pass

1. **QCTO Visibility Rules**: ✅ Properly enforced at API and UI levels
2. **Submission Flow**: ✅ Immutability and validation working correctly
3. **Review Flow**: ✅ All review actions properly implemented
4. **Document Management**: ✅ Upload, selection, flagging, verification working
5. **Form 5 Compliance**: ✅ All sections and delivery mode logic correct

### Ready for Production Testing

The system is ready for:
- Manual testing by QCTO reviewers
- User acceptance testing
- Production deployment (after final review)

### Next Steps

1. Perform manual testing using the test accounts
2. Gather feedback from QCTO reviewers
3. Refine validation messages based on real-world usage
4. Implement document preview functionality (currently opens download)
5. Integrate file storage (S3/Azure Blob) for production

---

## Test Accounts Reference

### QCTO Users
- `qcto.reviewer2@gmail.com` / `Password123!` (QCTO_USER)
- `qcto.superadmin@gmail.com` / `Password123!` (QCTO_SUPER_ADMIN)
- `qcto.admin1@gmail.com` / `Password123!` (QCTO_ADMIN)

### Institution Users
- `admin.bonanieducation10@gmail.com` / `Password123!` (INSTITUTION_ADMIN)
- `staff0.bonanieducation10@gmail.com` / `Password123!` (INSTITUTION_STAFF)
