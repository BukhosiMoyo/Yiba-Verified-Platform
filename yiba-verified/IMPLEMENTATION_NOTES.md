# Phase 0 Implementation Notes

## Overview
This document describes how to use the authorization and audit services in API routes.

## ⚠️ CRITICAL RULE: Never Call Prisma Mutations Directly

**NEVER call `prisma.*.create/update/delete` directly in API route handlers.**

All mutations MUST go through `mutateWithAudit()` from `@/server/mutations/mutate`.

### Why?
- Enforces authentication (401 if not logged in)
- Enforces RBAC and institution scoping (403 if unauthorized)
- Blocks QCTO edits to institution data (403)
- Writes audit logs transactionally (no mutation without audit)
- Ensures data integrity (transaction aborts if audit fails)

### Pattern to Follow

```typescript
import { mutateWithAudit } from "@/server/mutations/mutate";
import { requireApiContext } from "@/lib/api/context";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireApiContext();
    const body = await request.json();
    
    const result = await mutateWithAudit({
      entityType: "LEARNER",
      changeType: "CREATE",
      fieldName: "learner_id",
      institutionId: ctx.institutionId,
      assertCan: async (tx, ctx) => {
        // Custom RBAC checks here
        if (ctx.role !== "INSTITUTION_ADMIN") {
          throw new AppError(ERROR_CODES.FORBIDDEN, "Only admins can create", 403);
        }
      },
      mutation: async (tx, ctx) => {
        // Your mutation here - use tx, not prisma
        return await tx.learner.create({ data: { ... } });
      },
    });
    
    return ok(result, 201);
  } catch (error) {
    return fail(error);
  }
}
```

### Checking for Violations

Run this command to find direct Prisma mutations in API routes:

```bash
grep -r "prisma\.\(learner\|institution\|enrolment\|readiness\|document\)\.\(create\|update\|delete\|upsert\)" src/app/api/
```

If you find any matches, refactor them to use `mutateWithAudit()`.

## Schema Changes

### Institution Model
- Added `contact_person_name`, `contact_email`, `contact_number` fields

### Document Model
- Added `status` enum field (UPLOADED, FLAGGED, ACCEPTED)

### AuditLog Model
- Added `institution_id` (nullable, for scoping)
- Added `change_type` enum (CREATE, UPDATE, DELETE, STATUS_CHANGE)
- Added `related_submission_id` (nullable, for linking to submissions)
- **Database-level immutability**: Triggers prevent UPDATE/DELETE operations

### Learner Model
- Changed `national_id` to be globally unique (removed composite unique constraint)
- Added `user_id` (nullable, unique) - links student users to their learner record

### QCTO Review Models (New)
- **EvidenceFlag**: QCTO can flag evidence documents with reasons
- **ReviewComment**: QCTO can add comments to any entity (internal or visible)
- **ReadinessRecommendation**: QCTO can record recommendations (RECOMMENDED/NOT_RECOMMENDED)

## Running Migrations

**Single migration** (includes all changes):
```bash
npx prisma migrate dev
```

This will apply:
- Schema changes (compliance fields, student link, QCTO review models)
- Audit log immutability triggers (database-level protection)
- All foreign keys and indexes

No manual SQL steps required - everything is in the Prisma migration.

## Using Authorization (authz.ts)

### Basic Usage

```typescript
import { canAccessInstitution, canAccessLearner, canEdit, type AuthzContext } from "@/src/lib/authz";
import { prisma } from "@/src/lib/prisma";

// Get user context from session/token
const context: AuthzContext = {
  userId: user.id,
  role: user.role,
  institutionId: user.institution_id,
};

// Check institution access
const institutionCheck = canAccessInstitution(context, targetInstitutionId);
if (!institutionCheck.allowed) {
  return NextResponse.json({ error: institutionCheck.reason }, { status: 403 });
}

// Check learner access
const learnerCheck = await canAccessLearner(context, learnerId, prisma);
if (!learnerCheck.allowed) {
  return NextResponse.json({ error: learnerCheck.reason }, { status: 403 });
}

// Check edit permission
const editCheck = canEdit(context, "learner");
if (!editCheck.allowed) {
  return NextResponse.json({ error: editCheck.reason }, { status: 403 });
}
```

### Example API Route

```typescript
// app/api/learners/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/src/lib/prisma";
import { canAccessLearner, canEdit, type AuthzContext } from "@/src/lib/authz";
import { auditFieldChange, getChangeType } from "@/src/services/audit.service";
import type { UserRole } from "@prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = await getToken({ req });
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const context: AuthzContext = {
    userId: token.sub!,
    role: token.role as UserRole,
    institutionId: token.institutionId as string | null,
  };

  // Check access
  const accessCheck = await canAccessLearner(context, params.id, prisma);
  if (!accessCheck.allowed) {
    return NextResponse.json({ error: accessCheck.reason }, { status: 403 });
  }

  const learner = await prisma.learner.findUnique({
    where: { learner_id: params.id },
  });

  return NextResponse.json(learner);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = await getToken({ req });
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const context: AuthzContext = {
    userId: token.sub!,
    role: token.role as UserRole,
    institutionId: token.institutionId as string | null,
  };

  // Check edit permission
  const editCheck = canEdit(context, "learner");
  if (!editCheck.allowed) {
    return NextResponse.json({ error: editCheck.reason }, { status: 403 });
  }

  // Check access
  const accessCheck = await canAccessLearner(context, params.id, prisma);
  if (!accessCheck.allowed) {
    return NextResponse.json({ error: accessCheck.reason }, { status: 403 });
  }

  const body = await req.json();
  const oldLearner = await prisma.learner.findUnique({
    where: { learner_id: params.id },
  });

  // Use transaction to ensure audit log is written atomically
  const updated = await prisma.$transaction(async (tx) => {
    const updated = await tx.learner.update({
      where: { learner_id: params.id },
      data: body,
    });

    // Audit each changed field
    for (const [field, newValue] of Object.entries(body)) {
      const oldValue = (oldLearner as any)[field];
      if (oldValue !== newValue) {
        await auditFieldChange(tx, {
          entityType: "LEARNER",
          entityId: params.id,
          fieldName: field,
          oldValue,
          newValue,
          changedBy: context.userId,
          roleAtTime: context.role,
          changeType: getChangeType("update"),
          institutionId: updated.institution_id,
        });
      }
    }

    return updated;
  });

  return NextResponse.json(updated);
}
```

## Using Audit Service (audit.service.ts)

### Transactional Audit Logging

**CRITICAL**: All mutations must use `prisma.$transaction` to ensure audit logs are written atomically with data changes.

### Basic Pattern

```typescript
import { prisma } from "@/src/lib/prisma";
import { auditFieldChange, getChangeType } from "@/src/services/audit.service";

// Example: Update learner
const result = await prisma.$transaction(async (tx) => {
  // 1. Perform data mutation
  const updated = await tx.learner.update({
    where: { learner_id: learnerId },
    data: { first_name: "New Name" },
  });

  // 2. Create audit log (within same transaction)
  await auditFieldChange(tx, {
    entityType: "LEARNER",
    entityId: learnerId,
    fieldName: "first_name",
    oldValue: oldLearner.first_name,
    newValue: updated.first_name,
    changedBy: userId,
    roleAtTime: userRole,
    changeType: getChangeType("update"),
    institutionId: updated.institution_id,
  });

  return updated;
});
```

### Multiple Field Changes

```typescript
const result = await prisma.$transaction(async (tx) => {
  const updated = await tx.learner.update({
    where: { learner_id: learnerId },
    data: {
      first_name: "New Name",
      last_name: "New Surname",
    },
  });

  // Audit each field separately
  await auditFieldChange(tx, {
    entityType: "LEARNER",
    entityId: learnerId,
    fieldName: "first_name",
    oldValue: oldLearner.first_name,
    newValue: updated.first_name,
    changedBy: userId,
    roleAtTime: userRole,
    changeType: getChangeType("update"),
    institutionId: updated.institution_id,
  });

  await auditFieldChange(tx, {
    entityType: "LEARNER",
    entityId: learnerId,
    fieldName: "last_name",
    oldValue: oldLearner.last_name,
    newValue: updated.last_name,
    changedBy: userId,
    roleAtTime: userRole,
    changeType: getChangeType("update"),
    institutionId: updated.institution_id,
  });

  return updated;
});
```

### Create Operations

```typescript
const result = await prisma.$transaction(async (tx) => {
  const created = await tx.learner.create({
    data: learnerData,
  });

  await auditFieldChange(tx, {
    entityType: "LEARNER",
    entityId: created.learner_id,
    fieldName: "learner_id",
    oldValue: null,
    newValue: created.learner_id,
    changedBy: userId,
    roleAtTime: userRole,
    changeType: getChangeType("create"),
    institutionId: created.institution_id,
  });

  return created;
});
```

### Status Changes

```typescript
const result = await prisma.$transaction(async (tx) => {
  const updated = await tx.readiness.update({
    where: { readiness_id: readinessId },
    data: { readiness_status: "SUBMITTED" },
  });

  await auditFieldChange(tx, {
    entityType: "READINESS",
    entityId: readinessId,
    fieldName: "readiness_status",
    oldValue: oldReadiness.readiness_status,
    newValue: "SUBMITTED",
    changedBy: userId,
    roleAtTime: userRole,
    changeType: getChangeType("status_change"),
    institutionId: updated.institution_id,
    relatedSubmissionId: readinessId, // Link to submission if applicable
  });

  return updated;
});
```

## Important Notes

1. **Always use transactions**: Never perform mutations without wrapping them in `prisma.$transaction` with audit logging.

2. **Audit failures abort transactions**: If audit log creation fails, the entire transaction rolls back. This ensures data integrity.

3. **Database-level protection**: The audit log table is protected at the database level - UPDATE and DELETE operations will raise exceptions.

4. **Institution scoping**: Always pass `institutionId` to audit logs for proper scoping and filtering.

5. **QCTO read-only**: QCTO users cannot edit data. Use `canEdit()` check before allowing mutations.

6. **Student self-scoping**: Now implemented via `Learner.user_id` foreign key. Students can only access their own learner record.

7. **QCTO review-only writes**: QCTO users can write to EvidenceFlag, ReviewComment, and ReadinessRecommendation models, but cannot edit institution-submitted data.

8. **Staff assignments**: Staff "assigned-only" checks are placeholders - need to implement assignment system in future.

## QCTO Review-Only Writes

QCTO users can create review data without editing institution-submitted data:

```typescript
import { canCreateEvidenceFlag, canCreateReviewComment, canCreateReadinessRecommendation } from "@/src/lib/authz";

// Flag evidence
const flagCheck = canCreateEvidenceFlag(context);
if (!flagCheck.allowed) {
  return NextResponse.json({ error: flagCheck.reason }, { status: 403 });
}

await prisma.$transaction(async (tx) => {
  const flag = await tx.evidenceFlag.create({
    data: {
      document_id: documentId,
      flagged_by: context.userId,
      reason: "Missing required information",
      status: "ACTIVE",
    },
  });

  // Audit the flag creation
  await auditFieldChange(tx, {
    entityType: "DOCUMENT",
    entityId: documentId,
    fieldName: "status",
    oldValue: "UPLOADED",
    newValue: "FLAGGED",
    changedBy: context.userId,
    roleAtTime: context.role,
    changeType: getChangeType("status_change"),
    institutionId: institutionId,
  });

  return flag;
});

// Create review comment
const commentCheck = canCreateReviewComment(context);
if (!commentCheck.allowed) {
  return NextResponse.json({ error: commentCheck.reason }, { status: 403 });
}

await prisma.reviewComment.create({
  data: {
    related_entity: "READINESS",
    related_entity_id: readinessId,
    comment_by: context.userId,
    comment_text: "Please provide additional documentation",
    is_internal: false, // visible to institution
  },
});

// Record recommendation
const recCheck = canCreateReadinessRecommendation(context);
if (!recCheck.allowed) {
  return NextResponse.json({ error: recCheck.reason }, { status: 403 });
}

await prisma.readinessRecommendation.create({
  data: {
    readiness_id: readinessId,
    recommended_by: context.userId,
    recommendation: "RECOMMENDED",
    remarks: "All requirements met",
  },
});
```

## Student Self-Scoping

Students can now access their own learner record via the `user_id` link:

```typescript
// When creating a student user, link to learner:
await prisma.$transaction(async (tx) => {
  const learner = await tx.learner.update({
    where: { learner_id: learnerId },
    data: { user_id: userId },
  });

  // Audit the link
  await auditFieldChange(tx, {
    entityType: "LEARNER",
    entityId: learnerId,
    fieldName: "user_id",
    oldValue: null,
    newValue: userId,
    changedBy: adminUserId,
    roleAtTime: "PLATFORM_ADMIN",
    changeType: getChangeType("update"),
    institutionId: learner.institution_id,
  });
});

// Student access check (automatic via canAccessLearner)
const accessCheck = await canAccessLearner(context, learnerId, prisma);
// Will return allowed: true only if learner.user_id === context.userId
```

## Next Steps

1. Run migrations to apply schema changes
2. Update existing API routes to use authz checks
3. Update existing mutations to use transactional audit logging
4. Link student users to learner records during onboarding
5. Implement staff assignment system for "assigned-only" checks
