import { Router } from "express";
import { db, telemedicineSessionsTable, appointmentsTable, usersTable, doctorsTable, patientsTable } from "@workspace/db";
import { eq, desc, and, or } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth";
import { logAction } from "../lib/audit";
import { broadcastToUser } from "../lib/ws";
import crypto from "crypto";

const router = Router();

function generateRoomToken(): string {
  return crypto.randomBytes(16).toString("hex");
}

function buildJitsiUrl(roomName: string): string {
  return `https://meet.jit.si/AetherCare-${roomName}`;
}

// ── GET /telemedicine-sessions/ ───────────────────────────────────────────────
router.get("/telemedicine-sessions/", requireAuth, async (req, res) => {
  const user = req.user!;
  const { status } = req.query as Record<string, string>;

  let query = db
    .select({
      session: telemedicineSessionsTable,
      doctor: { firstName: usersTable.firstName, lastName: usersTable.lastName },
      patient: { id: patientsTable.id },
    })
    .from(telemedicineSessionsTable)
    .leftJoin(usersTable, eq(telemedicineSessionsTable.doctorId, usersTable.id))
    .leftJoin(patientsTable, eq(telemedicineSessionsTable.patientId, patientsTable.userId))
    .orderBy(desc(telemedicineSessionsTable.createdAt));

  const sessions = await query;

  const filtered = sessions.filter((s) => {
    if (user.role === "patient" && s.session.patientId !== user.id) return false;
    if (user.role === "doctor" && s.session.doctorId !== user.id) return false;
    if (status && s.session.status !== status) return false;
    return true;
  });

  res.json({
    results: filtered.map((s) => ({
      ...s.session,
      doctor_name: s.doctor ? `Dr. ${s.doctor.firstName} ${s.doctor.lastName}`.trim() : "",
      join_url: s.session.roomUrl,
    })),
  });
});

// ── POST /telemedicine-sessions/ ─────────────────────────────────────────────
router.post("/telemedicine-sessions/", requireAuth, requireRole("admin", "doctor", "reception"), async (req, res) => {
  const user = req.user!;
  const { appointment_id, doctor_id, patient_id, scheduled_at, notes } = req.body;

  if (!doctor_id || !patient_id) {
    res.status(400).json({ detail: "doctor_id and patient_id are required." });
    return;
  }

  const token = generateRoomToken();
  const roomUrl = buildJitsiUrl(token);

  const [session] = await db
    .insert(telemedicineSessionsTable)
    .values({
      appointmentId: appointment_id ? Number(appointment_id) : null,
      doctorId: Number(doctor_id),
      patientId: Number(patient_id),
      sessionToken: token,
      roomUrl,
      status: "scheduled",
      scheduledAt: scheduled_at ? new Date(scheduled_at) : null,
      notes: notes || "",
    })
    .returning();

  await logAction(req, "CREATE", "telemedicine_session", session.id);

  // Notify patient
  try {
    broadcastToUser(Number(patient_id), {
      event: "telemedicine_scheduled",
      data: { session_id: session.id, room_url: roomUrl, scheduled_at },
    });
  } catch {}

  res.status(201).json({ ...session, join_url: roomUrl });
});

// ── GET /telemedicine-sessions/:id/ ──────────────────────────────────────────
router.get("/telemedicine-sessions/:id/", requireAuth, async (req, res) => {
  const user = req.user!;
  const id = Number(req.params.id);

  const [row] = await db
    .select({ session: telemedicineSessionsTable, doctor: { firstName: usersTable.firstName, lastName: usersTable.lastName } })
    .from(telemedicineSessionsTable)
    .leftJoin(usersTable, eq(telemedicineSessionsTable.doctorId, usersTable.id))
    .where(eq(telemedicineSessionsTable.id, id));

  if (!row) { res.status(404).json({ detail: "Session not found." }); return; }

  const s = row.session;
  if (user.role === "patient" && s.patientId !== user.id) {
    res.status(403).json({ detail: "Forbidden." }); return;
  }
  if (user.role === "doctor" && s.doctorId !== user.id) {
    res.status(403).json({ detail: "Forbidden." }); return;
  }

  res.json({ ...s, doctor_name: row.doctor ? `Dr. ${row.doctor.firstName} ${row.doctor.lastName}` : "", join_url: s.roomUrl });
});

// ── PATCH /telemedicine-sessions/:id/ ────────────────────────────────────────
router.patch("/telemedicine-sessions/:id/", requireAuth, async (req, res) => {
  const user = req.user!;
  const id = Number(req.params.id);
  const { status, notes, duration_minutes } = req.body;

  const [existing] = await db.select().from(telemedicineSessionsTable).where(eq(telemedicineSessionsTable.id, id));
  if (!existing) { res.status(404).json({ detail: "Session not found." }); return; }

  const updates: Partial<typeof telemedicineSessionsTable.$inferInsert> = {};
  if (status) {
    updates.status = status;
    if (status === "in_progress") updates.startedAt = new Date();
    if (status === "completed" || status === "cancelled") updates.endedAt = new Date();
  }
  if (notes !== undefined) updates.notes = notes;
  if (duration_minutes !== undefined) updates.durationMinutes = Number(duration_minutes);

  const [updated] = await db
    .update(telemedicineSessionsTable)
    .set(updates)
    .where(eq(telemedicineSessionsTable.id, id))
    .returning();

  await logAction(req, "UPDATE", "telemedicine_session", id);
  res.json({ ...updated, join_url: updated.roomUrl });
});

// ── DELETE /telemedicine-sessions/:id/ ───────────────────────────────────────
router.delete("/telemedicine-sessions/:id/", requireAuth, requireRole("admin", "doctor"), async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(telemedicineSessionsTable).where(eq(telemedicineSessionsTable.id, id));
  await logAction(req, "DELETE", "telemedicine_session", id);
  res.status(204).end();
});

export default router;
