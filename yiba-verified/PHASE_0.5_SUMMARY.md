# Phase 0.5 Implementation Summary

## Changes Completed

### 1. Prisma Schema Updates

#### Student-to-Learner Link
- Added `Learner.user_id` (nullable, unique) with FK to `User.user_id`
- One student user can map to one learner record
- Enables proper student self-scoping

#### QCTO Review-Only Models
Three new models allow QCTO users to write review data without editing institution-submitted data:

1. **EvidenceFlag**
   - Flags evidence documents with reasons
   - Status tracking (ACTIVE, RESOLVED, DISMISSED)
   - Links to Document and User (flagged_by, resolved_by)

2. **ReviewComment**
   - Comments on any entity (INSTITUTION, READINESS, LEARNER, ENROLMENT)
   - Internal vs visible to institution (`is_internal` flag)
   - Links to User (comment_by)

3. **ReadinessRecommendation**
   - Records QCTO recommendation (RECOMMENDED, NOT_RECOMMENDED)
   - One-to-one with Readiness (unique constraint)
   - Includes remarks field
   - Links to User (recommended_by)

### 2. Migration Structure

**Single Prisma Migration**: `20250114000000_add_compliance_foundation/`

Includes:
- All schema changes (compliance fields, student link, QCTO models)
- Audit log immutability triggers (database-level protection)
- All foreign keys, indexes, and constraints
- **No manual SQL steps required** - everything in one migration

### 3. Authorization Updates (`src/lib/authz.ts`)

#### Student Self-Scoping (Fixed)
- `canAccessLearner()` now checks `learner.user_id === context.userId`
- Students can only access their own learner record
- No more TODO - fully implemented

#### QCTO Review-Only Write Functions
New authorization functions:
- `canCreateEvidenceFlag(context)` - Only QCTO users
- `canCreateReviewComment(context)` - Only QCTO users  
- `canCreateReadinessRecommendation(context)` - Only QCTO users
- `canAccessReviewData(context, type, id, prisma)` - QCTO (all), Institution (own scope), Platform Admin (all)

## Usage Examples

### Student Self-Scoping

```typescript
// Link student user to learner during onboarding
await prisma.$transaction(async (tx) => {
  await tx.learner.update({
    where: { learner_id: learnerId },
    data: { user_id: studentUserId },
  });
});

// Student access check (automatic)
const accessCheck = await canAccessLearner(
  { userId: studentUserId, role: "STUDENT", institutionId: null },
  learnerId,
  prisma
);
// Returns allowed: true only if learner.user_id === studentUserId
```

### QCTO Review Actions

```typescript
// Flag evidence
const flagCheck = canCreateEvidenceFlag(context);
if (!flagCheck.allowed) {
  return NextResponse.json({ error: flagCheck.reason }, { status: 403 });
}

await prisma.evidenceFlag.create({
  data: {
    document_id: documentId,
    flagged_by: context.userId,
    reason: "Missing required information",
    status: "ACTIVE",
  },
});

// Create review comment
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
await prisma.readinessRecommendation.create({
  data: {
    readiness_id: readinessId,
    recommended_by: context.userId,
    recommendation: "RECOMMENDED",
    remarks: "All requirements met",
  },
});
```

## Migration Instructions

```bash
# Run the migration
npx prisma migrate dev

# This will:
# 1. Create all new tables and fields
# 2. Add foreign keys and indexes
# 3. Create audit log immutability triggers
# 4. Generate Prisma client with new models
```

## Important Notes

1. **Student Linking**: When creating student users, link them to learner records via `Learner.user_id`
2. **QCTO Read-Only**: QCTO users can ONLY write to EvidenceFlag, ReviewComment, and ReadinessRecommendation - they cannot edit institution data
3. **Audit Logging**: All QCTO review actions should still generate audit logs
4. **Institution Scoping**: Institution users can view review data for their own institution only

## Next Steps

1. Run migration: `npx prisma migrate dev`
2. Update student onboarding to link `user_id` to `learner.user_id`
3. Create API routes for QCTO review actions (flag, comment, recommend)
4. Update existing API routes to use new authz functions
5. Test student self-scoping with linked users
