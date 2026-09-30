import { db } from "../db/index.js";
import { auditLogs } from "../db/schema.js";

type AuditValue = Record<string, unknown> | null;

export const auditService = {
  record: async (input: {
    actorUserId: string;
    action: string;
    entity: string;
    entityId?: string;
    oldValues?: AuditValue;
    newValues?: AuditValue;
    metadata?: AuditValue;
  }) => {
    const [auditLog] = await db
      .insert(auditLogs)
      .values({
        actorUserId: input.actorUserId,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        oldValues: input.oldValues,
        newValues: input.newValues,
        metadata: input.metadata,
      })
      .returning();

    return auditLog;
  },
};
