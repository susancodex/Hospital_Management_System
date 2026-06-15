import { Router } from "express";
import { db, auditLogsTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth";

const router = Router();

router.get("/audit-logs/", requireAuth, requireRole("admin"), async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, 500);
  const offset = Number(req.query.offset) || 0;

  const logs = await db
    .select({
      log: auditLogsTable,
      user: {
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        username: usersTable.username,
        role: usersTable.role,
      },
    })
    .from(auditLogsTable)
    .leftJoin(usersTable, eq(auditLogsTable.userId, usersTable.id))
    .orderBy(desc(auditLogsTable.createdAt))
    .limit(limit)
    .offset(offset);

  res.json(
    logs.map((row) => ({
      id: row.log.id,
      action: row.log.action,
      resource: row.log.resource,
      resource_id: row.log.resourceId,
      details: row.log.details,
      ip_address: row.log.ipAddress,
      created_at: row.log.createdAt,
      user: row.user
        ? {
            username: row.user.username,
            name: `${row.user.firstName} ${row.user.lastName}`,
            role: row.user.role,
          }
        : null,
    }))
  );
});

export default router;
