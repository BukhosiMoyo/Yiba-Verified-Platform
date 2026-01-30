# QCTO Data Access Enhancement - Implementation Prompt

## Overview
This document provides a comprehensive implementation guide for enhancing QCTO's ability to request and view institution data including **teachers/facilitators and their qualifications**, **student lists with full information**, **grades/marks/assessment results**, and **attendance data**. This ensures QCTO can properly monitor and evaluate institutional compliance and quality.

### Key Feature: Document Profile Linking
**QCTO can request documents separately**, and these documents can be **automatically linked to user profiles (facilitators, learners) by default even if sent separately** from main submissions. This ensures documents remain associated with the correct user profiles regardless of how they are submitted.

---

## Current State Analysis

### What QCTO Can Currently Access

#### ✅ Available:
1. **Readiness Records** (Form 5):
   - Via `/qcto/readiness` - Dedicated Form 5 review interface
   - Via `/qcto/submissions` - If linked to submissions
   - Shows facilitator information within readiness records

2. **Learners** (Basic Info Only):
   - Via `/qcto/learners/[learnerId]` - Basic learner profile
   - Shows: name, national ID, birth date, gender, nationality, home language
   - **Missing**: Grades, marks, assessment results, academic history

3. **Enrolments** (With Attendance):
   - Via `/qcto/enrolments/[enrolmentId]` - Enrolment details
   - Shows: qualification, dates, status, **attendance records**, attendance percentage
   - **Missing**: Grades, marks, assessment results, module completion

4. **Documents**:
   - Via submissions/requests
   - Can flag and verify documents
   - **Note**: QCTO can request documents separately, and documents can be linked to user profiles (facilitators, learners) by default even if sent separately

5. **Institutions**:
   - Via `/qcto/institutions/[institutionId]` - Institution profile
   - Shows: basic info, readiness records, submissions, requests

#### ❌ Missing:
1. **Facilitators/Teachers as Standalone Resources**:
   - No `FACILITATOR` resource type in `SubmissionResourceType`
   - Facilitators only visible within readiness records (Form 5)
   - Cannot request facilitator data separately
   - Cannot view facilitator qualifications, experience, certifications independently

2. **Grades/Marks/Assessment Results**:
   - No grades/marks data model
   - No assessment results tracking
   - No academic performance metrics
   - No module completion tracking with grades

3. **Enhanced Learner Data**:
   - Missing academic history
   - Missing assessment results
   - Missing module grades
   - Missing certification/completion status

4. **Facilitator Management Interface**:
   - No dedicated page to view all facilitators for an institution
   - No way to request facilitator qualifications
   - No facilitator verification workflow

5. **Document Linking to User Profiles**:
   - Documents cannot be directly linked to Facilitator profiles via Document model
   - `DocumentRelatedEntity` enum missing `FACILITATOR` option
   - Documents requested separately cannot be automatically linked to facilitator/learner profiles

---

## Required Enhancements

### Phase 1: Add Facilitator Resource Type & Access

#### Task 1.1: Extend SubmissionResourceType Enum
**File**: `prisma/schema.prisma`

**Current Enum:**
```prisma
enum SubmissionResourceType {
  READINESS
  LEARNER
  ENROLMENT
  DOCUMENT
  INSTITUTION
}
```

**Required Change:**
```prisma
enum SubmissionResourceType {
  READINESS
  LEARNER
  ENROLMENT
  DOCUMENT
  INSTITUTION
  FACILITATOR  // NEW: For requesting facilitator data
}
```

#### Task 1.1b: Extend DocumentRelatedEntity Enum for Facilitator Linking
**File**: `prisma/schema.prisma`

**Current Enum:**
```prisma
enum DocumentRelatedEntity {
  INSTITUTION
  LEARNER
  READINESS
  ENROLMENT
  ATTENDANCE_RECORD
}
```

**Required Change:**
```prisma
enum DocumentRelatedEntity {
  INSTITUTION
  LEARNER
  READINESS
  ENROLMENT
  ATTENDANCE_RECORD
  FACILITATOR  // NEW: For linking documents to facilitator profiles
}
```

**Also Update Document Model:**
```prisma
model Document {
  // ... existing fields ...
  facilitator  Facilitator? @relation("DocumentFacilitator", fields: [related_entity_id], references: [facilitator_id], map: "fk_doc_facilitator")
  // ... existing relations ...
}
```

**And Update Facilitator Model:**
```prisma
model Facilitator {
  // ... existing fields ...
  documents    Document[] @relation("DocumentFacilitator")
  // ... existing relations ...
}
```

**Purpose**: This allows documents to be linked directly to facilitator profiles, enabling QCTO to request documents separately and have them automatically linked to facilitator profiles even if sent separately from readiness submissions.

#### Task 1.2: Create Facilitator Listing & Detail Pages for QCTO
**Files:**
- `/src/app/qcto/facilitators/page.tsx` (new) - List facilitators
- `/src/app/qcto/facilitators/[facilitatorId]/page.tsx` (new) - Facilitator detail

**Requirements:**
- List all facilitators from institutions QCTO can access (via APPROVED submissions/requests)
- Show facilitator details:
  - Name, ID number, qualifications
  - Industry experience
  - Certifications (with expiry dates)
  - Contract/SLA information
  - Linked documents (CV, qualifications, ID, work permits)
  - Associated readiness records
- Filter by institution, qualification area, certification status
- Search by name, ID number, qualifications

**API Endpoints:**
- `GET /api/qcto/facilitators` - List facilitators (with QCTO access control)
- `GET /api/qcto/facilitators/[facilitatorId]` - Get facilitator details

#### Task 1.3: Enhance QCTO Request System for Facilitators
**File**: `/src/app/api/qcto/requests/route.ts`

**Requirements:**
- Allow QCTO to request facilitator data via QCTORequest
- Support `resource_type: "FACILITATOR"` in request resources
- When approved, QCTO can access facilitator details

**UI Enhancement:**
- Add "Request Facilitator Data" option when creating QCTO requests
- Allow selecting specific facilitators or "all facilitators" for an institution

#### Task 1.4: Enhance Document Request System for User Profile Linking
**Files:**
- `/src/app/api/qcto/requests/route.ts` - Support document requests with profile linking
- `/src/app/api/institutions/requests/[requestId]/route.ts` - Handle document linking on approval

**Requirements:**
- QCTO can request documents separately (not just as part of submissions)
- When requesting documents, allow specifying target entity:
  - Link to facilitator profile (`related_entity: "FACILITATOR"`, `related_entity_id: facilitator_id`)
  - Link to learner profile (`related_entity: "LEARNER"`, `related_entity_id: learner_id`)
  - Link to readiness record (`related_entity: "READINESS"`, `related_entity_id: readiness_id`)
  - Link to institution (`related_entity: "INSTITUTION"`, `related_entity_id: institution_id`)
- When institution approves document request, documents are automatically linked to specified profiles
- Documents can be linked to user profiles by default even if sent separately from main submissions

**API Enhancement:**
- Extend `CreateQCTORequestBody` to support document requests with `link_to_profile` option:
```typescript
type CreateQCTORequestBody = {
  // ... existing fields ...
  resources?: Array<{
    resource_type: "DOCUMENT" | "FACILITATOR" | "LEARNER" | ...;
    resource_id_value: string;
    link_to_profile?: {
      entity_type: "FACILITATOR" | "LEARNER" | "READINESS" | "INSTITUTION";
      entity_id: string;
    };
  }>;
};
```

**UI Enhancement:**
- When creating document requests, show option to "Link to Profile"
- Allow selecting target entity (facilitator, learner, etc.)
- Display linked documents on facilitator/learner detail pages

---

### Phase 2: Add Grades/Marks/Assessment Results

#### Task 2.1: Create Assessment/Grade Data Models
**File**: `prisma/schema.prisma`

**New Models Required:**

```prisma
/**
 * Assessment
 * Tracks assessments/exams for enrolments (knowledge tests, practical assessments, etc.)
 */
model Assessment {
  assessment_id        String   @id @default(uuid())
  enrolment_id         String
  assessment_type      String   // "KNOWLEDGE", "PRACTICAL", "PORTFOLIO", "FINAL_EXAM"
  assessment_name      String
  assessment_date      DateTime
  total_marks          Int?     // Total possible marks
  passing_marks        Int?     // Minimum marks to pass
  created_at           DateTime @default(now())
  updated_at           DateTime @updatedAt
  deleted_at           DateTime?
  
  enrolment            Enrolment @relation(fields: [enrolment_id], references: [enrolment_id])
  results              AssessmentResult[]
  
  @@index([enrolment_id])
  @@index([assessment_date])
}

/**
 * AssessmentResult
 * Stores individual assessment results (marks, grades, pass/fail)
 */
model AssessmentResult {
  result_id            String   @id @default(uuid())
  assessment_id        String
  module_name          String?  // Optional: specific module/unit
  marks_obtained       Int?     // Actual marks obtained
  percentage           Decimal? // Percentage score
  grade                String?  // Letter grade (A, B, C, D, F, etc.)
  passed               Boolean? // Pass/fail status
  remarks              String?  @db.Text
  assessed_by          String?  // Facilitator/assessor user_id
  assessed_at          DateTime?
  created_at           DateTime @default(now())
  updated_at           DateTime @updatedAt
  
  assessment           Assessment @relation(fields: [assessment_id], references: [assessment_id])
  assessedByUser       User?      @relation("UserAssessed", fields: [assessed_by], references: [user_id])
  
  @@index([assessment_id])
  @@index([assessed_by])
}

/**
 * ModuleCompletion
 * Tracks completion of curriculum modules/units with grades
 */
model ModuleCompletion {
  completion_id        String   @id @default(uuid())
  enrolment_id         String
  module_name          String
  module_code          String?
  module_type          String   // "KNOWLEDGE", "PRACTICAL", "WBL"
  completion_date      DateTime?
  status               String   // "NOT_STARTED", "IN_PROGRESS", "COMPLETED", "FAILED"
  final_grade          String?  // Overall grade for the module
  marks_obtained       Int?
  percentage           Decimal?
  facilitator_id       String?  // Facilitator who assessed
  notes                String?  @db.Text
  created_at           DateTime @default(now())
  updated_at           DateTime @updatedAt
  
  enrolment            Enrolment @relation(fields: [enrolment_id], references: [enrolment_id])
  facilitator          Facilitator? @relation(fields: [facilitator_id], references: [facilitator_id])
  
  @@index([enrolment_id])
  @@index([facilitator_id])
  @@index([status])
}
```

#### Task 2.2: Enhance Enrolment Detail Page with Grades
**File**: `/src/app/qcto/enrolments/[enrolmentId]/page.tsx`

**Requirements:**
- Add "Assessment Results" section showing:
  - All assessments for the enrolment
  - Marks obtained, percentages, grades
  - Pass/fail status
  - Assessment dates
  - Assessor information
- Add "Module Completion" section showing:
  - All modules/units
  - Completion status
  - Final grades per module
  - Completion dates
- Add "Academic Summary" card:
  - Overall average/percentage
  - Total assessments completed
  - Modules completed vs total
  - Certification eligibility status

#### Task 2.3: Enhance Learner Detail Page with Academic History
**File**: `/src/app/qcto/learners/[learnerId]/page.tsx`

**Requirements:**
- Add "Academic History" section:
  - All enrolments for the learner
  - Qualifications enrolled in
  - Overall performance across enrolments
  - Certifications earned
- Add "Assessment Summary" across all enrolments:
  - Total assessments taken
  - Average performance
  - Pass rate
- Link to detailed enrolment pages for each qualification

---

### Phase 3: Facilitator Management & Qualifications

#### Task 3.1: Create Facilitator Listing Page for QCTO
**File**: `/src/app/qcto/facilitators/page.tsx` (new)

**Requirements:**
- List all facilitators from accessible institutions
- Table columns:
  - Name
  - ID Number
  - Institution
  - Qualifications
  - Certifications (with expiry status)
  - Associated Readiness Records
  - Status (Active/Inactive)
- Filters:
  - By institution
  - By qualification area
  - By certification status (valid/expired)
  - By readiness record association
- Search by name, ID, qualifications
- Link to facilitator detail page

#### Task 3.2: Create Facilitator Detail Page for QCTO
**File**: `/src/app/qcto/facilitators/[facilitatorId]/page.tsx` (new)

**Requirements:**
- Display comprehensive facilitator information:
  - Personal details (name, ID, nationality)
  - Qualifications (with documents)
  - Industry experience
  - Certifications (with expiry dates, renewal status)
  - Contract/SLA information
  - Work permit/visa (if non-SA)
  - SAQA evaluation (if non-SA)
- Show linked documents:
  - CV
  - Qualifications
  - ID/Passport
  - Work permits
  - Contracts
- Show associated readiness records:
  - List all readiness records where this facilitator is listed
  - Link to Form 5 review pages
- Show learners taught (if available):
  - Enrolments where this facilitator is assigned
  - Performance metrics (if available)

#### Task 3.3: Create Facilitator API Endpoints
**Files:**
- `/src/app/api/qcto/facilitators/route.ts` (new) - List facilitators
- `/src/app/api/qcto/facilitators/[facilitatorId]/route.ts` (new) - Get facilitator details

**Requirements:**
- Apply QCTO access control (submission/request-based)
- Filter facilitators by:
  - Institution (via province filtering)
  - Approval status (only from APPROVED submissions/requests)
- Include related data:
  - Qualifications
  - Certifications
  - Documents
  - Associated readiness records
  - Enrolments (if facilitator is assigned)

---

### Phase 4: Enhanced QCTO Request System

#### Task 4.1: Add Facilitator Request Support
**File**: `/src/app/api/qcto/requests/route.ts`

**Requirements:**
- Support `resource_type: "FACILITATOR"` in request creation
- Allow requesting:
  - Specific facilitators (by facilitator_id)
  - All facilitators for an institution
  - Facilitators by qualification area
  - Facilitators by certification type

#### Task 4.2: Create Request Facilitator UI
**File**: `/src/components/qcto/CreateFacilitatorRequestForm.tsx` (new)

**Requirements:**
- Form to create facilitator data requests
- Options:
  - Request all facilitators for institution
  - Request specific facilitators (with search/select)
  - Request by qualification area
  - Request by certification type
- Integration with QCTORequest creation API

#### Task 4.3: Enhance Document Request with Profile Linking
**File**: `/src/components/qcto/CreateDocumentRequestForm.tsx` (new)

**Requirements:**
- Form to create document requests
- Options:
  - Request specific documents (by document_id)
  - Request documents by type (CV, qualifications, contracts, etc.)
  - Request all documents for an institution
- **Profile Linking Feature**:
  - Option to "Link to Profile" when requesting documents
  - Select target entity type (Facilitator, Learner, Readiness, Institution)
  - Select specific entity (facilitator, learner, etc.)
  - Documents will be automatically linked when institution approves
- Display preview of what will be linked

#### Task 4.4: Create Document Linking Handler on Request Approval
**File**: `/src/app/api/institutions/requests/[requestId]/route.ts`

**Requirements:**
- When institution approves a QCTORequest with documents that have `link_to_profile`:
  - Automatically create Document records with correct `related_entity` and `related_entity_id`
  - Link documents to specified facilitator/learner/readiness/institution profiles
  - Update facilitator/learner detail pages to show linked documents
- Handle bulk document linking
- Provide audit trail for document linking

#### Task 4.5: Enhance Institution Detail Page with Request Actions
**File**: `/src/app/qcto/institutions/[institutionId]/page.tsx`

**Requirements:**
- Add "Request Data" section with buttons:
  - "Request Facilitator Data"
  - "Request Learner Data"
  - "Request Documents" (with profile linking option)
  - "Request Assessment Results"
  - "Request All Data"
- Show existing requests for the institution
- Quick actions to create common request types
- Display linked documents on facilitator/learner cards

---

### Phase 5: Assessment Results & Grades Display

#### Task 5.1: Create Assessment Results Component
**File**: `/src/components/qcto/AssessmentResultsDisplay.tsx` (new)

**Requirements:**
- Display assessment results in a table/card format
- Show:
  - Assessment name, type, date
  - Marks obtained / total marks
  - Percentage
  - Grade
  - Pass/fail status
  - Assessor information
- Group by assessment type
- Show trends over time (if multiple assessments)
- Export functionality

#### Task 5.2: Create Module Completion Component
**File**: `/src/components/qcto/ModuleCompletionDisplay.tsx` (new)

**Requirements:**
- Display module completion status
- Show:
  - Module name, code, type
  - Completion status
  - Final grade
  - Completion date
  - Facilitator who assessed
- Progress indicators
- Completion percentage

#### Task 5.3: Create Academic Summary Component
**File**: `/src/components/qcto/AcademicSummaryCard.tsx` (new)

**Requirements:**
- Overall academic performance summary
- Metrics:
  - Average percentage across all assessments
  - Total assessments completed
  - Pass rate
  - Modules completed / total modules
  - Certification eligibility
- Visual indicators (progress bars, charts)
- Comparison to qualification requirements

---

### Phase 6: Integration with Existing Systems

#### Task 6.1: Update QCTO Access Control for Facilitators
**File**: `/src/lib/api/qctoAccess.ts`

**Requirements:**
- Add `canReadForQCTO` support for `FACILITATOR` resource type
- Check if facilitator is:
  - Linked to APPROVED submission
  - Linked to APPROVED QCTORequest
  - Part of APPROVED readiness record

#### Task 6.2: Update Navigation
**File**: `/src/lib/navigation.ts`

**Requirements:**
- Add "Facilitators" to QCTO navigation menu
- Add "Assessments" or "Academic Records" section
- Update breadcrumbs for new pages

#### Task 6.3: Update Search
**File**: `/src/lib/search/providers.ts`

**Requirements:**
- Add facilitator search
- Add assessment/grade search (if needed)
- Include facilitators in institution search results

---

## Data Flow & Access Model

### How QCTO Accesses Data

**Current Model (Submission/Request-Based Access):**
1. Institution submits data via Submission (status: APPROVED)
2. OR QCTO requests data via QCTORequest (status: APPROVED)
3. QCTO can then access linked resources

**Enhanced Model:**
1. **Facilitators:**
   - Via APPROVED submissions (if linked)
   - Via APPROVED QCTORequests (if requested)
   - Via APPROVED readiness records (Form 5 facilitators)

2. **Grades/Assessments:**
   - Via APPROVED submissions (if linked)
   - Via APPROVED QCTORequests (if requested)
   - Automatically accessible when enrolment is accessible

3. **Learner Academic Data:**
   - Via APPROVED submissions (if linked)
   - Via APPROVED QCTORequests (if requested)
   - Includes: grades, assessments, module completion

---

## Implementation Priority

### High Priority (Core Functionality)
1. **Phase 1**: Add Facilitator Resource Type & Access
   - Critical for QCTO to verify facilitator qualifications
   - Required for compliance monitoring

2. **Phase 2**: Add Grades/Marks/Assessment Results
   - Essential for quality assurance
   - Required for certification verification

### Medium Priority (Enhanced Features)
3. **Phase 3**: Facilitator Management Interface
   - Improves usability
   - Better organization of facilitator data

4. **Phase 4**: Enhanced QCTO Request System
   - Streamlines data requests
   - Better UX for requesting specific data

### Lower Priority (Polish)
5. **Phase 5**: Assessment Results Display Components
   - Visual enhancements
   - Better data presentation

6. **Phase 6**: Integration & Navigation
   - System-wide consistency
   - Better discoverability

---

## Success Criteria

### Functional Requirements
- ✅ QCTO can request facilitator data via QCTORequest
- ✅ QCTO can view facilitator details with qualifications
- ✅ QCTO can view assessment results and grades
- ✅ QCTO can view module completion status
- ✅ QCTO can view academic history for learners
- ✅ All data access respects submission/request-based access control

### User Experience
- ✅ Clear navigation to facilitator management
- ✅ Easy request creation for specific data types
- ✅ Comprehensive data display (facilitators, grades, assessments)
- ✅ Intuitive filtering and search

### Technical Requirements
- ✅ Proper RBAC enforcement
- ✅ Audit logging for all data access
- ✅ Performance optimized queries
- ✅ Proper error handling

---

## Database Schema Changes Required

### New Models
1. `Assessment` - Tracks assessments/exams
2. `AssessmentResult` - Stores marks/grades
3. `ModuleCompletion` - Tracks module completion with grades

### Enum Updates
1. `SubmissionResourceType` - Add `FACILITATOR`
2. `DocumentRelatedEntity` - Add `FACILITATOR` (for linking documents to facilitator profiles)

### Relations
1. `Enrolment` → `Assessment[]`
2. `Enrolment` → `ModuleCompletion[]`
3. `Facilitator` → `ModuleCompletion[]` (assessor)
4. `Facilitator` → `Document[]` (NEW: for documents linked to facilitator profiles)
5. `User` → `AssessmentResult[]` (assessed_by)

### Model Updates
1. `Document` - Add `facilitator` relation (for linking documents to facilitator profiles)
2. `Facilitator` - Add `documents` relation (reverse of Document.facilitator)

---

## API Endpoints to Create

### Facilitator Endpoints
- `GET /api/qcto/facilitators` - List facilitators
- `GET /api/qcto/facilitators/[facilitatorId]` - Get facilitator details

### Assessment Endpoints
- `GET /api/qcto/enrolments/[enrolmentId]/assessments` - Get assessments for enrolment
- `GET /api/qcto/enrolments/[enrolmentId]/module-completion` - Get module completion
- `GET /api/qcto/learners/[learnerId]/academic-history` - Get academic history

### Document Endpoints
- `GET /api/qcto/facilitators/[facilitatorId]/documents` - Get documents linked to facilitator
- `GET /api/qcto/learners/[learnerId]/documents` - Get documents linked to learner
- `POST /api/qcto/requests/documents/link` - Link documents to profiles (on approval)

### Request Endpoints (Enhancements)
- `POST /api/qcto/requests` - Support FACILITATOR resource type and document profile linking
- `POST /api/qcto/requests/facilitators` - Quick request for facilitator data
- `POST /api/qcto/requests/documents` - Request documents with profile linking option

---

## UI Components to Create

1. **FacilitatorListingPage** - List all facilitators
2. **FacilitatorDetailPage** - View facilitator details (with linked documents)
3. **AssessmentResultsDisplay** - Show assessment results
4. **ModuleCompletionDisplay** - Show module completion
5. **AcademicSummaryCard** - Academic performance summary
6. **CreateFacilitatorRequestForm** - Request facilitator data
7. **CreateDocumentRequestForm** - Request documents with profile linking
8. **FacilitatorResourceCard** - Display facilitator in resource lists
9. **DocumentProfileLinker** - Component for linking documents to profiles on request approval
10. **LinkedDocumentsDisplay** - Show documents linked to facilitator/learner profiles

---

## Testing Checklist

### Facilitator Access
- [ ] QCTO can request facilitator data
- [ ] Institution can approve/reject facilitator requests
- [ ] QCTO can view facilitator details after approval
- [ ] Facilitator qualifications are displayed
- [ ] Facilitator certifications are shown with expiry dates
- [ ] Linked documents are accessible

### Grades & Assessments
- [ ] Assessment results are displayed for enrolments
- [ ] Grades/marks are shown correctly
- [ ] Module completion status is accurate
- [ ] Academic history aggregates correctly
- [ ] Performance metrics calculate correctly

### Access Control
- [ ] QCTO cannot access data without approval
- [ ] Submission/request-based access works correctly
- [ ] Province filtering applies to facilitators
- [ ] Audit logs track all data access

### Document Profile Linking
- [ ] QCTO can request documents separately
- [ ] Documents can be linked to facilitator profiles on request approval
- [ ] Documents can be linked to learner profiles on request approval
- [ ] Linked documents appear on facilitator/learner detail pages
- [ ] Documents linked separately appear even if not part of main submission
- [ ] Document linking is tracked in audit logs

---

## Notes

- **Facilitators** are currently only visible within readiness records (Form 5). This enhancement makes them standalone resources that can be requested and viewed independently.
- **Grades/Assessments** are currently not tracked. This requires new data models and UI components.
- **Academic History** provides a comprehensive view of learner performance across all qualifications.
- **Document Profile Linking**: QCTO can request documents separately, and these documents can be automatically linked to user profiles (facilitators, learners) even if sent separately from main submissions. This is critical for maintaining document associations with user profiles.
- All enhancements must respect existing QCTO access control patterns (submission/request-based).

---

## Next Steps

1. Review and approve this prompt
2. Implement Phase 1 (Facilitator Resource Type)
3. Implement Phase 2 (Grades/Assessment Models)
4. Continue with remaining phases
5. Test all access patterns
6. Gather QCTO user feedback
