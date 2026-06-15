import { type Request } from "express";
import { db, auditLogsTable } from "@workspace/db";

export async function logAction(
  req: Request,
  action: string,
  resource?: string,
  resourceId?: number,
  details?: string
) {
  try {
    await db.insert(auditLogsTable).values({
      userId: req.user?.id ?? null,
      action,
      resource: resource ?? null,
      resourceId: resourceId ?? null,
      details: details ?? null,
      ipAddress: (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ?? req.socket.remoteAddress ?? null,
    });
  } catch {
    // Never let audit logging break the main request
  }
}
