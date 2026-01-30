/**
 * Adapter: legacy mutateWithAudit(ctx, { action, entityType, entityId?, fn })
 * to @/server/mutations/mutate's mutateWithAudit({ ctx, entityType, changeType, fieldName, assertCan, mutation, ... }).
 *
 * Callers must pass fn: (tx) => Promise<T> and use tx instead of prisma so the mutation
 * runs inside the same transaction as the audit.
 */
import { mutateWithAudit as serverMutateWithAudit } from "@/server/mutations/mutate";
import type { ApiContext } from "@/lib/api/context";
import type { AuditEntityType } from "@prisma/client";
import type { Prisma } from "@prisma/client";

export type LegacyMutateAction =
  | "DOCUMENT_CREATE"
  | "DOCUMENT_REPLACE"
  | "DOCUMENT_ACCEPT"
  | "DOCUMENT_VERIFY"
  | "DOCUMENT_FLAG"
  | "DOCUMENT_LINK"
  | "READINESS_REVIEW";

export type LegacyMutateOptions<T> = {
  action: LegacyMutateAction;
  entityType: AuditEntityType;
  entityId?: string | (() => string);
  /** Receives tx (Prisma.TransactionClient). Use tx instead of prisma. */
  fn: (tx: Prisma.TransactionClient) => Promise<T>;
};

function getChangeTypeAndField(action: LegacyMutateAction): { changeType: "CREATE" | "STATUS_CHANGE"; fieldName: string } {
  switch (action) {
    case "DOCUMENT_CREATE":
      return { changeType: "CREATE", fieldName: "document_id" };
    case "DOCUMENT_REPLACE":
      return { changeType: "CREATE", fieldName: "version" };
    case "DOCUMENT_LINK":
      return { changeType: "CREATE", fieldName: "document_id" };
    case "DOCUMENT_ACCEPT":
    case "DOCUMENT_VERIFY":
      return { changeType: "STATUS_CHANGE", fieldName: "status" };
    case "DOCUMENT_FLAG":
      return { changeType: "STATUS_CHANGE", fieldName: "flags" };
    case "READINESS_REVIEW":
      return { changeType: "STATUS_CHANGE", fieldName: "readiness_status" };
    default:
      return { changeType: "STATUS_CHANGE", fieldName: "status" };
  }
}

function isQctoReviewAction(action: LegacyMutateAction): boolean {
  return ["DOCUMENT_ACCEPT", "DOCUMENT_VERIFY", "DOCUMENT_FLAG", "READINESS_REVIEW"].includes(action);
}

/**
 * Legacy API: mutateWithAudit(ctx, { action, entityType, entityId?, fn }).
 * Maps to server mutateWithAudit. fn(tx) must use tx instead of prisma.
 */
export async function mutateWithAudit<T>(
  ctx: ApiContext,
  opts: LegacyMutateOptions<T>
): Promise<T> {
  const { changeType, fieldName } = getChangeTypeAndField(opts.action);
  const entityId = typeof opts.entityId === "function" ? undefined : (opts.entityId ?? undefined);

  return serverMutateWithAudit({
    ctx,
    entityType: opts.entityType,
    entityId,
    changeType,
    fieldName,
    institutionId: undefined,
    assertCan: async () => {},
    allowQctoReviewOperations: isQctoReviewAction(opts.action),
    mutation: async (tx) => opts.fn(tx),
  });
}
