# QCTO Access Helper Testing Guide

## Overview

The `canReadForQCTO()` helper function implements submission/request-based QCTO access control. This document explains how to test it.

## Files Created

1. **`src/lib/api/qctoAccess.ts`** - Main helper functions
   - `canReadForQCTO()` - Returns boolean
   - `assertCanReadForQCTO()` - Throws error if denied
   - `canReadInstitutionForQCTO()` - Institution-level access check

2. **`scripts/test-qcto-access.ts`** - Manual test script
   - Verifies code structure and exports
   - Documents expected behavior
   - Run with: `npx tsx scripts/test-qcto-access.ts`

3. **`src/lib/api/__tests__/qctoAccess.test.ts`** - Jest test file (optional)
   - Full test suite with Prisma mocking
   - Requires Jest setup (not installed yet)

## Prerequisites for Full Testing

1. **Apply Prisma Migration:**
   ```bash
   npx prisma migrate dev --name add_submission_qcto_request_models
   ```

2. **Verify Prisma Client Model Names:**
   After migration, check the generated Prisma client to confirm model names:
   - `Submission` → `prisma.submission`
   - `SubmissionResource` → `prisma.submissionResource`
   - `QCTORequest` → `prisma.qCTORequest` (or `prisma.qctoRequest`)
   - `QCTORequestResource` → `prisma.qCTORequestResource` (or `prisma.qctoRequestResource`)
   
   **Note:** The test file uses `qCTORequest` - verify this matches the generated client after migration!

## Quick Test: Run Structure Verification

```bash
cd yiba-verified
npx tsx scripts/test-qcto-access.ts
```

This verifies:
- ✅ All functions are exported correctly
- ✅ Type definitions are correct
- ✅ Code compiles without errors
- 📋 Documents expected behavior for full integration tests

## Manual Testing Scenarios

### Test 1: PLATFORM_ADMIN Always Has Access

```typescript
import { canReadForQCTO } from "@/lib/api/qctoAccess";
import { createPlatformAdminCtx } from "./test-helpers"; // Create this

const ctx = {
  userId: "platform-admin-123",
  role: "PLATFORM_ADMIN",
  institutionId: null,
};

const result = await canReadForQCTO(ctx, "READINESS", "readiness-123");
// Expected: true (should NOT query Prisma - early return)
```

### Test 2: QCTO_USER with APPROVED Submission

**Setup:**
1. Create an Institution
2. Create a Submission with `status="APPROVED"` and `deleted_at=null`
3. Create a SubmissionResource linking to a resource:
   - `resource_type="READINESS"`
   - `resource_id_value="readiness-123"`
   - `submission_id=<the submission id>`

**Test:**
```typescript
const ctx = {
  userId: "qcto-user-456",
  role: "QCTO_USER",
  institutionId: null,
};

const result = await canReadForQCTO(ctx, "READINESS", "readiness-123");
// Expected: true
// Should query: prisma.submissionResource.findFirst()
// Should NOT query: prisma.qCTORequestResource.findFirst()
```

### Test 3: QCTO_USER with APPROVED QCTORequest (No Submission)

**Setup:**
1. Create an Institution
2. Create a QCTORequest with `status="APPROVED"` and `deleted_at=null`
3. Create a QCTORequestResource linking to a resource:
   - `resource_type="LEARNER"`
   - `resource_id_value="learner-456"`
   - `request_id=<the request id>`
4. **DO NOT** create a Submission for this resource

**Test:**
```typescript
const ctx = {
  userId: "qcto-user-456",
  role: "QCTO_USER",
  institutionId: null,
};

const result = await canReadForQCTO(ctx, "LEARNER", "learner-456");
// Expected: true
// Should query: prisma.submissionResource.findFirst() → null
// Should query: prisma.qCTORequestResource.findFirst() → found
```

### Test 4: QCTO_USER with No Access (Deny-by-Default)

**Setup:**
1. Create a resource (e.g., Learner, Readiness)
2. **DO NOT** link it to any Submission or QCTORequest

**Test:**
```typescript
const ctx = {
  userId: "qcto-user-456",
  role: "QCTO_USER",
  institutionId: null,
};

const result = await canReadForQCTO(ctx, "LEARNER", "learner-999");
// Expected: false
// Should query: prisma.submissionResource.findFirst() → null
// Should query: prisma.qCTORequestResource.findFirst() → null
// Returns false (deny-by-default)
```

### Test 5: Other Roles Denied

```typescript
const instAdminCtx = {
  userId: "inst-admin-789",
  role: "INSTITUTION_ADMIN",
  institutionId: "inst-001",
};

const result = await canReadForQCTO(instAdminCtx, "READINESS", "readiness-123");
// Expected: false
// Should NOT query Prisma (early return)
```

### Test 6: assertCanReadForQCTO Error Handling

```typescript
import { assertCanReadForQCTO } from "@/lib/api/qctoAccess";
import { AppError } from "@/lib/api/errors";

const ctx = {
  userId: "qcto-user-456",
  role: "QCTO_USER",
  institutionId: null,
};

// Should NOT throw if access granted (setup with approved submission/request)
await assertCanReadForQCTO(ctx, "READINESS", "readiness-123");

// Should throw AppError if access denied
try {
  await assertCanReadForQCTO(ctx, "LEARNER", "learner-999");
  throw new Error("Should have thrown!");
} catch (error) {
  expect(error).toBeInstanceOf(AppError);
  expect(error.code).toBe("FORBIDDEN");
  expect(error.status).toBe(403);
}
```

### Test 7: canReadInstitutionForQCTO

```typescript
import { canReadInstitutionForQCTO } from "@/lib/api/qctoAccess";

const ctx = {
  userId: "qcto-user-456",
  role: "QCTO_USER",
  institutionId: null,
};

// With APPROVED submission
const result1 = await canReadInstitutionForQCTO(ctx, "inst-001");
// Expected: true (if institution has any APPROVED submissions)

// With APPROVED QCTORequest (no submissions)
const result2 = await canReadInstitutionForQCTO(ctx, "inst-002");
// Expected: true (if institution has any APPROVED requests)

// With no approved submissions/requests
const result3 = await canReadInstitutionForQCTO(ctx, "inst-003");
// Expected: false
```

## Testing Checklist

- [ ] Prisma migration applied
- [ ] Prisma client model names verified (especially `qCTORequest`)
- [ ] Test database populated with sample data
- [ ] All 7 manual test scenarios pass
- [ ] PLATFORM_ADMIN bypass verified (no Prisma queries)
- [ ] Deny-by-default verified (returns false when no access)
- [ ] Error handling verified (assertCanReadForQCTO throws correctly)
- [ ] Institution-level access verified

## Next Steps After Testing

Once the helper is verified:

1. ✅ **Create QCTO API endpoints** that use `canReadForQCTO()`
   - `GET /api/qcto/submissions`
   - `GET /api/qcto/requests`
   - `GET /api/qcto/resources/:type/:id`

2. ✅ **Update existing QCTO review endpoints** to use `canReadForQCTO()`

3. ✅ **Add QCTO UI pages** for viewing submissions and requests

## Notes

- **PLATFORM_ADMIN** always has access (app owners see everything! 🦸)
- **QCTO_USER** only sees resources in APPROVED submissions or requests
- **Other roles** are denied by default (they have their own access patterns)
- All access is **deny-by-default** - resources must be explicitly shared/approved
