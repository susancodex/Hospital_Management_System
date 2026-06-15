import { Router } from "express";
import { db, notificationsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/notifications/", requireAuth, async (req, res) => {
  const notifications = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, req.user!.id))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(50);

  const unread = notifications.filter((n) => !n.isRead).length;

  res.json({
    results: notifications.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      is_read: n.isRead,
      related_type: n.relatedType,
      related_id: n.relatedId,
      created_at: n.createdAt,
    })),
    unread_count: unread,
  });
});

router.post("/notifications/mark-read/", requireAuth, async (req, res) => {
  const { ids } = req.body;

  if (ids && Array.isArray(ids)) {
    for (const id of ids) {
      await db
        .update(notificationsTable)
        .set({ isRead: true })
        .where(and(eq(notificationsTable.id, Number(id)), eq(notificationsTable.userId, req.user!.id)));
    }
  } else {
    await db
      .update(notificationsTable)
      .set({ isRead: true })
      .where(eq(notificationsTable.userId, req.user!.id));
  }

  res.json({ success: true });
});

router.delete("/notifications/:id/", requireAuth, async (req, res) => {
  await db
    .delete(notificationsTable)
    .where(and(eq(notificationsTable.id, Number(req.params.id)), eq(notificationsTable.userId, req.user!.id)));
  res.status(204).send();
});

export default router;
