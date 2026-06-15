import { Router } from "express";
import { db, appointmentsTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, formatUser } from "../lib/auth";

const router = Router();

async function getAppointmentData(id: number) {
  const rows = await db
    .select({
      appt: appointmentsTable,
      patient: usersTable,
    })
    .from(appointmentsTable)
    .leftJoin(usersTable, eq(appointmentsTable.patientId, usersTable.id))
    .where(eq(appointmentsTable.id, id));
  return rows[0] ?? null;
}

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

router.get("/appointments/", requireAuth, async (req, res) => {
  const rows = await db
    .select()
    .from(appointmentsTable)
    .leftJoin(usersTable, eq(appointmentsTable.patientId, usersTable.id))
    .orderBy(desc(appointmentsTable.id));

  let results = rows.map((r) => formatAppt(r.appointments, r.users ?? null));

  const { status, patient_id, doctor_id } = req.query as Record<string, string>;
  if (status) results = results.filter((a) => a.status === status);
  if (patient_id) results = results.filter((a) => String(a.patient_id) === patient_id);
  if (doctor_id) results = results.filter((a) => String(a.doctor_id) === doctor_id);

  res.json(results);
});

router.post("/appointments/", requireAuth, async (req, res) => {
  const { patient_id, doctor_id, date, time, status, reason, notes } = req.body;
  const [appt] = await db.insert(appointmentsTable).values({
    patientId: patient_id ? Number(patient_id) : null,
    doctorId: doctor_id ? Number(doctor_id) : null,
    date: date || new Date().toISOString().split("T")[0],
    time: time || "09:00",
    status: status || "pending",
    reason: reason || "",
    notes: notes || "",
  }).returning();
  const data = await getAppointmentData(appt.id);
  res.status(201).json(formatAppt(data?.appt ?? appt, data?.patient));
});

router.get("/appointments/:id/", requireAuth, async (req, res) => {
  const data = await getAppointmentData(Number(req.params.id));
  if (!data) { res.status(404).json({ detail: "Not found." }); return; }
  res.json(formatAppt(data.appt, data.patient ?? null));
});

router.put("/appointments/:id/", requireAuth, async (req, res) => {
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
  const data = await getAppointmentData(Number(req.params.id));
  res.json(formatAppt(data?.appt!, data?.patient ?? null));
});

router.delete("/appointments/:id/", requireAuth, async (req, res) => {
  await db.delete(appointmentsTable).where(eq(appointmentsTable.id, Number(req.params.id)));
  res.status(204).send();
});

export default router;
