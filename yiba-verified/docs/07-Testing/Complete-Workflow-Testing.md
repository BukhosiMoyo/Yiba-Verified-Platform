# Complete QCTO Access Control Workflow Testing Guide

## Overview

This guide tests the complete end-to-end workflow:
1. Institution creates submission (DRAFT)
2. Institution adds resources to submission
3. Institution submits to QCTO (SUBMITTED)
4. QCTO reviews submission (UNDER_REVIEW → APPROVED)
5. Once APPROVED, QCTO can access resources via `canReadForQCTO()`

## Prerequisites

1. **Server running** on port 3000:
   ```bash
   npm run dev
   ```

2. **DEV_API_TOKEN** set in `.env` file

3. **Prisma migration applied**:
   ```bash
   npx prisma migrate dev --name add_submission_qcto_request_models
   ```

4. **Test data** - You'll need:
   - At least 1 Institution
   - At least 1 Learner (for resources)
   - At least 1 Enrolment (for resources)

## Setup Test Environment

```bash
export BASE_URL="http://localhost:3000"
export DEV_API_TOKEN=$(grep -E '^DEV_API_TOKEN=' .env | sed -E 's/^DEV_API_TOKEN="?(.*)"?$/\1/')
```

## Complete Workflow Test

### Step 1: Create a Submission

Create a new submission (status: DRAFT):

```bash
curl -X POST "$BASE_URL/api/institutions/submissions" \
  -H "Content-Type: application/json" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" \
  -d '{
    "title": "Test Compliance Pack 2024",
    "submission_type": "COMPLIANCE_PACK"
  }' | jq
```

**Expected:** `201 Created` with submission object (status: "DRAFT")

**Save submission_id:**
```bash
SUBMISSION_ID=$(curl -sS -X POST "$BASE_URL/api/institutions/submissions" \
  -H "Content-Type: application/json" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" \
  -d '{"title": "Test Compliance Pack 2024", "submission_type": "COMPLIANCE_PACK"}' \
  | jq -r '.submission_id')
echo "Submission ID: $SUBMISSION_ID"
```

### Step 2: Get a Learner ID

Get an existing learner to use as a resource:

```bash
LEARNER_ID=$(curl -sS "$BASE_URL/api/learners?limit=1" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" \
  | jq -r '.items[0].learner_id')
echo "Learner ID: $LEARNER_ID"
```

If no learners exist, create one first (see API docs).

### Step 3: Add Resource to Submission

Add a learner resource to the submission:

```bash
curl -X POST "$BASE_URL/api/institutions/submissions/$SUBMISSION_ID/resources" \
  -H "Content-Type: application/json" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" \
  -d "{
    \"resource_type\": \"LEARNER\",
    \"resource_id_value\": \"$LEARNER_ID\",
    \"notes\": \"Test learner resource\"
  }" | jq
```

**Expected:** `201 Created` with resource object

**Save resource_id:**
```bash
RESOURCE_ID=$(curl -sS -X POST "$BASE_URL/api/institutions/submissions/$SUBMISSION_ID/resources" \
  -H "Content-Type: application/json" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" \
  -d "{\"resource_type\": \"LEARNER\", \"resource_id_value\": \"$LEARNER_ID\", \"notes\": \"Test learner\"}" \
  | jq -r '.resource_id')
echo "Resource ID: $RESOURCE_ID"
```

### Step 4: Verify QCTO CANNOT Access Resource Yet

**BEFORE approval**, QCTO should NOT be able to access the learner:

```bash
# This should return 403 (if QCTO_USER) or 401 (if not authenticated as QCTO)
curl -sS "$BASE_URL/api/learners/$LEARNER_ID" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" \
  | jq
```

**Expected:** 
- If DEV_API_TOKEN is for QCTO_USER: `403 Forbidden` with "Access denied: This learner has not been shared with QCTO..."
- If DEV_API_TOKEN is for PLATFORM_ADMIN: `200 OK` (PLATFORM_ADMIN sees everything! 🦸)

### Step 5: Submit Submission to QCTO

Submit the submission (DRAFT → SUBMITTED):

```bash
curl -X PATCH "$BASE_URL/api/institutions/submissions/$SUBMISSION_ID" \
  -H "Content-Type: application/json" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" \
  -d '{
    "status": "SUBMITTED"
  }' | jq
```

**Expected:** `200 OK` with submission object (status: "SUBMITTED", submitted_at: timestamp)

### Step 6: Verify QCTO STILL CANNOT Access (Not Yet APPROVED)

**AFTER submitting but BEFORE approval**, QCTO should STILL NOT be able to access:

```bash
# Still 403 because submission is only SUBMITTED, not APPROVED
curl -sS "$BASE_URL/api/learners/$LEARNER_ID" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" \
  | jq
```

**Expected:** Still `403 Forbidden` (only APPROVED submissions grant access)

### Step 7: QCTO Reviews and Approves Submission

**Switch to QCTO_USER token** (or ensure your DEV_API_TOKEN is for QCTO_USER), then approve:

```bash
# Approve the submission (SUBMITTED → APPROVED)
curl -X PATCH "$BASE_URL/api/qcto/submissions/$SUBMISSION_ID" \
  -H "Content-Type: application/json" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" \
  -d '{
    "status": "APPROVED",
    "review_notes": "All resources verified. Submission approved for QCTO access."
  }' | jq
```

**Expected:** `200 OK` with submission object (status: "APPROVED", reviewed_at: timestamp, reviewed_by: QCTO user ID)

### Step 8: Verify QCTO CAN NOW Access Resource

**AFTER approval**, QCTO should be able to access the learner:

```bash
# This should now return 200 OK with learner data
curl -sS "$BASE_URL/api/learners/$LEARNER_ID" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" \
  | jq
```

**Expected:** `200 OK` with learner object (QCTO can now access via `canReadForQCTO()`!)

### Step 9: Verify QCTO Can List Resources

QCTO should also be able to list learners that are in APPROVED submissions:

```bash
# This should return learners that are in APPROVED submissions
curl -sS "$BASE_URL/api/learners?limit=50" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" \
  | jq '.items[] | {learner_id, first_name, last_name}'
```

**Expected:** `200 OK` with list of learners that QCTO can access (should include our test learner)

## QCTO Request Workflow Test

### Step 10: QCTO Creates a Request

QCTO creates a request for access to resources:

```bash
# Get an institution ID first
INSTITUTION_ID=$(curl -sS "$BASE_URL/api/dev/institutions?limit=1" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" \
  | jq -r '.items[0].institution_id')

# Create QCTO request
curl -X POST "$BASE_URL/api/qcto/requests" \
  -H "Content-Type: application/json" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" \
  -d "{
    \"institution_id\": \"$INSTITUTION_ID\",
    \"title\": \"Test QCTO Request\",
    \"request_type\": \"READINESS_REVIEW\",
    \"description\": \"Requesting access to learner data for readiness review\",
    \"resources\": [
      {
        \"resource_type\": \"LEARNER\",
        \"resource_id_value\": \"$LEARNER_ID\",
        \"notes\": \"Need access to this learner for review\"
      }
    ]
  }" | jq
```

**Expected:** `201 Created` with request object (status: "PENDING")

**Save request_id:**
```bash
REQUEST_ID=$(curl -sS -X POST "$BASE_URL/api/qcto/requests" \
  -H "Content-Type: application/json" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" \
  -d "{\"institution_id\": \"$INSTITUTION_ID\", \"title\": \"Test Request\", \"resources\": [{\"resource_type\": \"LEARNER\", \"resource_id_value\": \"$LEARNER_ID\"}]}" \
  | jq -r '.request_id')
echo "Request ID: $REQUEST_ID"
```

### Step 11: Institution Approves Request

**Switch to INSTITUTION_USER token** (or ensure your DEV_API_TOKEN is for INSTITUTION_ADMIN), then approve:

```bash
# Approve the request (PENDING → APPROVED)
curl -X PATCH "$BASE_URL/api/institutions/requests/$REQUEST_ID" \
  -H "Content-Type: application/json" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" \
  -d '{
    "status": "APPROVED",
    "response_notes": "Request approved. Access granted."
  }' | jq
```

**Expected:** `200 OK` with request object (status: "APPROVED", reviewed_at: timestamp)

### Step 12: Verify QCTO Can Access via Request

**Switch back to QCTO_USER token**, then verify QCTO can access the learner via the APPROVED request:

```bash
# This should return 200 OK (access via APPROVED request)
curl -sS "$BASE_URL/api/learners/$LEARNER_ID" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" \
  | jq
```

**Expected:** `200 OK` (QCTO can access via `canReadForQCTO()` checking APPROVED requests!)

## Test Checklist

- [ ] **Step 1:** Create submission (DRAFT) - `201 Created`
- [ ] **Step 2:** Get learner ID for resource
- [ ] **Step 3:** Add resource to submission - `201 Created`
- [ ] **Step 4:** QCTO CANNOT access resource yet (before approval) - `403 Forbidden` (or `200` if PLATFORM_ADMIN)
- [ ] **Step 5:** Submit submission (SUBMITTED) - `200 OK`
- [ ] **Step 6:** QCTO STILL cannot access (not yet APPROVED) - `403 Forbidden`
- [ ] **Step 7:** QCTO approves submission (APPROVED) - `200 OK`
- [ ] **Step 8:** QCTO CAN NOW access resource - `200 OK` ✅
- [ ] **Step 9:** QCTO can list learners in APPROVED submissions - `200 OK` with filtered list
- [ ] **Step 10:** QCTO creates request (PENDING) - `201 Created`
- [ ] **Step 11:** Institution approves request (APPROVED) - `200 OK`
- [ ] **Step 12:** QCTO can access resource via APPROVED request - `200 OK` ✅

## Verification Points

### ✅ Access Control Verification

1. **Deny-by-default:** QCTO cannot access resources NOT in any APPROVED submission/request
2. **Submission-based access:** QCTO can access resources in APPROVED submissions
3. **Request-based access:** QCTO can access resources in APPROVED requests
4. **PLATFORM_ADMIN bypass:** PLATFORM_ADMIN always has access (app owners see everything! 🦸)
5. **Status workflow:** Only APPROVED submissions/requests grant access (not SUBMITTED/PENDING)

### ✅ Workflow Verification

1. **Institution submission workflow:** Create → Add resources → Submit → QCTO reviews → Approve
2. **QCTO request workflow:** QCTO creates → Institution approves → QCTO gets access
3. **Status transitions:** DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED/REJECTED
4. **Audit logging:** All changes logged via `mutateWithAudit()`

## Troubleshooting

### QCTO still getting 403 after approval

1. **Check submission status:** Must be `APPROVED` (not `SUBMITTED`)
2. **Check resource exists:** Verify resource is actually in `SubmissionResource` table
3. **Check Prisma client:** Run `npx prisma generate` after schema changes
4. **Check DEV_API_TOKEN:** Ensure it's for a `QCTO_USER` role
5. **Check `canReadForQCTO()`:** Verify helper is checking `status="APPROVED"` correctly

### Institution cannot create submission

1. **Check role:** Must be `INSTITUTION_ADMIN`, `INSTITUTION_STAFF`, or `PLATFORM_ADMIN`
2. **Check institution_id:** User must belong to an institution (for INSTITUTION_* roles)
3. **Check DEV_API_TOKEN:** Ensure it's for an institution user

### QCTO cannot review submission

1. **Check status:** Submission must be `SUBMITTED` or `UNDER_REVIEW` (not `DRAFT` or already `APPROVED`)
2. **Check role:** Must be `QCTO_USER` or `PLATFORM_ADMIN`
3. **Check DEV_API_TOKEN:** Ensure it's for a `QCTO_USER` role

## Success Criteria

✅ **Complete workflow works end-to-end:**
- Institutions can create and submit submissions
- QCTO can review and approve submissions
- Once APPROVED, QCTO can access resources via `canReadForQCTO()`
- QCTO requests work (create → approve → access granted)
- PLATFORM_ADMIN always has access
- Deny-by-default enforced (no access without approval)

✅ **All status transitions work:**
- DRAFT → SUBMITTED
- SUBMITTED → UNDER_REVIEW → APPROVED/REJECTED/RETURNED_FOR_CORRECTION
- PENDING → APPROVED/REJECTED

✅ **Access control enforced:**
- QCTO cannot access resources before approval
- QCTO can access resources after approval
- Other roles cannot access QCTO endpoints

## Next Steps After Testing

Once all tests pass:
1. ✅ Document any issues found and fixes
2. ✅ Update user documentation with workflow diagrams
3. ✅ Create training materials for institutions and QCTO
4. ✅ Set up monitoring/alerting for production
5. ✅ Plan for additional features (notifications, reports, etc.)
