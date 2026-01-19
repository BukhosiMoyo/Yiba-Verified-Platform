# How to Test the QCTO Access Helper

## Quick Start

### Step 1: Apply Prisma Migration

The helper requires the `Submission`, `SubmissionResource`, `QCTORequest`, and `QCTORequestResource` tables.

```bash
cd yiba-verified
npx prisma migrate dev --name add_submission_qcto_request_models
```

**Important:** After migration, verify the Prisma client model name:
- Check if it's `prisma.qCTORequest` or `prisma.qctoRequest`
- Update `src/lib/api/qctoAccess.ts` line 72 and 179 if needed

### Step 2: Run the Simple Test Script

```bash
npx tsx scripts/test-qcto-helper-simple.ts
```

This script will:
- ✅ Test PLATFORM_ADMIN always has access
- ✅ Test QCTO_USER deny-by-default behavior
- ✅ Test QCTO_USER with APPROVED submissions (if data exists)
- ✅ Test QCTO_USER with APPROVED QCTORequests (if data exists)
- ✅ Test other roles are denied
- ✅ Test institution-level access
- ✅ Test error handling

### Step 3: Test with Real Data (Optional)

To fully test with actual database data, create test records:

#### Option A: Using Prisma Studio (Easiest)

```bash
npx prisma studio
```

Then manually create:
1. An Institution
2. A Submission with `status="APPROVED"`, `deleted_at=null`
3. A SubmissionResource linking to a resource (e.g., `resource_type="READINESS"`, `resource_id_value="some-id"`)
4. A QCTORequest with `status="APPROVED"`, `deleted_at=null`
5. A QCTORequestResource linking to a resource

#### Option B: Create a Seed Script

Add to `prisma/seed.ts`:

```typescript
// Create test submission for QCTO access testing
const testInstitution = await prisma.institution.upsert({
  where: { institution_id: "test-inst-qcto" },
  update: {},
  create: {
    institution_id: "test-inst-qcto",
    name: "Test Institution for QCTO",
    // ... other fields
  },
});

const testSubmission = await prisma.submission.create({
  data: {
    institution_id: testInstitution.institution_id,
    submitted_by: "some-user-id",
    status: "APPROVED",
    // ... other fields
  },
});

await prisma.submissionResource.create({
  data: {
    submission_id: testSubmission.submission_id,
    resource_type: "READINESS",
    resource_id_value: "test-readiness-123",
    added_by: "some-user-id",
  },
});
```

Then run: `npx prisma db seed`

## Manual Testing in Node REPL

You can also test interactively:

```bash
npx tsx
```

Then in the REPL:

```typescript
import { canReadForQCTO } from "./src/lib/api/qctoAccess";

// Test PLATFORM_ADMIN
const platformCtx = {
  userId: "platform-123",
  role: "PLATFORM_ADMIN",
  institutionId: null,
};

await canReadForQCTO(platformCtx, "READINESS", "any-id");
// Expected: true

// Test QCTO_USER with no access
const qctoCtx = {
  userId: "qcto-456",
  role: "QCTO_USER",
  institutionId: null,
};

await canReadForQCTO(qctoCtx, "READINESS", "non-existent-id");
// Expected: false (deny-by-default)
```

## What Each Test Verifies

### ✅ Test 1: PLATFORM_ADMIN Always Has Access
- **Expected:** Returns `true` immediately without querying Prisma
- **Purpose:** Verifies app owners see everything! 🦸

### ✅ Test 2: QCTO_USER Deny-by-Default
- **Expected:** Returns `false` for non-existent resources
- **Purpose:** Verifies security model (deny-by-default)

### ✅ Test 3: QCTO_USER with APPROVED Submission
- **Expected:** Returns `true` if resource is in an APPROVED submission
- **Purpose:** Verifies submission-based access

### ✅ Test 4: QCTO_USER with APPROVED QCTORequest
- **Expected:** Returns `true` if resource is in an APPROVED request
- **Purpose:** Verifies request-based access

### ✅ Test 5: Other Roles Denied
- **Expected:** Returns `false` for non-QCTO roles
- **Purpose:** Verifies only QCTO/PLATFORM_ADMIN can use this helper

### ✅ Test 6: Institution-Level Access
- **Expected:** Returns `true` if institution has APPROVED submissions/requests
- **Purpose:** Verifies `canReadInstitutionForQCTO()` helper

### ✅ Test 7: Error Handling
- **Expected:** `assertCanReadForQCTO()` throws `AppError` with `FORBIDDEN` code
- **Purpose:** Verifies assertion helper works correctly

## Troubleshooting

### Error: "Cannot find module '@/lib/prisma'"
- **Fix:** Make sure you're running from the project root (`yiba-verified/`)
- **Fix:** Check `tsconfig.json` has path aliases configured

### Error: "Model 'qCTORequest' does not exist"
- **Fix:** After migration, check the generated Prisma client
- **Fix:** It might be `qctoRequest` (all lowercase after first letter)
- **Fix:** Update `src/lib/api/qctoAccess.ts` line 72 and 179

### Error: "Cannot read property 'findFirst' of undefined"
- **Fix:** Prisma client not generated - run `npx prisma generate`
- **Fix:** Migration not applied - run `npx prisma migrate dev`

### Tests Show "No APPROVED submissions found"
- **This is OK!** The helper still works - it just means you don't have test data
- **To fully test:** Create test submissions/requests (see Step 3)

## Expected Output

When everything works, you should see:

```
🧪 Testing QCTO Access Helper

============================================================

📋 Test 1: PLATFORM_ADMIN always has access
   ✅ PLATFORM_ADMIN returned true (expected)

📋 Test 2: QCTO_USER with no access (deny-by-default)
   ✅ QCTO_USER returned false for non-existent resource (expected - deny-by-default)

📋 Test 3: QCTO_USER with APPROVED submission
   ⚠️  No APPROVED submissions found in database (skipping)

📋 Test 4: QCTO_USER with APPROVED QCTORequest
   ⚠️  No APPROVED QCTORequests found in database (skipping)

📋 Test 5: Other roles denied
   ✅ INSTITUTION_ADMIN returns false (expected - no QCTO access)

📋 Test 6: canReadInstitutionForQCTO
   ⚠️  No institutions with APPROVED submissions found (skipping)

📋 Test 7: assertCanReadForQCTO error handling
   ✅ assertCanReadForQCTO throws AppError with FORBIDDEN code (expected)

============================================================

✅ Basic tests complete!
```

## Next Steps

Once testing is complete:

1. ✅ **Create QCTO API endpoints** using `canReadForQCTO()`
2. ✅ **Update existing QCTO review endpoints** to use the helper
3. ✅ **Add QCTO UI pages** for viewing submissions and requests

---

**Need help?** Check `docs/07-Testing/QCTO-Access-Testing.md` for detailed testing scenarios.
