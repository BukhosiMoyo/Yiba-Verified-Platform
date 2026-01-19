# API Mutation Pattern

**Project:** Yiba Verified  
**Document:** API-Mutation-Pattern.md  
**Version:** v1.0  
**Date:** 2026-01-16  
**Location:** 06-Development/

---

## Purpose

This document defines the **compliance-grade mutation pattern** for all API writes. All data mutations must go through a single, centralized function that enforces:

- **Authentication**: Requires authenticated session (401 if not logged in)
- **RBAC (Role-Based Access Control)**: Deny-by-default permissions using `assertCan()`
- **Institution Scoping**: Institution roles cannot escape their `institution_id`
- **QCTO Read-Only Restrictions**: QCTO users cannot mutate institution-submitted data
- **Transactional Audit Logging**: Mutation fails if audit log creation fails (atomicity)

This pattern ensures **compliance-grade data integrity** and **complete audit trails** for all changes.

---

## Allowed Pattern

### The ONLY Allowed Way to Write Data

**API routes MUST call `mutateWithAudit(...)` from `@/server/mutations/mutate`.**

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
      reason: body.reason ?? null,
      
      // RBAC: Custom permission checks
      assertCan: async (tx, ctx) => {
        const allowedRoles = ["PLATFORM_ADMIN", "INSTITUTION_ADMIN", "INSTITUTION_STAFF"];
        if (!allowedRoles.includes(ctx.role)) {
          throw new AppError(
            ERROR_CODES.FORBIDDEN,
            `Role ${ctx.role} cannot create learners`,
            403
          );
        }
      },
      
      // Mutation: Use tx (transaction client), NOT prisma
      mutation: async (tx, ctx) => {
        return await tx.learner.create({
          data: {
            institution_id: ctx.institutionId,
            // ... other fields
          },
        });
      },
    });
    
    return ok(result, 201);
  } catch (error) {
    return fail(error);
  }
}
```

### What `mutateWithAudit` Enforces

1. **Authentication Required**: Automatically calls `requireApiContext()` if not provided
   - Returns 401 if no authenticated session exists

2. **QCTO Read-Only**: Calls `assertNotQCTOEdit()` to block QCTO edits to institution data
   - QCTO can only write to review-only models: `EvidenceFlag`, `ReviewComment`, `ReadinessRecommendation`
   - Returns 403 if QCTO attempts to edit institution-submitted data

3. **Institution Scoping**: Calls `assertInstitutionScope()` if `institutionId` is provided
   - Institution roles (`INSTITUTION_ADMIN`, `INSTITUTION_STAFF`) can only access their own institution
   - `PLATFORM_ADMIN` can access everything (but still audited)
   - Returns 403 if institution scope is violated

4. **Custom RBAC**: Executes `assertCan()` function BEFORE mutation
   - Must throw `AppError` if access is denied
   - Runs inside transaction, so can query database if needed

5. **Transactional Audit Logging**: Writes audit log in the SAME transaction as mutation
   - If audit log creation fails, entire transaction rolls back
   - Ensures no mutation without audit trail

---

## Forbidden Patterns

### ❌ Direct Prisma Calls in Route Handlers

**NEVER call Prisma mutations directly in API route handlers:**

```typescript
// ❌ FORBIDDEN - Direct Prisma call
export async function POST(request: NextRequest) {
  const body = await request.json();
  const learner = await prisma.learner.create({ data: body });
  return ok(learner, 201);
}

// ❌ FORBIDDEN - Even with transaction, missing audit
export async function POST(request: NextRequest) {
  const result = await prisma.$transaction(async (tx) => {
    return await tx.learner.create({ data: body });
  });
  return ok(result, 201);
}

// ❌ FORBIDDEN - Manual audit, not using mutateWithAudit
export async function POST(request: NextRequest) {
  const result = await prisma.$transaction(async (tx) => {
    const created = await tx.learner.create({ data: body });
    await createAuditLog(tx, { ... }); // Manual audit
    return created;
  });
  return ok(result, 201);
}
```

### ❌ Writing Data Without Audit Log

**NEVER write data without audit logging:**

- All mutations must create audit logs
- Audit logs must be written in the same transaction
- If audit fails, mutation must fail

### ✅ Exception: Mutations Directory

**Direct Prisma calls are allowed ONLY inside `src/server/mutations/*`:**

- These files use `tx` (transaction client) from `mutateWithAudit`
- They are called BY `mutateWithAudit`, not FROM API routes
- They are part of the mutation pattern, not violations

---

## Examples

### Example 1: POST Route Using `mutateWithAudit`

```typescript
// src/app/api/learners/route.ts
import { NextRequest } from "next/server";
import { mutateWithAudit } from "@/server/mutations/mutate";
import { requireApiContext } from "@/lib/api/context";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import type { Role } from "@/lib/rbac";

type CreateLearnerBody = {
  national_id: string;
  first_name: string;
  last_name: string;
  // ... other fields
};

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireApiContext();
    const body: CreateLearnerBody = await request.json();
    
    // Determine institution_id based on role
    let institutionId: string;
    if (ctx.role === "PLATFORM_ADMIN") {
      if (!body.institution_id) {
        throw new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          "PLATFORM_ADMIN must provide institution_id",
          400
        );
      }
      institutionId = body.institution_id;
    } else {
      if (!ctx.institutionId) {
        throw new AppError(
          ERROR_CODES.FORBIDDEN,
          "Institution users must belong to an institution",
          403
        );
      }
      institutionId = ctx.institutionId;
    }
    
    const learner = await mutateWithAudit({
      entityType: "LEARNER",
      changeType: "CREATE",
      fieldName: "learner_id",
      institutionId: institutionId,
      reason: body.reason ?? null,
      
      assertCan: async (tx, ctx) => {
        const allowedRoles: Role[] = [
          "PLATFORM_ADMIN",
          "INSTITUTION_ADMIN",
          "INSTITUTION_STAFF"
        ];
        if (!allowedRoles.includes(ctx.role)) {
          throw new AppError(
            ERROR_CODES.FORBIDDEN,
            `Role ${ctx.role} cannot create learners`,
            403
          );
        }
      },
      
      mutation: async (tx, ctx) => {
        // Check for duplicates
        const existing = await tx.learner.findUnique({
          where: { national_id: body.national_id },
        });
        
        if (existing) {
          throw new AppError(
            ERROR_CODES.VALIDATION_ERROR,
            "Learner with this national_id already exists",
            400
          );
        }
        
        return await tx.learner.create({
          data: {
            institution_id: institutionId,
            national_id: body.national_id,
            first_name: body.first_name,
            last_name: body.last_name,
            // ... other fields
          },
        });
      },
    });
    
    return ok(learner, 201);
  } catch (error) {
    return fail(error);
  }
}
```

### Example 2: `assertCan` for PLATFORM_ADMIN vs INSTITUTION Roles

```typescript
// PLATFORM_ADMIN can access any institution
// INSTITUTION roles can only access their own institution

assertCan: async (tx, ctx) => {
  // PLATFORM_ADMIN: no restrictions
  if (ctx.role === "PLATFORM_ADMIN") {
    return; // Allow
  }
  
  // INSTITUTION roles: must match their institution
  if (ctx.role === "INSTITUTION_ADMIN" || ctx.role === "INSTITUTION_STAFF") {
    if (!ctx.institutionId) {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        "User has no institution association",
        403
      );
    }
    
    // Verify entity belongs to user's institution
    const entity = await tx.learner.findUnique({
      where: { learner_id: entityId },
      select: { institution_id: true },
    });
    
    if (!entity || entity.institution_id !== ctx.institutionId) {
      throw new AppError(
        ERROR_CODES.INSTITUTION_SCOPE_VIOLATION,
        "Access denied: institution scope violation",
        403
      );
    }
    
    return; // Allow
  }
  
  // All other roles: deny
  throw new AppError(
    ERROR_CODES.FORBIDDEN,
    `Role ${ctx.role} cannot perform this action`,
    403
  );
}
```

### Example 3: UPDATE Mutation

```typescript
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await requireApiContext();
    const body = await request.json();
    
    // Fetch old value for audit
    const oldLearner = await prisma.learner.findUnique({
      where: { learner_id: params.id },
    });
    
    if (!oldLearner) {
      throw new AppError(
        ERROR_CODES.NOT_FOUND,
        "Learner not found",
        404
      );
    }
    
    const updated = await mutateWithAudit({
      entityType: "LEARNER",
      entityId: params.id,
      changeType: "UPDATE",
      fieldName: "first_name", // Primary field being changed
      oldValue: oldLearner.first_name,
      newValue: body.first_name,
      institutionId: oldLearner.institution_id,
      
      assertCan: async (tx, ctx) => {
        // Check institution scope
        if (ctx.role === "INSTITUTION_ADMIN" || ctx.role === "INSTITUTION_STAFF") {
          if (oldLearner.institution_id !== ctx.institutionId) {
            throw new AppError(
              ERROR_CODES.INSTITUTION_SCOPE_VIOLATION,
              "Access denied: institution scope violation",
              403
            );
          }
        }
        
        // Only admins and staff can update
        const allowedRoles: Role[] = [
          "PLATFORM_ADMIN",
          "INSTITUTION_ADMIN",
          "INSTITUTION_STAFF"
        ];
        if (!allowedRoles.includes(ctx.role)) {
          throw new AppError(
            ERROR_CODES.FORBIDDEN,
            `Role ${ctx.role} cannot update learners`,
            403
          );
        }
      },
      
      mutation: async (tx, ctx) => {
        return await tx.learner.update({
          where: { learner_id: params.id },
          data: body,
        });
      },
    });
    
    return ok(updated);
  } catch (error) {
    return fail(error);
  }
}
```

---

## Checklist Before Merging

Before submitting a PR that includes API mutations, verify:

- [ ] **Mutation goes through `mutateWithAudit`**
  - No direct `prisma.*.create/update/delete/upsert` calls in route handlers
  - All mutations wrapped in `mutateWithAudit({ ... })`

- [ ] **Audit log fields filled**
  - `entityType`: Correct entity type (e.g., "LEARNER", "READINESS")
  - `changeType`: Correct change type (e.g., "CREATE", "UPDATE", "DELETE")
  - `fieldName`: Primary field being changed
  - `oldValue` / `newValue`: Appropriate values for audit trail
  - `institutionId`: Set correctly for scoping

- [ ] **QCTO cannot mutate institution data**
  - `mutateWithAudit` automatically enforces this via `assertNotQCTOEdit()`
  - QCTO can only write to review-only models

- [ ] **Institution-scoped roles cannot escape their `institution_id`**
  - `assertCan()` checks institution scope if needed
  - `institutionId` is set from `ctx.institutionId` for institution roles
  - `PLATFORM_ADMIN` can override, but must explicitly provide `institutionId`

- [ ] **RBAC checks in `assertCan()`**
  - Deny-by-default: explicitly allow roles, deny others
  - Throws `AppError` with appropriate error code and status

- [ ] **Run `npm run check:mutations`**
  - Script must pass (exit code 0)
  - No violations found in `src/app/api`

---

## Enforcement

### Automated Check

Run the enforcement script before committing:

```bash
npm run check:mutations
```

This script scans `src/app/api` for forbidden patterns and fails if any are found.

### Manual Check

You can also manually search for violations:

```bash
grep -r "prisma\.[a-zA-Z_]*\.\(create\|update\|delete\|upsert\)" src/app/api/
```

If any matches are found, refactor them to use `mutateWithAudit()`.

---

## Related Documentation

- `IMPLEMENTATION_NOTES.md`: Additional implementation details and examples
- `Docker-DB-Setup.md`: Development setup instructions

---

**End of Document**
