// Mutation wrapper - single source of truth for all data mutations
// Enforces: auth, RBAC, institution scoping, QCTO read-only, transactional audit logging
import { prisma } from "@/lib/prisma";
import { requireApiContext, type ApiContext } from "@/lib/api/context";
import { assertNotQCTOEdit, assertInstitutionScope } from "@/lib/api/assert";
import { createAuditLog, getChangeType, serializeValue } from "@/services/audit.service";
import type { Prisma } from "@prisma/client";
import type { AuditEntityType, AuditChangeType } from "@prisma/client";

export type MutationArgs<T> = {
  // Context (auto-fetched if not provided)
  ctx?: ApiContext;
  
  // Entity metadata for audit
  entityType: AuditEntityType;
  entityId?: string; // Required for UPDATE/DELETE, optional for CREATE
  institutionId?: string | null; // Institution ID of the entity being mutated
  
  // Change metadata
  changeType: AuditChangeType;
  fieldName: string; // Field being changed (e.g., "learner_id" for create, "first_name" for update)
  oldValue?: unknown;
  newValue?: unknown;
  reason?: string | null;
  relatedSubmissionId?: string | null;
  
  // RBAC assertion function - called BEFORE mutation
  // Must throw AppError if access is denied
  assertCan: (tx: Prisma.TransactionClient, ctx: ApiContext) => Promise<void> | void;
  
  // The actual mutation function
  mutation: (tx: Prisma.TransactionClient, ctx: ApiContext) => Promise<T>;
  
  // When true, skip assertNotQCTOEdit so QCTO can perform review operations (e.g. accept/flag document, review readiness)
  allowQctoReviewOperations?: boolean;
};

/**
 * Executes a mutation with full RBAC enforcement and transactional audit logging.
 * 
 * Rules enforced:
 * 1. Authentication required (401 if not logged in)
 * 2. QCTO cannot edit institution-submitted data (403)
 * 3. Institution scoping (institution roles can only access their own institution)
 * 4. Custom RBAC checks via assertCan()
 * 5. Audit log written in SAME transaction (transaction aborts if audit fails)
 * 
 * Usage:
 * ```ts
 * const learner = await mutateWithAudit({
 *   entityType: "LEARNER",
 *   changeType: "CREATE",
 *   fieldName: "learner_id",
 *   institutionId: ctx.institutionId,
 *   assertCan: async (tx, ctx) => {
 *     // Custom RBAC checks
 *     if (ctx.role !== "INSTITUTION_ADMIN") {
 *       throw new AppError("FORBIDDEN", "Only admins can create learners", 403);
 *     }
 *   },
 *   mutation: async (tx, ctx) => {
 *     return await tx.learner.create({ data: { ... } });
 *   },
 * });
 * ```
 */
export async function mutateWithAudit<T>(args: MutationArgs<T>): Promise<T> {
  // 1. Get authenticated context
  const ctx = args.ctx ?? await requireApiContext();
  
  // 2. Block QCTO edits to institution-submitted data (unless allowQctoReviewOperations for accept/flag/review)
  if (!args.allowQctoReviewOperations) {
    assertNotQCTOEdit(ctx, args.entityType);
  }
  
  // 3. Enforce institution scoping (if institutionId provided)
  if (args.institutionId !== undefined) {
    assertInstitutionScope(ctx, args.institutionId);
  }
  
  // 4. Execute mutation and audit in a single transaction
  const result = await prisma.$transaction(async (tx) => {
    // 4a. Run custom RBAC assertions BEFORE mutation
    await args.assertCan(tx, ctx);
    
    // 4b. Execute the mutation
    const mutationResult = await args.mutation(tx, ctx);
    
    // 4c. Write audit log in the same transaction
    // If audit fails, the entire transaction rolls back
    await createAuditLog(tx, {
      entityType: args.entityType,
      entityId: args.entityId ?? (mutationResult as any)?.record_id ?? (mutationResult as any)?.change_id ?? (mutationResult as any)?.learner_id ?? (mutationResult as any)?.id ?? (mutationResult as any)?.readiness_id ?? (mutationResult as any)?.document_id ?? "unknown",
      fieldName: args.fieldName,
      oldValue: serializeValue(args.oldValue),
      newValue: serializeValue(args.newValue ?? (mutationResult as any)?.learner_id ?? (mutationResult as any)?.id ?? null),
      changedBy: ctx.userId,
      roleAtTime: ctx.role,
      changeType: args.changeType,
      reason: args.reason ?? null,
      institutionId: args.institutionId ?? ctx.institutionId ?? null,
      relatedSubmissionId: args.relatedSubmissionId ?? null,
    });
    
    return mutationResult;
  });
  
  return result;
}
