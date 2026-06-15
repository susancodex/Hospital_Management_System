import { Router } from "express";
import { db, appointmentsTable, usersTable, notificationsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, requireRole, formatUser } from "../lib/auth";
import { logAction } from "../lib/audit";

const router = Router();

function formatAppt(appt: typeof appointmentsTable.$inferSelect, patient?: typeof usersTable.$inferSelect | null) {
  return {
    id: appt.id,
    patient_id: appt.patientId,
    doctor_id: appt.doctorId,
    date: appt.date,
    time: appt.time,
    status: appt.status,
    reason: appt.reason,
    notes: appt.notes,
    patient: patient ? formatUser(patient) : null,
    patient_name: patient ? `${patient.firstName} ${patient.lastName}`.trim() : "",
    created_at: appt.createdAt,
  };
}

// GET list — admin: all; doctor: their appointments; patient: their own
router.get("/appointments/", requireAuth, async (req, res) => {
  const user = req.user!;
  const { status } = req.query as Record<string, string>;

  let query = db
    .select({ appt: appointmentsTable, patient: usersTable })
    .from(appointmentsTable)
    .leftJoin(usersTable, eq(appointmentsTable.patientId, usersTable.id))
    .$dynamic();

  if (user.role === "patient") {
    query = query.where(eq(appointmentsTable.patientId, user.id)) as typeof query;
  } else if (user.role === "doctor") {
    query = query.where(eq(appointmentsTable.doctorId, user.id)) as typeof query;
  }

  const rows = await query.orderBy(desc(appointmentsTable.id));
  let results = rows.map((r) => formatAppt(r.appt, r.patient ?? null));

  if (status) results = results.filter((a) => a.status === status);

  res.json(results);
});

// POST — admin creates any; doctor books for a patient; patient books their own
router.post("/appointments/", requireAuth, async (req, res) => {
  const user = req.user!;
  let { patient_id, doctor_id, date, time, status, reason, notes } = req.body;

  if (user.role === "patient") {
    // Patients can only book for themselves
    patient_id = user.id;
    // Patients cannot set arbitrary status — always pending
    status = "pending";
  }

  if (!date || !time) {
    res.status(400).json({ detail: "date and time are required." });
    return;
  }

  const [appt] = await db.insert(appointmentsTable).values({
    patientId: patient_id ? Number(patient_id) : null,
    doctorId: doctor_id ? Number(doctor_id) : null,
    date,
    time,
    status: status || "pending",
    reason: reason || "",
    notes: notes || "",
  }).returning();

  // Notify the doctor
  if (appt.doctorId) {
    await db.insert(notificationsTable).values({
      userId: appt.doctorId,
      title: "New Appointment Booking",
      message: `A new appointment has been scheduled for ${appt.date} at ${appt.time}.`,
      type: "appointment",
      relatedType: "appointment",
      relatedId: appt.id,
    }).catch(() => {});
  }

  await logAction(req, "CREATE", "appointment", appt.id);
  const [patient] = appt.patientId
    ? await db.select().from(usersTable).where(eq(usersTable.id, appt.patientId))
    : [null];
  res.status(201).json(formatAppt(appt, patient ?? null));
});

// GET single — admin: any; doctor: own; patient: own
router.get("/appointments/:id/", requireAuth, async (req, res) => {
  const user = req.user!;
  const [row] = await db
    .select({ appt: appointmentsTable, patient: usersTable })
    .from(appointmentsTable)
    .leftJoin(usersTable, eq(appointmentsTable.patientId, usersTable.id))
    .where(eq(appointmentsTable.id, Number(req.params.id)));
  if (!row) { res.status(404).json({ detail: "Not found." }); return; }

  if (user.role === "patient" && row.appt.patientId !== user.id) {
    res.status(403).json({ detail: "Access denied." }); return;
  }
  if (user.role === "doctor" && row.appt.doctorId !== user.id) {
    res.status(403).json({ detail: "Access denied." }); return;
  }

  res.json(formatAppt(row.appt, row.patient ?? null));
});

// PUT — admin: full edit; doctor: status + notes on own appointments; patient: cancel own only
router.put("/appointments/:id/", requireAuth, async (req, res) => {
  const user = req.user!;
  const [row] = await db
    .select({ appt: appointmentsTable, patient: usersTable })
    .from(appointmentsTable)
    .leftJoin(usersTable, eq(appointmentsTable.patientId, usersTable.id))
    .where(eq(appointmentsTable.id, Number(req.params.id)));
  if (!row) { res.status(404).json({ detail: "Not found." }); return; }

  if (user.role === "patient") {
    if (row.appt.patientId !== user.id) {
      res.status(403).json({ detail: "Access denied." }); return;
    }
    // Patients can only cancel their own appointments
    const { status } = req.body;
    if (status && status !== "cancelled") {
      res.status(403).json({ detail: "Patients can only cancel appointments." }); return;
    }
    await db.update(appointmentsTable).set({ status: "cancelled", updatedAt: new Date() }).where(eq(appointmentsTable.id, Number(req.params.id)));
    await logAction(req, "UPDATE", "appointment", Number(req.params.id), "Patient cancelled");
    const [updated] = await db.select({ appt: appointmentsTable, patient: usersTable }).from(appointmentsTable).leftJoin(usersTable, eq(appointmentsTable.patientId, usersTable.id)).where(eq(appointmentsTable.id, Number(req.params.id)));
    res.json(formatAppt(updated.appt, updated.patient ?? null));
    return;
  }

  if (user.role === "doctor") {
    if (row.appt.doctorId !== user.id) {
      res.status(403).json({ detail: "Access denied." }); return;
    }
    // Doctors can update status and notes on their own appointments
    const { status, notes } = req.body;
    await db.update(appointmentsTable).set({
      status: status || undefined,
      notes: notes !== undefined ? notes : undefined,
      updatedAt: new Date(),
    }).where(eq(appointmentsTable.id, Number(req.params.id)));
    await logAction(req, "UPDATE", "appointment", Number(req.params.id));
    const [updated] = await db.select({ appt: appointmentsTable, patient: usersTable }).from(appointmentsTable).leftJoin(usersTable, eq(appointmentsTable.patientId, usersTable.id)).where(eq(appointmentsTable.id, Number(req.params.id)));
    res.json(formatAppt(updated.appt, updated.patient ?? null));
    return;
  }

  // Admin: full edit
  const { status, date, time, reason, notes, doctor_id, patient_id } = req.body;
  await db.update(appointmentsTable).set({
    status: status || undefined,
    date: date || undefined,
    time: time || undefined,
    reason: reason !== undefined ? reason : undefined,
    notes: notes !== undefined ? notes : undefined,
    doctorId: doctor_id ? Number(doctor_id) : undefined,
    patientId: patient_id ? Number(patient_id) : undefined,
    updatedAt: new Date(),
  }).where(eq(appointmentsTable.id, Number(req.params.id)));
  await logAction(req, "UPDATE", "appointment", Number(req.params.id));
  const [updated] = await db.select({ appt: appointmentsTable, patient: usersTable }).from(appointmentsTable).leftJoin(usersTable, eq(appointmentsTable.patientId, usersTable.id)).where(eq(appointmentsTable.id, Number(req.params.id)));
  res.json(formatAppt(updated.appt, updated.patient ?? null));
});

// DELETE — admin only
router.delete("/appointments/:id/", requireAuth, requireRole("admin"), async (req, res) => {
  const [row] = await db.select().from(appointmentsTable).where(eq(appointmentsTable.id, Number(req.params.id)));
  if (!row) { res.status(404).json({ detail: "Not found." }); return; }
  await db.delete(appointmentsTable).where(eq(appointmentsTable.id, Number(req.params.id)));
  await logAction(req, "DELETE", "appointment", Number(req.params.id));
  res.status(204).send();
});

export default router;
