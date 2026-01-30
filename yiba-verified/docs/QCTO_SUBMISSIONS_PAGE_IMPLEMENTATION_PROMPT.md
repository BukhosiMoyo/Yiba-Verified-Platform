# QCTO Submissions Page - Implementation & Enhancement Prompt

## Overview
This document provides a comprehensive implementation guide for ensuring the `/qcto/submissions` page is fully functional and properly integrated with the Form 5 Readiness Review System. The submissions page serves as a **general review interface** for all types of submissions (READINESS, COMPLIANCE_PACK, ANNUAL_REPORT, etc.), while `/qcto/readiness` is specifically for Form 5 readiness records.

## Current Understanding

### What is `/qcto/submissions`?
The `/qcto/submissions` page is a **general submissions review interface** that allows QCTO reviewers to:
- View all types of submissions from institutions
- Review submissions of different types (READINESS, COMPLIANCE_PACK, ANNUAL_REPORT, etc.)
- Access linked resources (readiness records, learners, enrolments, documents) through `SubmissionResource` entries
- Review and approve/reject submissions

### Relationship Between Submissions and Readiness Records

**Submissions Model** (`Submission`):
- General container for any type of submission from institutions
- `submission_type`: Can be "READINESS", "COMPLIANCE_PACK", "ANNUAL_REPORT", etc.
- Can contain multiple resources via `SubmissionResource` entries

**SubmissionResource Model**:
- Links resources to submissions
- `resource_type`: "READINESS", "LEARNER", "ENROLMENT", "DOCUMENT", "INSTITUTION"
- `resource_id_value`: The actual ID of the resource (e.g., `readiness_id`)

**Readiness Records** (`Readiness`):
- Specific Form 5 readiness assessments
- Can be reviewed directly via `/qcto/readiness/[readinessId]` (dedicated Form 5 review page)
- Can also be linked to a Submission via `SubmissionResource` (resource_type: "READINESS")

### Current Implementation Status

**Existing Files:**
- `/src/app/qcto/submissions/page.tsx` - Listing page (✅ exists)
- `/src/app/qcto/submissions/[submissionId]/page.tsx` - Detail page (✅ exists)
- `/src/app/api/qcto/submissions/route.ts` - Listing API (✅ exists)
- `/src/app/api/qcto/submissions/[submissionId]/route.ts` - Detail/Review API (✅ exists)
- `/src/components/qcto/SubmissionReviewForm.tsx` - Review form component (✅ exists)

---

## Issues & Gaps to Address

### Issue 1: READINESS Submissions Should Link to Form 5 Review Page
**Problem:** When a submission has `submission_type: "READINESS"` and contains a READINESS resource, QCTO reviewers should be able to navigate directly to the dedicated Form 5 review page (`/qcto/readiness/[readinessId]`).

**Current State:** The submissions detail page shows resources but may not have clear navigation to the Form 5 review page.

**Required Fix:**
- Detect when submission contains READINESS resources
- Add prominent link/button to navigate to `/qcto/readiness/[readinessId]`
- Ensure visibility rules are respected (QCTO cannot see draft readiness records)

### Issue 2: Submission Status vs Readiness Status Synchronization
**Problem:** A Submission with `submission_type: "READINESS"` may have a different status than the linked Readiness record. Need to ensure consistency and clarity.

**Current State:** Submission status and Readiness status are independent.

**Required Fix:**
- Display both Submission status and Readiness status when viewing READINESS submissions
- Show clear relationship between submission and readiness record
- Handle edge cases (e.g., readiness record deleted but submission still exists)

### Issue 3: Visibility Rules for READINESS Resources
**Problem:** When a Submission contains READINESS resources, QCTO should only see readiness records that are not in `NOT_STARTED` or `IN_PROGRESS` status (same visibility rules as `/qcto/readiness`).

**Current State:** May not filter out draft readiness records when displaying resources.

**Required Fix:**
- Filter out draft readiness records (`NOT_STARTED`, `IN_PROGRESS`) when displaying READINESS resources
- Show clear message if all readiness resources are drafts
- Ensure API respects visibility rules

### Issue 4: Enhanced Resource Display for READINESS
**Problem:** When displaying READINESS resources in a submission, should show:
- Qualification title, SAQA ID, NQF level
- Readiness status (with proper badge)
- Link to Form 5 review page
- Completion percentage (if available)

**Current State:** May show basic resource info only.

**Required Fix:**
- Enhance resource display component to show readiness-specific information
- Add visual indicators for readiness status
- Show completion data if available

### Issue 5: Submission Review Form Integration with Readiness
**Problem:** When reviewing a READINESS submission, the review form should:
- Allow reviewers to navigate to Form 5 review page
- Show readiness-specific context
- Potentially sync status changes between Submission and Readiness record

**Current State:** Generic review form may not handle READINESS submissions optimally.

**Required Fix:**
- Enhance `SubmissionReviewForm` to detect READINESS submissions
- Add readiness-specific review actions
- Provide clear navigation to Form 5 review page

---

## Implementation Tasks

### Task 1: Enhance Submissions Detail Page for READINESS Submissions

**File:** `/src/app/qcto/submissions/[submissionId]/page.tsx`

**Requirements:**
1. **Detect READINESS Resources:**
   - Check if submission has `submission_type: "READINESS"` OR contains `SubmissionResource` entries with `resource_type: "READINESS"`
   - Fetch readiness record details for each READINESS resource

2. **Display Readiness Information:**
   - Show qualification title, SAQA ID, NQF level, delivery mode
   - Display readiness status with proper badge
   - Show completion percentage (if `section_completion_data` exists)
   - Display readiness submission date

3. **Add Navigation to Form 5 Review Page:**
   - Add prominent button/link: "Review Form 5 Readiness" → `/qcto/readiness/[readinessId]`
   - Only show if readiness record is not in `NOT_STARTED` or `IN_PROGRESS` status
   - Show warning if readiness record is draft: "Readiness record is still in draft. Review will be available once submitted."

4. **Resource Display Enhancement:**
   - Create `ReadinessResourceCard` component to display readiness resources with:
     - Qualification overview
     - Status badge
     - Completion indicator
     - Link to Form 5 review page
   - Filter out draft readiness records (respect visibility rules)

**Component Structure:**
```tsx
// New component: ReadinessResourceCard
interface ReadinessResourceCardProps {
  readinessId: string;
  submissionId: string;
}

// In submissions detail page:
{submission.submission_type === "READINESS" && readinessResources.length > 0 && (
  <Card>
    <CardHeader>
      <CardTitle>Form 5 Readiness Records</CardTitle>
      <CardDescription>
        Review readiness assessments using the dedicated Form 5 review interface
      </CardDescription>
    </CardHeader>
    <CardContent>
      {readinessResources.map((resource) => (
        <ReadinessResourceCard
          key={resource.resource_id}
          readinessId={resource.resource_id_value}
          submissionId={submission.submission_id}
        />
      ))}
    </CardContent>
  </Card>
)}
```

### Task 2: Enhance Submissions Listing Page

**File:** `/src/app/qcto/submissions/page.tsx`

**Requirements:**
1. **Filter Draft READINESS Submissions:**
   - When submission type is "READINESS", check if linked readiness records are drafts
   - Optionally filter out or mark submissions with only draft readiness records
   - Show indicator if submission contains draft readiness records

2. **Enhanced Display for READINESS Submissions:**
   - Show readiness-specific information in table:
     - Qualification title (if available from linked readiness)
     - Readiness status (if available)
     - Link to Form 5 review page (if readiness is not draft)

3. **Status Synchronization Display:**
   - Show both Submission status and Readiness status for READINESS submissions
   - Use visual indicators to show if statuses are out of sync

**API Enhancement:**
- Update `/api/qcto/submissions/route.ts` to:
  - Include readiness record details for READINESS submissions
  - Filter out submissions that only contain draft readiness records (optional)
  - Respect QCTO visibility rules

### Task 3: Enhance Submission Review Form for READINESS

**File:** `/src/components/qcto/SubmissionReviewForm.tsx`

**Requirements:**
1. **Detect READINESS Submissions:**
   - Check if submission has READINESS resources
   - Fetch readiness record details

2. **Add Readiness-Specific Actions:**
   - Show "Review Form 5 Readiness" button/link (if readiness not draft)
   - Display readiness status and key information
   - Show warning if readiness is still in draft

3. **Status Synchronization:**
   - When reviewing READINESS submission, consider syncing status with readiness record
   - If submission is APPROVED and readiness is SUBMITTED, update readiness to UNDER_REVIEW
   - If submission is REJECTED, consider updating readiness status accordingly

### Task 4: Create Readiness Resource Card Component

**File:** `/src/components/qcto/ReadinessResourceCard.tsx` (new)

**Requirements:**
1. **Display Readiness Information:**
   - Qualification title, SAQA ID, NQF level
   - Delivery mode
   - Readiness status with badge
   - Completion percentage (if available)
   - Submission date

2. **Actions:**
   - "Review Form 5 Readiness" button → `/qcto/readiness/[readinessId]`
   - "View Details" link (if needed)
   - Respect visibility rules (hide if draft)

3. **Visual Design:**
   - Use Card component with readiness-specific styling
   - Show status badge matching readiness status
   - Display completion indicator if available

### Task 5: Update API to Include Readiness Data

**File:** `/src/app/api/qcto/submissions/[submissionId]/route.ts`

**Requirements:**
1. **Include Readiness Records:**
   - When submission has READINESS resources, fetch readiness record details
   - Apply QCTO visibility rules (exclude drafts)
   - Include readiness status, qualification info, completion data

2. **Response Structure:**
```typescript
{
  submission: { ... },
  readinessResources: Array<{
    resource_id: string;
    readiness: {
      readiness_id: string;
      qualification_title: string;
      saqa_id: string;
      nqf_level: number;
      delivery_mode: string;
      readiness_status: string;
      section_completion_data: Json;
      // ... other readiness fields
    } | null; // null if draft (filtered out)
  }>
}
```

### Task 6: Handle Edge Cases

**Requirements:**
1. **Deleted Readiness Records:**
   - If readiness record is soft-deleted, show appropriate message
   - Don't break the page if resource points to deleted record

2. **Multiple Readiness Resources:**
   - Handle submissions with multiple readiness records
   - Display all non-draft readiness records
   - Show count of draft records if any

3. **Status Mismatches:**
   - Handle cases where submission status doesn't match readiness status
   - Show warnings if statuses are inconsistent
   - Provide guidance on how to resolve

---

## Integration with Form 5 Readiness System

### Key Integration Points

1. **Navigation Flow:**
   - QCTO can discover READINESS submissions via `/qcto/submissions`
   - Click "Review Form 5 Readiness" → Navigate to `/qcto/readiness/[readinessId]`
   - Complete Form 5 review using dedicated review interface
   - Return to submissions page if needed

2. **Status Synchronization:**
   - When readiness record is reviewed via `/qcto/readiness/[readinessId]`, consider updating submission status
   - When submission is reviewed, consider updating readiness status if appropriate
   - Maintain clear audit trail for both

3. **Visibility Consistency:**
   - Apply same visibility rules to READINESS resources in submissions as in `/qcto/readiness`
   - QCTO cannot see draft readiness records in either interface
   - Consistent filtering across both pages

---

## Success Criteria

### Functional Requirements
- ✅ READINESS submissions display readiness-specific information
- ✅ Clear navigation to Form 5 review page for non-draft readiness records
- ✅ Draft readiness records are filtered/hidden (respecting visibility rules)
- ✅ Status synchronization between Submission and Readiness record
- ✅ Enhanced resource display shows qualification info, status, completion

### User Experience
- ✅ QCTO reviewers can easily discover and access Form 5 readiness reviews from submissions page
- ✅ Clear visual distinction between READINESS and other submission types
- ✅ Intuitive navigation between submissions and readiness review pages
- ✅ Consistent status display and badges

### Technical Requirements
- ✅ API respects QCTO visibility rules for readiness records
- ✅ Proper error handling for edge cases (deleted records, status mismatches)
- ✅ Performance optimized (efficient queries, proper indexing)
- ✅ All actions are audited

---

## Implementation Order

1. **Task 5**: Update API to include readiness data (foundation)
2. **Task 4**: Create ReadinessResourceCard component (reusable component)
3. **Task 1**: Enhance submissions detail page (main integration)
4. **Task 2**: Enhance submissions listing page (discovery)
5. **Task 3**: Enhance review form (review actions)
6. **Task 6**: Handle edge cases (robustness)

---

## Testing Checklist

### Test 1: READINESS Submission Display
- [ ] Submission with READINESS type shows readiness information
- [ ] Readiness resources are displayed with qualification details
- [ ] Draft readiness records are filtered out
- [ ] "Review Form 5 Readiness" button appears for non-draft records
- [ ] Button navigates to correct readiness review page

### Test 2: Navigation Flow
- [ ] Can navigate from submissions page to readiness review page
- [ ] Can return from readiness review page to submissions page
- [ ] Breadcrumbs/navigation context is preserved

### Test 3: Status Synchronization
- [ ] Submission status and readiness status are both displayed
- [ ] Status changes in readiness review update submission (if applicable)
- [ ] Status changes in submission review update readiness (if applicable)

### Test 4: Visibility Rules
- [ ] Draft readiness records don't appear in submissions
- [ ] Direct access to draft readiness via submission link returns 404
- [ ] API filters out draft readiness records

### Test 5: Edge Cases
- [ ] Deleted readiness records handled gracefully
- [ ] Multiple readiness resources displayed correctly
- [ ] Status mismatches show appropriate warnings

---

## Key Design Principles

1. **Consistency**: Submissions page should feel consistent with readiness review page
2. **Clarity**: Clear distinction between submission types and their review processes
3. **Navigation**: Easy navigation between submissions and dedicated review pages
4. **Visibility**: Same strict visibility rules apply to both interfaces
5. **Context**: Show relevant context (readiness info) when viewing READINESS submissions
6. **Flexibility**: Support both submission-based and direct readiness review workflows

---

## Notes

- The submissions page serves as a **general review interface** for all submission types
- The readiness review page (`/qcto/readiness/[readinessId]`) is the **dedicated Form 5 review interface**
- Both should work together seamlessly, with clear navigation between them
- READINESS submissions should provide easy access to the Form 5 review interface
- Other submission types (COMPLIANCE_PACK, ANNUAL_REPORT) continue to use the generic review form

---

## Next Steps

1. Review this prompt and confirm understanding
2. Implement tasks in the specified order
3. Test all integration points
4. Gather feedback from QCTO reviewers
5. Refine based on real-world usage
