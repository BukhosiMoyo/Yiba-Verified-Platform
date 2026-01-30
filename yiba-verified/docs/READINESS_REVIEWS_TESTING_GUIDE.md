# Form 5 Readiness Review System - Testing Guide

## Overview
This document provides a comprehensive testing checklist for the Form 5 Readiness Submission & QCTO Review System. All tests should be performed to ensure the system meets QCTO requirements and functions correctly.

---

## Phase 9.1: QCTO Visibility Rules Testing

### Test 9.1.1: QCTO Cannot See Draft Records in Listing
**Test Steps:**
1. Log in as QCTO user (`qcto.reviewer2@gmail.com` / `Password123!`)
2. Navigate to `/qcto/readiness`
3. Verify that no records with status `NOT_STARTED` or `IN_PROGRESS` appear in the list
4. Check that status filter dropdown does NOT include `NOT_STARTED` or `IN_PROGRESS` options

**Expected Result:** Only records with status `SUBMITTED`, `UNDER_REVIEW`, `RETURNED_FOR_CORRECTION`, `REVIEWED`, `RECOMMENDED`, or `REJECTED` are visible.

**API Test:**
```bash
# Should only return non-draft records
GET /api/qcto/readiness
# Verify response items all have status NOT in ["NOT_STARTED", "IN_PROGRESS"]
```

### Test 9.1.2: QCTO Cannot Access Draft Records via Direct URL
**Test Steps:**
1. Log in as Institution Admin
2. Create a readiness record with status `NOT_STARTED` or `IN_PROGRESS`
3. Note the `readiness_id`
4. Log out and log in as QCTO user
5. Navigate directly to `/qcto/readiness/[readinessId]` (using the draft record's ID)

**Expected Result:** Should return 404 Not Found page

**API Test:**
```bash
# Should return 404
GET /api/qcto/readiness/[draftReadinessId]
# Response: 404 Not Found
```

### Test 9.1.3: QCTO Filtering Excludes Draft Statuses
**Test Steps:**
1. Log in as QCTO user
2. Navigate to `/qcto/readiness`
3. Open status filter dropdown
4. Verify dropdown only shows: `SUBMITTED`, `UNDER_REVIEW`, `RETURNED_FOR_CORRECTION`, `REVIEWED`, `RECOMMENDED`, `REJECTED`

**Expected Result:** Draft statuses are not available in filter options

---

## Phase 9.2: Submission Flow Testing

### Test 9.2.1: Institution Can Submit Readiness Record
**Test Steps:**
1. Log in as Institution Admin (`admin.bonanieducation10@gmail.com` / `Password123!`)
2. Navigate to readiness form (create new or edit existing with status `NOT_STARTED` or `IN_PROGRESS`)
3. Fill in required fields:
   - Qualification Title, SAQA ID, Curriculum Code, Credits (Section 2)
   - Self-Assessment (Section 3.1)
   - Registration Type (Section 3.2)
4. Click "Submit for QCTO Review"

**Expected Result:**
- Status changes to `SUBMITTED`
- Success toast notification appears
- Qualification fields become locked/disabled
- `submission_date` is set

### Test 9.2.2: Qualification Context Becomes Immutable After Submission
**Test Steps:**
1. Submit a readiness record (as in Test 9.2.1)
2. Try to edit qualification fields:
   - Qualification Title
   - SAQA ID
   - Curriculum Code
   - Credits
   - Delivery Mode
3. Attempt to save changes

**Expected Result:**
- Fields are disabled/grayed out
- If API call is made, should return error: "Qualification information is immutable after submission"
- Form shows warning message about immutability

**API Test:**
```bash
# Should return 400 error
PATCH /api/institutions/readiness/[submittedReadinessId]
Body: { "qualification_title": "Changed Title" }
# Response: 400 - "Qualification information is immutable after submission"
```

### Test 9.2.3: Validation Prevents Incomplete Submissions
**Test Steps:**
1. Log in as Institution Admin
2. Create readiness record with missing required fields:
   - Missing Credits
   - Missing Self-Assessment
   - Learning Material Coverage < 50%
3. Attempt to submit

**Expected Result:**
- Validation errors displayed
- Submission blocked with clear error messages
- Toast notification: "Submission validation failed. Please fix the errors before submitting."

**Validation Checks:**
- Section 2 (Qualification): All fields required
- Section 3.1 (Self-Assessment): Must be completed
- Section 3.2 (Registration): Registration type required
- Section 9 (Learning Material): Coverage must be ≥50%

---

## Phase 9.3: Review Flow Testing

### Test 9.3.1: QCTO Can Review Submitted Records
**Test Steps:**
1. Log in as QCTO user
2. Navigate to a readiness record with status `SUBMITTED` or `UNDER_REVIEW`
3. Verify all review components are visible:
   - Qualification Overview
   - Institution Profile Snapshot
   - Trust Score
   - Full Readiness Content Display
   - Documents & Evidence Viewer
   - Review Helper Panel
   - Review Form

**Expected Result:** All components load and display correctly

### Test 9.3.2: Section Reviews Are Saved
**Test Steps:**
1. Log in as QCTO user
2. Open a readiness record for review
3. In Review Form, add section reviews with:
   - Section name
   - Response (YES/NO)
   - Mandatory remarks
   - Notes
4. Submit review

**Expected Result:**
- Review is saved to `ReadinessSectionReview` table
- Section reviews appear in Review History
- Success toast notification

**API Test:**
```bash
PATCH /api/qcto/readiness/[readinessId]/review
Body: {
  "status": "UNDER_REVIEW",
  "criterion_reviews": [{
    "section_name": "section_3_2_registration",
    "response": "YES",
    "mandatory_remarks": "All registration documents verified"
  }]
}
# Verify ReadinessSectionReview record created
```

### Test 9.3.3: Document Flagging Works
**Test Steps:**
1. Log in as QCTO user
2. Open a readiness record with documents
3. Click "Flag" on a document
4. Enter flag reason
5. Submit flag

**Expected Result:**
- `DocumentFlag` record created
- Document shows "Flagged" badge
- Flag appears in Documents & Evidence Viewer
- Institution can see flag on their detail page

**API Test:**
```bash
POST /api/qcto/readiness/[readinessId]/documents/[documentId]/flag
Body: { "reason": "Document is expired" }
# Verify DocumentFlag created with status "FLAGGED"
```

### Test 9.3.4: Return for Correction Flow
**Test Steps:**
1. Log in as QCTO user
2. Open a readiness record
3. Select "Return" status
4. Select return reasons and add remarks
5. Submit review

**Expected Result:**
- Status changes to `RETURNED_FOR_CORRECTION`
- Institution receives notification
- Institution can see return feedback on their detail page
- Institution can edit and resubmit the record

**API Test:**
```bash
PATCH /api/qcto/readiness/[readinessId]/review
Body: {
  "status": "RETURNED_FOR_CORRECTION",
  "return_reasons": ["Missing documents", "Incomplete information"],
  "return_remarks": "Please provide all required evidence"
}
# Verify status updated and notification sent
```

### Test 9.3.5: Final Recommendation (Form 5 Section 10)
**Test Steps:**
1. Log in as QCTO user
2. Open a readiness record
3. Select "Recommend" or "Reject" status
4. Fill in Final Recommendation tab:
   - Select RECOMMENDED or NOT_RECOMMENDED
   - Enter Verifier Remarks (mandatory)
   - Enter SME Name (mandatory)
   - Upload SME Signature (mandatory)
5. Submit review

**Expected Result:**
- `ReadinessRecommendation` record created/updated with all fields
- Status changes to `RECOMMENDED` or `REJECTED`
- Success toast notification
- Institution can see final recommendation on their detail page

**Validation:**
- Verifier remarks required
- SME name required
- SME signature required
- Cannot submit without all mandatory fields

---

## Phase 9.4: Document Management Testing

### Test 9.4.1: Inline Document Upload
**Test Steps:**
1. Log in as Institution Admin
2. Open readiness form (status `NOT_STARTED` or `IN_PROGRESS`)
3. Use `InlineDocumentUpload` component
4. Select a file (PDF, image, or Word document)
5. Upload document

**Expected Result:**
- File uploads with progress indicator
- Document appears in documents list
- Success toast notification
- Document linked to readiness record

**API Test:**
```bash
POST /api/institutions/readiness/[readinessId]/documents
FormData: { file: File, document_type: "READINESS_EVIDENCE" }
# Verify Document record created
```

### Test 9.4.2: Document Vault Selection
**Test Steps:**
1. Log in as Institution Admin
2. Open readiness form
3. Click "Select from Document Vault"
4. Search for existing document
5. Select document

**Expected Result:**
- Document list loads from vault
- Search functionality works
- Selected document is linked to readiness record
- Success toast notification

**API Test:**
```bash
GET /api/institutions/documents/vault?institutionId=[id]
# Verify returns institution's documents

POST /api/institutions/readiness/[readinessId]/documents/link
Body: { "document_id": "[id]" }
# Verify document linked to readiness
```

### Test 9.4.3: Document Preview
**Test Steps:**
1. Log in as QCTO user
2. Open readiness record with documents
3. Click "Preview" on a document

**Expected Result:**
- Document opens in new tab/window
- PDFs display correctly
- Images display correctly

### Test 9.4.4: Document Flagging and Verification
**Test Steps:**
1. Log in as QCTO user
2. Flag a document (as in Test 9.3.3)
3. Later, click "Verify" on the same document

**Expected Result:**
- Document status changes to "ACCEPTED"
- Flag status changes to "VERIFIED"
- Success toast notification
- Institution can see verification status

**API Test:**
```bash
POST /api/qcto/readiness/[readinessId]/documents/[documentId]/verify
# Verify DocumentFlag status updated to "VERIFIED"
# Verify Document status updated to "ACCEPTED"
```

---

## Phase 9.5: Form 5 Compliance Testing

### Test 9.5.1: All Form 5 Sections Display Correctly
**Test Steps:**
1. Log in as QCTO user
2. Open readiness record
3. Verify all sections in `ReadinessContentDisplay`:
   - Section 2: Qualification Information
   - Section 3.1: Self-Assessment
   - Section 3.2: Registration & Legal Compliance
   - Section 3.3: Physical Delivery (if Face-to-Face or Blended)
   - Section 3.4: Knowledge Module Resources
   - Section 3.5: Practical Module Resources
   - Section 3.6: WBL
   - Section 4: Hybrid/Blended (if Blended)
   - Section 5: Mobile Unit (if Mobile)
   - Section 6: LMIS
   - Section 7: Policies & Procedures
   - Section 8: OHS
   - Section 9: Learning Material

**Expected Result:** All applicable sections display with correct data

### Test 9.5.2: Delivery Mode Conditional Logic
**Test Steps:**
1. Create readiness records with different delivery modes:
   - Face-to-Face
   - Blended
   - Mobile Unit
2. Verify sections show/hide correctly:
   - **Face-to-Face**: Shows 3.3, 3.4, 3.5, 3.6, 6, 7, 8, 9
   - **Blended**: Shows 3.3, 3.4, 3.5, 3.6, 4, 6, 7, 8, 9
   - **Mobile Unit**: Shows 3.4, 3.5, 3.6, 5, 6, 7, 8, 9

**Expected Result:** Sections conditionally display based on delivery mode

### Test 9.5.3: Learning Material Coverage ≥50% Requirement
**Test Steps:**
1. Log in as Institution Admin
2. Create readiness record
3. Set learning material coverage to 45%
4. Attempt to submit

**Expected Result:**
- Validation error: "Learning material coverage is 45%, which is below the 50% requirement per Form 5 Section 9"
- Submission blocked

### Test 9.5.4: Mandatory Fields Validation
**Test Steps:**
1. Log in as Institution Admin
2. Create readiness record
3. Leave required fields empty:
   - Credits
   - Self-Assessment
   - Registration Type
4. Attempt to submit

**Expected Result:**
- Validation errors for each missing required field
- Clear error messages grouped by section
- Submission blocked

---

## Additional Validation Tests

### Test: Completion Calculation
**Test Steps:**
1. Create readiness record with partial completion
2. Check completion API: `GET /api/institutions/readiness/[readinessId]/completion`

**Expected Result:**
- Returns overall completion percentage
- Returns per-section completion percentages
- Lists missing required fields
- Shows validation warnings

### Test: Trust Score Calculation
**Test Steps:**
1. Log in as QCTO user
2. Open readiness record
3. Check Trust Score component loads

**Expected Result:**
- Trust score displays (0-100)
- Trend indicator shows (UP/DOWN/STABLE)
- Explanation text visible
- Tooltip shows scoring factors

### Test: Review History
**Test Steps:**
1. Perform multiple review actions on a readiness record
2. Check Review History component

**Expected Result:**
- All review actions appear in chronological order
- Reviewer names and timestamps visible
- Status changes tracked
- Document flags tracked

### Test: Audit Logging
**Test Steps:**
1. Perform various actions (submit, review, flag document)
2. Check audit logs in database

**Expected Result:**
- All actions create audit log entries
- Audit logs include user, timestamp, action type
- Related entity IDs correctly linked

---

## Test Data Requirements

### Required Test Records
1. **Draft Records** (for visibility testing):
   - Status: `NOT_STARTED`
   - Status: `IN_PROGRESS`

2. **Submitted Records** (for review testing):
   - Status: `SUBMITTED`
   - Status: `UNDER_REVIEW`
   - Status: `RETURNED_FOR_CORRECTION`

3. **Completed Records** (for final recommendation testing):
   - Status: `RECOMMENDED`
   - Status: `REJECTED`

4. **Different Delivery Modes**:
   - Face-to-Face readiness record
   - Blended readiness record
   - Mobile Unit readiness record

5. **Records with Documents**:
   - Multiple documents per readiness
   - Documents with flags
   - Documents verified

---

## Test Accounts

### QCTO Users
- `qcto.reviewer2@gmail.com` / `Password123!` (QCTO_USER)
- `qcto.superadmin@gmail.com` / `Password123!` (QCTO_SUPER_ADMIN)
- `qcto.admin1@gmail.com` / `Password123!` (QCTO_ADMIN)

### Institution Users
- `admin.bonanieducation10@gmail.com` / `Password123!` (INSTITUTION_ADMIN)
- `staff0.bonanieducation10@gmail.com` / `Password123!` (INSTITUTION_STAFF)

---

## Success Criteria

All tests should pass with:
- ✅ No errors in browser console
- ✅ No API errors (4xx/5xx)
- ✅ All UI components load correctly
- ✅ All validations work as expected
- ✅ All data persists correctly
- ✅ All audit logs created
- ✅ QCTO visibility rules enforced
- ✅ Form 5 compliance verified

---

## Known Issues / Notes

- Document preview currently opens download link (TODO: implement in-app preview)
- File upload storage not yet implemented (TODO: integrate S3/Azure Blob)
- Some validation messages may need refinement based on user feedback

---

## Next Steps After Testing

1. Fix any issues found during testing
2. Gather user feedback from QCTO reviewers
3. Refine validation messages based on real-world usage
4. Implement document preview functionality
5. Add automated tests (unit tests, integration tests)
