# Test Data Setup Guide

## Overview

This guide helps you set up test data for the complete QCTO access control workflow testing.

## Quick Setup

### Option 1: Use Prisma Studio (Easiest)

```bash
npx prisma studio
```

Manually create:
1. Institution
2. Learner
3. Enrolment (optional)

### Option 2: Use API Endpoints

Use curl commands to create test data via the API endpoints.

### Option 3: Use Seed Script

Add test data to `prisma/seed.ts` (idempotent upserts).

## Required Test Data

### 1. Institution

You need at least 1 institution for:
- Creating submissions
- Creating QCTO requests
- Institution scoping tests

**Via API:**
```bash
# List existing institutions
curl -sS "http://localhost:3000/api/dev/institutions" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq
```

**Via Prisma Studio:**
- Open Prisma Studio
- Create new `Institution` record
- Save `institution_id` for later use

### 2. Learner

You need at least 1 learner for:
- Adding as resource to submissions
- Testing QCTO access via `canReadForQCTO()`

**Via API:**
```bash
# Create learner
curl -X POST "http://localhost:3000/api/learners" \
  -H "Content-Type: application/json" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" \
  -d '{
    "national_id": "9001015009088",
    "first_name": "Test",
    "last_name": "Learner",
    "birth_date": "1990-01-01",
    "gender_code": "M",
    "nationality_code": "ZA",
    "popia_consent": true,
    "consent_date": "2024-01-01",
    "institution_id": "<INSTITUTION_ID>"
  }' | jq -r '.learner_id'
```

**Save learner_id:**
```bash
LEARNER_ID=$(curl -sS -X POST "http://localhost:3000/api/learners" \
  -H "Content-Type: application/json" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" \
  -d '{"national_id": "9001015009088", "first_name": "Test", "last_name": "Learner", "birth_date": "1990-01-01", "gender_code": "M", "nationality_code": "ZA", "popia_consent": true, "consent_date": "2024-01-01", "institution_id": "<INSTITUTION_ID>"}' \
  | jq -r '.learner_id')
echo "Learner ID: $LEARNER_ID"
```

### 3. Enrolment (Optional)

You can also test with enrolments as resources:

```bash
# Create enrolment
curl -X POST "http://localhost:3000/api/enrolments" \
  -H "Content-Type: application/json" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" \
  -d '{
    "learner_id": "<LEARNER_ID>",
    "qualification_id": "<QUALIFICATION_ID>",
    "enrolment_status": "ACTIVE"
  }' | jq -r '.enrolment_id'
```

## Test Scenarios

### Scenario 1: Submission Workflow

**Data needed:**
- 1 Institution
- 1-3 Learners (to add as resources)

**Workflow:**
1. Create submission (DRAFT)
2. Add learners as resources
3. Submit to QCTO (SUBMITTED)
4. QCTO approves (APPROVED)
5. Verify QCTO can access learners

### Scenario 2: Request Workflow

**Data needed:**
- 1 Institution
- 1-2 Learners (to request access to)

**Workflow:**
1. QCTO creates request (PENDING)
2. Institution approves (APPROVED)
3. Verify QCTO can access learners

### Scenario 3: Multiple Submissions

**Data needed:**
- 1 Institution
- 3-5 Learners

**Workflow:**
1. Create 2 submissions
2. Add different learners to each
3. Submit both
4. Approve one, reject the other
5. Verify QCTO can only access approved resources

## Verification Queries

### Check Submission Status

```bash
# List all submissions
curl -sS "http://localhost:3000/api/institutions/submissions" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq '.items[] | {submission_id, status, title}'
```

### Check Submission Resources

```bash
# View submission details (includes resources)
curl -sS "http://localhost:3000/api/institutions/submissions/<SUBMISSION_ID>" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq '.submissionResources'
```

### Check QCTO Requests

```bash
# List all requests
curl -sS "http://localhost:3000/api/qcto/requests" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq '.items[] | {request_id, status, title}'
```

### Check QCTO Access (via Prisma query)

You can verify access directly in the database:

```sql
-- Check if learner is in an APPROVED submission
SELECT * FROM "SubmissionResource" sr
JOIN "Submission" s ON sr.submission_id = s.submission_id
WHERE sr.resource_type = 'LEARNER'
  AND sr.resource_id_value = '<LEARNER_ID>'
  AND s.status = 'APPROVED'
  AND s.deleted_at IS NULL;

-- Check if learner is in an APPROVED request
SELECT * FROM "QCTORequestResource" qrr
JOIN "QCTORequest" qr ON qrr.request_id = qr.request_id
WHERE qrr.resource_type = 'LEARNER'
  AND qrr.resource_id_value = '<LEARNER_ID>'
  AND qr.status = 'APPROVED'
  AND qr.deleted_at IS NULL;
```

## Cleanup Test Data

To clean up test data after testing:

```bash
# Delete test submissions (soft delete via API or Prisma Studio)
# Delete test requests
# Keep learners/enrolments for future tests
```

Or use Prisma Studio to delete test records manually.

## Troubleshooting

### No institutions found

**Fix:** Use Prisma Studio to create an institution, or ensure seed script has run:
```bash
npx prisma db seed
```

### No learners found

**Fix:** Create a learner via API (see above) or Prisma Studio.

### Cannot create submission

**Fix:** 
- Verify user has `INSTITUTION_ADMIN`, `INSTITUTION_STAFF`, or `PLATFORM_ADMIN` role
- Verify `DEV_API_TOKEN` is valid
- Check institution exists and is not deleted

### QCTO cannot access after approval

**Fix:**
- Verify submission status is `APPROVED` (not `SUBMITTED`)
- Verify resource is in `SubmissionResource` table
- Verify `canReadForQCTO()` is checking correctly
- Run `npx prisma generate` if schema changed
