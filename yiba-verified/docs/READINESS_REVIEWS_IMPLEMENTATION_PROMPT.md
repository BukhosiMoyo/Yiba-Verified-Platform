# Form 5 Readiness Submission & QCTO Review System - Implementation Prompt

## Overview
This document provides a comprehensive implementation guide for redesigning the Form 5 Readiness workflow to align with the **Official QCTO Form 5 – Programme Delivery Readiness (August 2024)** requirements. The implementation must ensure QCTO reviewers can properly evaluate all information submitted by institutions according to the official evaluation criteria.

## Official Form 5 Structure Reference

### Delivery Mode Conditional Logic
Sections must show/hide based on delivery mode:
- **Face-to-Face**: Sections 1, 2, 3, 6, 7, 8, 9
- **Hybrid/Blended**: Sections 1, 2, 3, 4, 6, 7, 8, 9
- **Mobile Unit**: Sections 1, 2, 5, 6, 7, 8, 9

### Official Form 5 Sections
1. **Qualification Information** (Section 2)
2. **Self-Assessment** (3.1)
3. **Registration & Legal Compliance** (3.2)
4. **Face-to-Face/Physical Delivery Readiness** (3.3) - Conditional
   - 3.3.1 Property & Premises
   - 3.3.2 Human Resource Capacity (Management)
   - 3.3.3 Facilitators (Human Resources)
   - 3.3.4 Facilitator Contracts
5. **Physical Resources – Knowledge Module** (3.4)
6. **Practical Module Resources** (3.5)
7. **Workplace-Based Learning (WBL)** (3.6)
8. **Hybrid/Blended Delivery Mode** (4) - Conditional
   - 4.1 Online Delivery Management
   - 4.2 Knowledge Module via LMS
   - 4.3 Practical Module via LMS
   - 4.4 Workplace Module via LMS
9. **Mobile Unit Delivery Mode** (5) - Conditional
10. **Learner Management Information System (LMIS)** (6)
11. **Policies & Procedures** (7)
12. **Occupational Health & Safety (OHS)** (8)
13. **Learning Material** (9) - Must cover ≥50% of curriculum
14. **Final Recommendation** (10) - Verifier only, with signature

## Current State Analysis

### Existing Files & Components
- **QCTO Review Page**: `/src/app/qcto/readiness/[readinessId]/page.tsx`
- **Institution Detail Page**: `/src/app/institution/readiness/[readinessId]/page.tsx`
- **Review Form Component**: `/src/components/qcto/ReadinessReviewForm.tsx`
- **QCTO Listing Page**: `/src/app/qcto/readiness/page.tsx`
- **Institution Listing Page**: `/src/app/institution/readiness/page.tsx`
- **API Routes**:
  - `/src/app/api/qcto/readiness/[readinessId]/review/route.ts`
  - `/src/app/api/institutions/readiness/[readinessId]/route.ts`
  - `/src/app/api/qcto/readiness/route.ts`
- **Database Schema**: `prisma/schema.prisma` (Readiness model at line 135)

### Current Status Values
- `NOT_STARTED`, `IN_PROGRESS`, `SUBMITTED`, `UNDER_REVIEW`, `RETURNED_FOR_CORRECTION`, `REVIEWED`, `RECOMMENDED`, `REJECTED`

---

## Implementation Tasks

### Phase 1: Database Schema Enhancements

#### Task 1.1: Add Qualification Information Fields (Section 2)
**File**: `prisma/schema.prisma`

Add qualification information fields to the `Readiness` model (Section 2 of Form 5):
- `credits` (Int?) - Number of credits (required)
- `occupational_category` (String?) - Occupational category
- `intended_learner_intake` (Int?) - Target learner intake

**Note**: These fields are part of Qualification Information (Section 2) and should be set when status changes to `SUBMITTED` and become immutable after submission.

#### Task 1.2: Add Form 5 Section Structure & Completion Tracking
**File**: `prisma/schema.prisma`

Add fields to track Form 5 sections according to official structure:
- `section_completion_data` (Json?) - Store completion percentages and validation state per section
  - Structure: `{ "section_2_qualification": { "completed": 100, "required": true }, "section_3_1_self_assessment": { "completed": 85, "required": true }, ... }`
- `section_criteria_responses` (Json?) - Store Yes/No responses and mandatory remarks per criterion
  - Structure: `{ "section_3_2_registration": { "criterion_1": { "response": "YES", "remarks": "...", "evidence_document_ids": [...] }, ... } }`

**Form 5 Sections to Track**:
- `section_2_qualification` - Qualification Information
- `section_3_1_self_assessment` - Self-Assessment
- `section_3_2_registration` - Registration & Legal Compliance
- `section_3_3_physical_delivery` - Face-to-Face/Physical Delivery (conditional)
- `section_3_4_knowledge_resources` - Physical Resources - Knowledge Module
- `section_3_5_practical_resources` - Practical Module Resources
- `section_3_6_wbl` - Workplace-Based Learning
- `section_4_hybrid_blended` - Hybrid/Blended Delivery (conditional)
- `section_5_mobile_unit` - Mobile Unit Delivery (conditional)
- `section_6_lmis` - Learner Management Information System
- `section_7_policies` - Policies & Procedures
- `section_8_ohs` - Occupational Health & Safety
- `section_9_learning_material` - Learning Material

#### Task 1.3: Create Institution Trust Score Model
**File**: `prisma/schema.prisma`

Create new model `InstitutionTrustScore`:
```prisma
model InstitutionTrustScore {
  score_id        String   @id @default(uuid())
  institution_id  String   @unique
  score           Int      // 0-100
  trend           String?  // "UP", "DOWN", "STABLE"
  explanation     String?  @db.Text
  factors         Json?    // Store scoring factors
  last_calculated DateTime @default(now())
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
  
  institution Institution @relation(fields: [institution_id], references: [institution_id])
  
  @@index([institution_id])
}
```

Add relation to `Institution` model:
```prisma
trustScore InstitutionTrustScore?
```

#### Task 1.4: Enhance ReadinessRecommendation Model (Section 10 - Final Recommendation)
**File**: `prisma/schema.prisma`

Enhance `ReadinessRecommendation` to match Form 5 Section 10 requirements:
- `recommendation` (String) - Must be "RECOMMENDED" or "NOT_RECOMMENDED" (official Form 5 values)
- `verifier_remarks` (String? @db.Text) - Verifier remarks (mandatory per Form 5)
- `sme_name` (String?) - Subject Matter Expert name
- `sme_signature` (String?) - SME signature (base64 image or file reference)
- `verification_date` (DateTime?) - Date of verification
- `section_scores` (Json?) - Per-section scoring/ratings
- `document_flags` (Json?) - Array of flagged documents with reasons
- `review_notes` (String? @db.Text) - Overall review notes (separate from remarks)
- `reviewer_confidence` (Int?) - Confidence score 0-100

**Note**: Per Form 5 Section 10, only verifiers can complete final recommendation with signature.

#### Task 1.5: Create ReadinessSectionReview Model (Per-Criterion Reviews)
**File**: `prisma/schema.prisma`

Create model for per-section/criterion reviews following Form 5 structure:
```prisma
model ReadinessSectionReview {
  review_id       String   @id @default(uuid())
  readiness_id    String
  section_name    String   // e.g., "section_3_2_registration", "section_3_3_physical_delivery"
  criterion_key   String?  // Optional: specific criterion within section (e.g., "3.3.1_property_premises")
  reviewer_id     String
  response        String?  // "YES", "NO", "PASS", "NEEDS_WORK", "FAIL" (per Form 5 Yes/No pattern)
  mandatory_remarks String? @db.Text // Mandatory remarks per Form 5 requirement
  notes           String?  @db.Text // Additional notes
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
  
  readiness Readiness @relation(fields: [readiness_id], references: [readiness_id])
  reviewer  User      @relation(fields: [reviewer_id], references: [user_id])
  
  @@unique([readiness_id, section_name, criterion_key, reviewer_id])
  @@index([readiness_id])
  @@index([reviewer_id])
}
```

Add relation to `Readiness`:
```prisma
sectionReviews ReadinessSectionReview[]
```

**Note**: Form 5 requires Yes/No decision + mandatory remarks for each criterion.

#### Task 1.6: Create Document Flag Model
**File**: `prisma/schema.prisma`

Create model for document flags:
```prisma
model DocumentFlag {
  flag_id      String   @id @default(uuid())
  document_id  String
  readiness_id String?  // Optional: link to readiness if flagged during review
  flagged_by   String
  reason       String   @db.Text
  status       String   @default("FLAGGED") // "FLAGGED", "RESOLVED", "VERIFIED"
  created_at   DateTime @default(now())
  resolved_at  DateTime?
  
  document  Document  @relation(fields: [document_id], references: [document_id])
  readiness Readiness? @relation(fields: [readiness_id], references: [readiness_id])
  flaggedBy User      @relation(fields: [flagged_by], references: [user_id])
  
  @@index([document_id])
  @@index([readiness_id])
  @@index([flagged_by])
}
```

Add relations:
- To `Document`: `flags DocumentFlag[]`
- To `Readiness`: `documentFlags DocumentFlag[]`
- To `User`: `documentFlags DocumentFlag[]`

#### Task 1.7: Add Facilitator Management Model
**File**: `prisma/schema.prisma`

Create model for facilitator management (Section 3.3.3 & 3.3.4):
```prisma
model Facilitator {
  facilitator_id        String   @id @default(uuid())
  readiness_id          String
  first_name            String
  last_name             String
  id_number             String?  // ID / Passport
  qualifications        String?  @db.Text
  industry_experience   String?  @db.Text
  is_non_sa             Boolean  @default(false)
  saqa_evaluation_id    String?  // If non-SA facilitator
  work_permit_number    String?  // If non-SA facilitator
  visa_passport_number  String?  // If non-SA facilitator
  contract_document_id  String?  // Link to contract/SLA document
  cv_document_id        String?  // Link to CV document
  qualification_doc_id   String?  // Link to qualification document
  id_document_id        String?  // Link to ID/Passport document
  created_at            DateTime @default(now())
  updated_at            DateTime @updatedAt
  
  readiness Readiness @relation(fields: [readiness_id], references: [readiness_id])
  
  @@index([readiness_id])
}
```

Add relation to `Readiness`:
```prisma
facilitators Facilitator[]
```

**Requirements per Form 5**:
- Certified documents must be within 6 months
- Non-SA facilitators require SAQA evaluation + valid work permit + valid visa/passport
- All facilitators need employment contract or SLA

#### Task 1.8: Add Learning Material Verification Fields
**File**: `prisma/schema.prisma`

Add fields to `Readiness` model for Section 9 (Learning Material):
- `learning_material_coverage_percentage` (Int?) - Must be ≥50% per Form 5
- `learning_material_nqf_aligned` (Boolean?) - Aligned to NQF level
- `knowledge_components_complete` (Boolean?) - Knowledge components complete
- `practical_components_complete` (Boolean?) - Practical components complete
- `learning_material_quality_verified` (Boolean?) - Quality & understandability verified

#### Task 1.9: Add LMIS Fields (Section 6)
**File**: `prisma/schema.prisma`

Add fields to `Readiness` model for Section 6 (LMIS):
- `lmis_functional` (Boolean?) - Functional LMIS in place
- `lmis_popia_compliant` (Boolean?) - POPIA compliance
- `lmis_data_storage_description` (String? @db.Text) - Data storage & backups
- `lmis_access_control_description` (String? @db.Text) - Controlled access to learner data

#### Task 1.10: Run Migration
After schema changes, create and run migration:
```bash
npx prisma migrate dev --name enhance_readiness_review_system_form5
```

---

### Phase 2: QCTO Visibility Rules (CRITICAL)

#### Task 2.1: Update QCTO Readiness API Route
**File**: `/src/app/api/qcto/readiness/route.ts`

**CRITICAL REQUIREMENT**: QCTO must NEVER see `NOT_STARTED` or `IN_PROGRESS` readiness records.

Update the `where` clause to exclude these statuses:
```typescript
const where: any = {
  deleted_at: null,
  readiness_status: {
    notIn: ["NOT_STARTED", "IN_PROGRESS"] // QCTO cannot see drafts
  }
};
```

#### Task 2.2: Update QCTO Detail Page Query
**File**: `/src/app/qcto/readiness/[readinessId]/page.tsx`

Add validation to prevent QCTO from accessing draft records:
```typescript
if (readiness.readiness_status === "NOT_STARTED" || readiness.readiness_status === "IN_PROGRESS") {
  notFound(); // QCTO cannot view drafts
}
```

#### Task 2.3: Update QCTO Listing Page Filter
**File**: `/src/app/qcto/readiness/page.tsx`

Remove `NOT_STARTED` and `IN_PROGRESS` from status filter options. Only show:
- `SUBMITTED`
- `UNDER_REVIEW`
- `RETURNED_FOR_CORRECTION`
- `REVIEWED`
- `RECOMMENDED`
- `REJECTED`

---

### Phase 3: Enhanced QCTO Review Page

#### Task 3.1: Create Qualification Overview Component
**File**: `/src/components/qcto/readiness/QualificationOverview.tsx`

Create a component that displays:
- Qualification name & code (SAQA ID)
- NQF level & credits
- Occupational area
- Delivery mode
- Target intake
- Target learner profile

**Design**: Use a prominent card at the top of the review page with clear visual hierarchy.

#### Task 3.2: Create Institution Profile Snapshot Component
**File**: `/src/components/qcto/readiness/InstitutionProfileSnapshot.tsx`

Create a compact read-only panel showing:
- Institution name
- Accreditation status (from Institution model)
- Years active (calculated from `created_at`)
- Previous submissions count (count of readiness records with status `RECOMMENDED` or `REJECTED`)
- Approved vs rejected history (aggregate counts)
- Existing approved qualifications (list of `RECOMMENDED` readiness records)

**Data Fetching**: Create API endpoint `/api/qcto/institutions/[institutionId]/readiness-stats` to fetch this data efficiently.

#### Task 3.3: Create Institution Trust Score Component
**File**: `/src/components/qcto/readiness/InstitutionTrustScore.tsx`

Create a component that displays:
- Score (0-100) with visual indicator (progress bar or circular)
- Trend indicator (↑ ↓ →) with color coding
- Short explanation text
- Tooltip showing scoring factors

**Backend**: Create service function to calculate trust score based on:
- Submission completeness history
- Approval success rate
- Frequency of returns
- Document quality ratings (future)
- Reviewer confidence scores

**File**: `/src/lib/institutionTrustScore.ts`

#### Task 3.4: Create Full Readiness Content Display Component
**File**: `/src/components/qcto/readiness/ReadinessContentDisplay.tsx`

Display all submitted sections in read-only mode:
- Show completion % for each section
- Highlight missing required fields
- Display reviewer notes if previously reviewed
- Show section-by-section ratings if available

**Sections to Display (Official Form 5 Structure)**:
1. **Section 2**: Qualification Information
2. **Section 3.1**: Self-Assessment
3. **Section 3.2**: Registration & Legal Compliance
4. **Section 3.3**: Face-to-Face/Physical Delivery Readiness (conditional on delivery mode)
   - 3.3.1 Property & Premises
   - 3.3.2 Human Resource Capacity (Management)
   - 3.3.3 Facilitators (Human Resources)
   - 3.3.4 Facilitator Contracts
5. **Section 3.4**: Physical Resources – Knowledge Module
6. **Section 3.5**: Practical Module Resources
7. **Section 3.6**: Workplace-Based Learning (WBL)
8. **Section 4**: Hybrid/Blended Delivery Mode (conditional on delivery mode)
   - 4.1 Online Delivery Management
   - 4.2 Knowledge Module via LMS
   - 4.3 Practical Module via LMS
   - 4.4 Workplace Module via LMS
9. **Section 5**: Mobile Unit Delivery Mode (conditional on delivery mode)
10. **Section 6**: Learner Management Information System (LMIS)
11. **Section 7**: Policies & Procedures
12. **Section 8**: Occupational Health & Safety (OHS)
13. **Section 9**: Learning Material (must show ≥50% coverage verification)

**Design**: 
- Use collapsible sections or tabs for better organization
- Show/hide sections based on delivery mode (Face-to-Face, Hybrid/Blended, Mobile Unit)
- Display Yes/No responses with mandatory remarks for each criterion
- Show evidence documents linked to each criterion

#### Task 3.5: Create Documents & Evidence Viewer Component
**File**: `/src/components/qcto/readiness/DocumentsEvidenceViewer.tsx`

Create an interactive document viewer with:
- Document cards showing:
  - File name
  - Type & size
  - Upload date
  - Status (submitted / flagged / verified)
- Actions per document:
  - Preview in-app (PDF/image viewer)
  - Download
  - Flag with reason (opens modal)
  - Mark as verified/accepted

**File**: `/src/components/qcto/readiness/DocumentCard.tsx` (individual document card)
**File**: `/src/components/qcto/readiness/FlagDocumentModal.tsx` (flagging modal)

**API Endpoints Needed**:
- `POST /api/qcto/readiness/[readinessId]/documents/[documentId]/flag` - Flag a document
- `POST /api/qcto/readiness/[readinessId]/documents/[documentId]/verify` - Mark as verified
- `GET /api/documents/[documentId]/preview` - Get preview URL

#### Task 3.6: Create Review Helper Panel Component
**File**: `/src/components/qcto/readiness/ReviewHelperPanel.tsx`

Create a sidebar or collapsible panel showing:
- Overall submission completeness %
- Missing mandatory sections (list)
- Missing documents (list)
- High-risk indicators (e.g., low completion, flagged documents)
- Auto-generated checklist

**Design**: Use a sticky sidebar or floating panel that stays visible during review.

#### Task 3.7: Redesign QCTO Review Form (Section 10 - Final Recommendation)
**File**: `/src/components/qcto/ReadinessReviewForm.tsx`

Redesign to match Form 5 Section 10 requirements:
- **Per-criterion Yes/No reviews**: For each criterion, reviewer must provide:
  - Yes/No response (required)
  - Mandatory remarks (required per Form 5)
  - Evidence verification (linked documents)
- **Per-section commenting**: Allow reviewers to add notes per section
- **Document flagging**: Flag specific documents with reasons
- **Learning Material Verification**: 
  - Verify coverage ≥50% of curriculum
  - Verify NQF level alignment
  - Verify knowledge & practical components complete
  - Verify quality & understandability
- **Final Recommendation (Section 10 - Verifier Only)**:
  - Recommendation: "RECOMMENDED" or "NOT_RECOMMENDED" (official Form 5 values)
  - Verifier remarks (mandatory)
  - SME name (required)
  - SME signature (required - file upload or digital signature)
  - Verification date (auto-set)
- **Return for correction**: With structured reasons dropdown + free text

**New API Contract**:
```typescript
interface ReviewReadinessBody {
  status?: "UNDER_REVIEW" | "RECOMMENDED" | "REJECTED" | "RETURNED_FOR_CORRECTION";
  recommendation?: "RECOMMENDED" | "NOT_RECOMMENDED"; // Official Form 5 values
  verifier_remarks?: string; // Mandatory per Form 5 Section 10
  sme_name?: string; // Required for final recommendation
  sme_signature?: string; // Base64 image or file reference
  review_notes?: string; // Internal review notes
  criterion_reviews?: Array<{
    section_name: string;
    criterion_key?: string; // Optional: specific criterion
    response: "YES" | "NO" | "PASS" | "NEEDS_WORK" | "FAIL";
    mandatory_remarks: string; // Required per Form 5
    notes?: string;
  }>;
  document_flags?: Array<{
    document_id: string;
    reason: string;
  }>;
  learning_material_verification?: {
    coverage_percentage: number; // Must be ≥50
    nqf_aligned: boolean;
    knowledge_components_complete: boolean;
    practical_components_complete: boolean;
    quality_verified: boolean;
  };
  return_reasons?: string[]; // Structured reasons for return
}
```

#### Task 3.8: Redesign QCTO Detail Page Layout
**File**: `/src/app/qcto/readiness/[readinessId]/page.tsx`

Restructure the page to follow this layout:

```
┌─────────────────────────────────────────────────┐
│ Qualification Overview (Full Width)            │
├─────────────────────────────────────────────────┤
│ Institution Profile │ Trust Score              │
│ Snapshot            │                           │
├─────────────────────────────────────────────────┤
│ Full Readiness Content (Left Column)          │
│                                                 │
│ [All sections displayed]                       │
│                                                 │
├─────────────────────────────────────────────────┤
│ Documents & Evidence Viewer                    │
│                                                 │
│ [Document cards with actions]                  │
│                                                 │
├─────────────────────────────────────────────────┤
│ Review Helper Panel (Sidebar)                 │
│                                                 │
│ [Completeness, checklist, etc.]                │
│                                                 │
├─────────────────────────────────────────────────┤
│ Review Form (Bottom)                           │
│                                                 │
│ [Enhanced review form]                         │
└─────────────────────────────────────────────────┘
```

**Fetch Additional Data**:
- Institution stats (previous submissions, etc.)
- Trust score
- Section reviews (if any)
- Document flags
- Review history

---

### Phase 4: Institution Submission Experience

#### Task 4.1: Implement Form 5 Section Structure with Delivery Mode Logic
**File**: `/src/components/institution/ReadinessFormFullPage.tsx`

Restructure form to match official Form 5 sections with conditional logic:

**Section 2: Qualification Information** (Always visible)
- Qualification/Curriculum Title (existing)
- NQF Level (existing)
- Credits (number input - required)
- SAQA ID (existing)
- Curriculum Code (existing)

**Conditional Section Display**:
- Show/hide sections based on `delivery_mode`:
  - **Face-to-Face**: Show 3.3, 3.4, 3.5, 3.6, 6, 7, 8, 9
  - **Hybrid/Blended**: Show 3.3, 3.4, 3.5, 3.6, 4, 6, 7, 8, 9
  - **Mobile Unit**: Show 3.4, 3.5, 3.6, 5, 6, 7, 8, 9

**Section 3.1: Self-Assessment**
- Self-assessment completion (Yes/No)
- Mandatory remarks (textarea - required if Yes/No selected)

**Section 3.2: Registration & Legal Compliance**
- Registration type (select: Private Company, Close Corporation, NPO/NGO, CET/TVET, University, Public Institution)
- Professional Body Registration (Yes/No)
- Mandatory evidence uploads:
  - CIPC/Registration Proof
  - Valid Tax Compliance PIN or SARS Exemption
  - SAQA registration (if Professional Body)

**Section 3.3: Face-to-Face/Physical Delivery Readiness** (conditional)
- 3.3.1 Property & Premises:
  - Proof of ownership OR valid lease agreement (not expired)
  - Address matching application
- 3.3.2 Human Resource Capacity (Management):
  - Organogram with roles & reporting lines
  - Quality assurance processes
  - Monitoring tools
- 3.3.3 Facilitators (Human Resources):
  - Facilitator management (use Facilitator model)
  - Qualified & competent facilitators
  - Industry experience
  - Certified documents (within 6 months): ID/Passport, Qualifications, CVs
  - Non-SA Facilitators: SAQA evaluation, valid work permit, valid visa/passport
- 3.3.4 Facilitator Contracts:
  - Employment contract or SLA
  - Signed by all parties
  - Clear job responsibilities

**Section 3.4: Physical Resources – Knowledge Module**
- Number of training rooms
- Furniture & equipment checklist
- Facilitator-to-learner ratio
- Inventory lists
- Resource checklist aligned to curriculum

**Section 3.5: Practical Module Resources**
- Workshop/simulation venue
- Tools, equipment & consumables
- Practical inventory lists
- Alignment with curriculum requirements

**Section 3.6: Workplace-Based Learning (WBL)**
- MoU/SLA/Partnership Agreement
- Covers all workplace components
- Valid duration & signatures
- Logbooks
- Workplace monitoring schedule
- Learner support mechanism

**Section 4: Hybrid/Blended Delivery Mode** (conditional)
- 4.1 Online Delivery Management:
  - Documented LMS implementation process
  - Number of computers/devices
  - Licensed operating systems
  - Licensed LMS
  - Internet connectivity & ISP contract
  - Data backup & protection process
- 4.2 Knowledge Module via LMS:
  - Learning content loaded
  - Formative assessments available
  - Moderation processes
  - Learner communication tools
  - Digital library
  - Webinar tools (Zoom, Teams, etc.)
- 4.3 Practical Module via LMS:
  - Practical content loaded
  - Practical assessments
  - Moderation access
- 4.4 Workplace Module via LMS:
  - Workplace assessment process
  - Moderation access

**Section 5: Mobile Unit Delivery Mode** (conditional)
- Proof of mobile unit ownership
- Capacity aligned with enrolments
- Inventory lists (knowledge & practical)
- Accredited scope confirmation
- Learner uptake justification
- Practical implementation plan

**Section 6: Learner Management Information System (LMIS)**
- Functional LMIS in place (Yes/No)
- POPIA compliance (Yes/No)
- Data storage & backups (description)
- Controlled access to learner data (description)

**Section 7: Policies & Procedures**
- Mandatory policies checklist:
  - Finance
  - Human Resources
  - Teaching & Learning
  - Assessment (QCTO-aligned)
  - Appeals
  - Refund Policy
  - Occupational Health & Safety
- Learner Support:
  - Before training
  - During training
  - After training
  - Career pathway mapping (vertical & horizontal articulation)

**Section 8: Occupational Health & Safety (OHS)**
- Serviced fire extinguishers (Yes/No)
- Emergency exits & signage (Yes/No)
- Evacuation plans (Yes/No)
- OHS audit report ≤12 months (Yes/No)
- Disability access (Yes/No)
- First aid kit fully stocked (Yes/No)
- Appointed OHS representatives (Yes/No + name)

**Section 9: Learning Material**
- Learning material exists (Yes/No)
- Coverage percentage (must be ≥50%)
- Aligned to NQF level (Yes/No)
- Knowledge components complete (Yes/No)
- Practical components complete (Yes/No)
- Quality & understandability verified (Yes/No)

**Validation**: 
- All required sections must be completed before submission
- Yes/No responses require mandatory remarks
- Required evidence documents must be uploaded
- Learning material must cover ≥50% of curriculum

#### Task 4.2: Add Section Completion Tracking
**File**: `/src/components/institution/ReadinessFormFullPage.tsx`

Implement section completion tracking:
- Calculate completion % per section
- Show progress indicators
- Highlight missing required fields
- Show validation warnings

**File**: `/src/lib/readinessCompletion.ts` - Utility functions for completion calculation

#### Task 4.3: Integrate Document Vault with Form (Evidence Management)
**File**: `/src/components/institution/ReadinessFormFullPage.tsx`

Enable inline document management per Form 5 evidence requirements:
- **Select existing documents**: Show document vault selector within form
- **Upload new documents**: Allow file upload directly in form (no navigation away)
- **Preview documents**: Show preview before submission
- **Link documents to specific criteria**: Tag documents to specific Form 5 criteria (e.g., "3.2.1_CIPC_Proof", "3.3.1_Property_Ownership")
- **Document validation**: 
  - Check document types match requirement (e.g., CIPC proof must be PDF/image)
  - Verify document dates (e.g., OHS audit ≤12 months, facilitator certs ≤6 months)
  - Check lease agreements are not expired

**File**: `/src/components/institution/DocumentVaultSelector.tsx` - Component for selecting from vault
**File**: `/src/components/institution/InlineDocumentUpload.tsx` - Component for uploading inline
**File**: `/src/components/institution/CriterionEvidenceManager.tsx` - Component for managing evidence per criterion

**API Endpoints**:
- `GET /api/institutions/documents/vault` - List available documents
- `POST /api/institutions/readiness/[readinessId]/documents` - Upload and link document
- `POST /api/institutions/readiness/[readinessId]/documents/link` - Link existing document
- `POST /api/institutions/readiness/[readinessId]/documents/validate` - Validate document against criterion requirements

#### Task 4.4: Add Form 5 Submission Validation
**File**: `/src/components/institution/ReadinessFormFullPage.tsx`

Before allowing submission (`SUBMITTED` status), validate according to Form 5 requirements:
- **Section 2**: All qualification information fields completed
- **Section 3.1**: Self-assessment completed with mandatory remarks
- **Section 3.2**: Registration type selected, all mandatory evidence uploaded (CIPC proof, Tax PIN, SAQA if applicable)
- **Section 3.3** (if Face-to-Face or Hybrid/Blended):
  - Property & premises evidence uploaded
  - Organogram uploaded
  - At least one facilitator added with all required documents (ID, CV, qualifications, contract)
  - Non-SA facilitators have SAQA evaluation, work permit, visa/passport
- **Section 3.4**: Knowledge module resources documented
- **Section 3.5**: Practical module resources documented
- **Section 3.6**: WBL agreement uploaded with all required components
- **Section 4** (if Hybrid/Blended): All LMS requirements documented
- **Section 5** (if Mobile Unit): All mobile unit requirements documented
- **Section 6**: LMIS functional and POPIA compliant
- **Section 7**: All mandatory policies uploaded
- **Section 8**: All OHS requirements met (fire extinguishers, exits, evacuation plan, OHS audit ≤12 months, etc.)
- **Section 9**: Learning material exists and covers ≥50% of curriculum

**Validation Rules**:
- Yes/No responses require mandatory remarks
- Required evidence documents must be uploaded per criterion
- Document dates must be valid (e.g., OHS audit ≤12 months, facilitator certs ≤6 months)
- Lease agreements must not be expired
- Learning material coverage must be ≥50%

Show clear validation errors grouped by section if submission is blocked.

#### Task 4.5: Enhance Institution Detail Page (Read-only View)
**File**: `/src/app/institution/readiness/[readinessId]/page.tsx`

When status is not editable, show:
- Clear display of QCTO feedback (if `RETURNED_FOR_CORRECTION`)
- Document flags with reasons
- Section reviews/ratings (if available)
- Review history

---

### Phase 5: API Enhancements

#### Task 5.1: Update Review API Endpoint (Form 5 Section 10)
**File**: `/src/app/api/qcto/readiness/[readinessId]/review/route.ts`

Enhance to support Form 5 Section 10 requirements:
- Criterion reviews (create `ReadinessSectionReview` records with Yes/No + mandatory remarks)
- Document flagging (create `DocumentFlag` records)
- Learning material verification (coverage ≥50%, NQF alignment, etc.)
- Final recommendation (Section 10):
  - Recommendation: "RECOMMENDED" or "NOT_RECOMMENDED"
  - Verifier remarks (mandatory)
  - SME name (required)
  - SME signature (required - store as file reference or base64)
  - Verification date (auto-set)
- Structured return reasons
- Internal review notes

**Validation**:
- Final recommendation can only be set by verifiers (QCTO_SUPER_ADMIN, QCTO_ADMIN, or assigned reviewers)
- SME name and signature required for final recommendation
- Verifier remarks mandatory for final recommendation

#### Task 5.2: Create Institution Stats API
**File**: `/src/app/api/qcto/institutions/[institutionId]/readiness-stats/route.ts`

Create endpoint that returns:
- Previous submissions count
- Approved vs rejected history
- Existing approved qualifications
- Years active

#### Task 5.3: Create Trust Score Calculation Service
**File**: `/src/lib/institutionTrustScore.ts`

Implement trust score calculation:
- Fetch institution's readiness history
- Calculate metrics:
  - Submission completeness average
  - Approval success rate
  - Return frequency
  - Average reviewer confidence
- Calculate score (0-100)
- Determine trend (compare to previous calculation)
- Store in `InstitutionTrustScore` model

**API Endpoint**: `GET /api/qcto/institutions/[institutionId]/trust-score`

#### Task 5.4: Create Document Management APIs
**Files**:
- `/src/app/api/qcto/readiness/[readinessId]/documents/[documentId]/flag/route.ts`
- `/src/app/api/qcto/readiness/[readinessId]/documents/[documentId]/verify/route.ts`
- `/src/app/api/institutions/readiness/[readinessId]/documents/route.ts`
- `/src/app/api/institutions/readiness/[readinessId]/documents/link/route.ts`

#### Task 5.5: Create Completion Calculation API
**File**: `/src/app/api/institutions/readiness/[readinessId]/completion/route.ts`

Calculate and return:
- Overall completion %
- Per-section completion %
- Missing required fields
- Validation warnings

---

### Phase 6: Audit & Traceability

#### Task 6.1: Ensure All Actions Are Audited
Verify that all new actions create audit log entries:
- Section reviews
- Document flags
- Document verification
- Trust score updates
- Return for correction

**File**: `/src/lib/api/mutateWithAudit.ts` - Ensure all mutations use this

#### Task 6.2: Add Review History Display
**File**: `/src/components/qcto/readiness/ReviewHistory.tsx`

Create component showing:
- All review actions (from audit logs)
- Reviewer identities
- Timestamps
- Status changes
- Document flags
- Section reviews

---

### Phase 7: Learner Data Context (Cleanup)

#### Task 7.1: Remove Irrelevant Learner Data
**Files**: All readiness-related pages

Ensure learner data only appears when relevant:
- If shown: Show aggregate counts with explanation
- If irrelevant: Hide completely
- Never show unexplained "1 learner submission"

**Action**: Review all readiness pages and remove or contextualize learner data displays.

---

### Phase 8: UI/UX Polish

#### Task 8.1: Apply Consistent Design System
Use existing design patterns from the codebase:
- Card components from `@/components/ui/card`
- Badge components for statuses
- Consistent spacing and typography
- Color scheme aligned with existing pages

#### Task 8.2: Add Loading States
Ensure all async operations show loading states:
- Skeleton loaders for data fetching
- Button loading states for form submissions
- Progress indicators for file uploads

#### Task 8.3: Add Error Handling
- Display user-friendly error messages
- Handle API errors gracefully
- Show validation errors inline

#### Task 8.4: Add Success Feedback
- Toast notifications for successful actions
- Confirmation dialogs for destructive actions
- Clear success states after submission

---

### Phase 9: Testing & Validation

#### Task 9.1: Test QCTO Visibility Rules
- Verify QCTO cannot see `NOT_STARTED` or `IN_PROGRESS` records
- Test filtering in listing page
- Test direct URL access to draft records (should 404)

#### Task 9.2: Test Submission Flow
- Test institution can submit readiness
- Verify qualification context becomes immutable after submission
- Test validation prevents incomplete submissions

#### Task 9.3: Test Review Flow
- Test QCTO can review submitted records
- Test section reviews are saved
- Test document flagging works
- Test return for correction flow

#### Task 9.4: Test Document Management
- Test inline document upload
- Test document vault selection
- Test document preview
- Test document flagging and verification

---

## Implementation Order

1. **Phase 1** (Database) - Foundation
2. **Phase 2** (Visibility Rules) - Critical security requirement
3. **Phase 5** (APIs) - Backend support
4. **Phase 3** (QCTO Review) - Core review experience
5. **Phase 4** (Institution Submission) - Submission experience
6. **Phase 6** (Audit) - Compliance
7. **Phase 7** (Cleanup) - Data hygiene
8. **Phase 8** (Polish) - UX improvements
9. **Phase 9** (Testing) - Validation

---

## Key Design Principles

1. **Strict Visibility**: QCTO must NEVER see drafts (`NOT_STARTED` or `IN_PROGRESS`)
2. **Form 5 Compliance**: All sections, criteria, and evidence requirements match official Form 5 structure
3. **Delivery Mode Logic**: Sections show/hide based on delivery mode (Face-to-Face, Hybrid/Blended, Mobile Unit)
4. **Yes/No + Mandatory Remarks**: Each criterion requires Yes/No response with mandatory remarks per Form 5
5. **Evidence Validation**: Documents validated against Form 5 requirements (dates, types, completeness)
6. **Immutability**: Qualification information locked after submission
7. **Context-Rich**: QCTO reviewers need full institution history and trust score
8. **Actionable**: Clear review tools (per-criterion reviews, document flagging, learning material verification)
9. **Traceable**: All actions audited with full review history
10. **User-Friendly**: Inline document management, clear validation, section completion tracking
11. **Final Recommendation**: Section 10 requires verifier signature and SME name per Form 5

---

## Form 5 Criteria to Database Mapping Reference

### Section 2: Qualification Information
- `qualification_title` (existing)
- `nqf_level` (existing)
- `credits` (new - required)
- `saqa_id` (existing)
- `curriculum_code` (existing)

### Section 3.1: Self-Assessment
- `self_assessment_completed` (existing Boolean?)
- `self_assessment_remarks` (existing String? @db.Text) - **Mandatory if completed**

### Section 3.2: Registration & Legal Compliance
- `registration_type` (existing String?) - Must be one of: Private Company, Close Corporation, NPO/NGO, CET/TVET, University, Public Institution
- `professional_body_registration` (existing Boolean?)
- **Mandatory Documents**:
  - CIPC/Registration Proof
  - Valid Tax Compliance PIN or SARS Exemption
  - SAQA registration (if Professional Body)

### Section 3.3: Face-to-Face/Physical Delivery Readiness (Conditional)
- 3.3.1 Property & Premises:
  - `training_site_address` (existing String? @db.Text)
  - `ownership_type` (existing String?) - "OWNED" or "LEASED"
  - **Mandatory Documents**: Proof of ownership OR valid lease agreement (not expired)
- 3.3.2 Human Resource Capacity (Management):
  - **Mandatory Documents**: Organogram, Quality assurance processes, Monitoring tools
- 3.3.3 Facilitators (Human Resources):
  - `Facilitator` model (new) - Multiple facilitators per readiness
  - **Mandatory Documents per Facilitator**: ID/Passport, Qualifications, CVs (within 6 months)
  - **Non-SA Facilitators**: SAQA evaluation, valid work permit, valid visa/passport
- 3.3.4 Facilitator Contracts:
  - `Facilitator.contract_document_id` (new)
  - **Requirements**: Employment contract or SLA, signed by all parties, clear job responsibilities

### Section 3.4: Physical Resources – Knowledge Module
- `number_of_training_rooms` (existing Int?)
- `room_capacity` (existing Int?)
- `facilitator_learner_ratio` (existing String?)
- **Mandatory Documents**: Furniture & equipment checklist, Inventory lists, Resource checklist aligned to curriculum

### Section 3.5: Practical Module Resources
- **Mandatory Documents**: Workshop/simulation venue details, Tools/equipment/consumables inventory, Practical inventory lists, Alignment with curriculum requirements

### Section 3.6: Workplace-Based Learning (WBL)
- `wbl_workplace_partner_name` (existing String?)
- `wbl_agreement_type` (existing String?)
- `wbl_agreement_duration` (existing String?)
- `wbl_components_covered` (existing String? @db.Text)
- `wbl_learner_support_description` (existing String? @db.Text)
- `wbl_assessment_responsibility` (existing String?)
- **Mandatory Documents**: MoU/SLA/Partnership Agreement, Logbooks, Workplace monitoring schedule, Learner support mechanism

### Section 4: Hybrid/Blended Delivery Mode (Conditional)
- 4.1 Online Delivery Management:
  - `lms_name` (existing String?)
  - `internet_connectivity_method` (existing String?)
  - `isp` (existing String?)
  - `backup_frequency` (existing String?)
  - `data_storage_description` (existing String? @db.Text)
  - `security_measures_description` (existing String? @db.Text)
  - **Mandatory Documents**: LMS licence proof, ISP contract, Data backup process documentation
- 4.2 Knowledge Module via LMS:
  - **Requirements**: Learning content loaded, Formative assessments, Moderation processes, Learner communication tools, Digital library, Webinar tools
- 4.3 Practical Module via LMS:
  - **Requirements**: Practical content loaded, Practical assessments, Moderation access
- 4.4 Workplace Module via LMS:
  - **Requirements**: Workplace assessment process, Moderation access

### Section 5: Mobile Unit Delivery Mode (Conditional)
- **Mandatory Documents**: Proof of mobile unit ownership, Capacity documentation, Inventory lists (knowledge & practical), Accredited scope confirmation, Learner uptake justification, Practical implementation plan

### Section 6: Learner Management Information System (LMIS)
- `lmis_functional` (new Boolean?)
- `lmis_popia_compliant` (new Boolean?)
- `lmis_data_storage_description` (new String? @db.Text)
- `lmis_access_control_description` (new String? @db.Text)

### Section 7: Policies & Procedures
- `policies_procedures_notes` (existing String? @db.Text)
- **Mandatory Policies**: Finance, HR, Teaching & Learning, Assessment (QCTO-aligned), Appeals, Refund Policy, OHS
- **Learner Support**: Before/during/after training, Career pathway mapping

### Section 8: Occupational Health & Safety (OHS)
- `fire_extinguisher_available` (existing Boolean?)
- `fire_extinguisher_service_date` (existing DateTime?) - Must be within service period
- `emergency_exits_marked` (existing Boolean?)
- `accessibility_for_disabilities` (existing Boolean?)
- `first_aid_kit_available` (existing Boolean?)
- `ohs_representative_name` (existing String?)
- **Mandatory Documents**: Evacuation plans, OHS audit report (≤12 months), OHS appointment letter

### Section 9: Learning Material
- `learning_material_exists` (existing Boolean?)
- `learning_material_coverage_percentage` (new Int?) - **Must be ≥50%**
- `learning_material_nqf_aligned` (new Boolean?)
- `knowledge_components_complete` (new Boolean?)
- `practical_components_complete` (new Boolean?)
- `learning_material_quality_verified` (new Boolean?)
- `knowledge_module_coverage` (existing Int?) - Percentage
- `practical_module_coverage` (existing Int?) - Percentage
- `curriculum_alignment_confirmed` (existing Boolean?)

### Section 10: Final Recommendation (Verifier Only)
- `ReadinessRecommendation.recommendation` - "RECOMMENDED" or "NOT_RECOMMENDED"
- `ReadinessRecommendation.verifier_remarks` - Mandatory
- `ReadinessRecommendation.sme_name` - Required
- `ReadinessRecommendation.sme_signature` - Required
- `ReadinessRecommendation.verification_date` - Auto-set

---

## Notes

- All new database fields should be nullable to support existing records
- Migration should include data backfill where needed
- Consider performance for trust score calculation (may need caching)
- Document preview may require external service integration
- Section completion calculation should be efficient (avoid N+1 queries)
- **Document Date Validation**: 
  - OHS audit reports must be ≤12 months old
  - Facilitator certifications must be ≤6 months old
  - Lease agreements must not be expired
- **Learning Material Coverage**: Must be ≥50% per Form 5 Section 9
- **Delivery Mode Conditional Logic**: Must be enforced in both UI and API validation
- **Yes/No + Mandatory Remarks**: Every criterion response requires mandatory remarks per Form 5

---

## Success Criteria

✅ **Form 5 Compliance**:
- All sections match official Form 5 structure (Sections 2, 3.1-3.6, 4, 5, 6, 7, 8, 9, 10)
- Delivery mode conditional logic works correctly
- Yes/No responses with mandatory remarks per criterion
- Learning material verification (≥50% coverage) enforced
- Final recommendation (Section 10) requires verifier signature and SME name

✅ **QCTO Review Experience**:
- QCTO reviewers can review all submitted information properly
- Per-criterion Yes/No reviews with mandatory remarks
- Document flagging with reasons
- Learning material verification workflow
- Final recommendation with signature capture
- Reduced "Returned" submissions due to missing documentation

✅ **Institution Submission Experience**:
- Institution users can submit complete applications without leaving form
- Inline document management (upload/select from vault)
- Section completion tracking with progress indicators
- Clear validation prevents incomplete submissions
- Evidence documents linked to specific criteria

✅ **System Requirements**:
- Draft records completely invisible to QCTO
- Clear audit trail of review decisions
- Higher submission quality scores over time
- QCTO has full context (institution history, trust score, documents)
- All Form 5 evidence requirements validated
