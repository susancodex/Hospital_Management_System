import { Router } from "express";
import { db, prescriptionsTable, usersTable, appointmentsTable, notificationsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth";
import { logAction } from "../lib/audit";

const router = Router();

function formatPrescription(rx: any, patient?: any, doctor?: any) {
  return {
    id: rx.id,
    patient_id: rx.patientId,
    doctor_id: rx.doctorId,
    appointment_id: rx.appointmentId,
    medicines: rx.medicines ?? [],
    instructions: rx.instructions,
    status: rx.status,
    valid_until: rx.validUntil,
    created_at: rx.createdAt,
    updated_at: rx.updatedAt,
    patient_name: patient ? `${patient.firstName} ${patient.lastName}` : undefined,
    doctor_name: doctor ? `${doctor.firstName} ${doctor.lastName}` : undefined,
  };
}

router.get("/prescriptions/", requireAuth, async (req, res) => {
  const user = req.user!;
  let query = db
    .select({
      rx: prescriptionsTable,
      patient: { firstName: usersTable.firstName, lastName: usersTable.lastName, id: usersTable.id },
    })
    .from(prescriptionsTable)
    .leftJoin(usersTable, eq(prescriptionsTable.patientId, usersTable.id))
    .$dynamic();

  if (user.role === "patient") {
    query = query.where(eq(prescriptionsTable.patientId, user.id)) as typeof query;
  } else if (user.role === "doctor") {
    query = query.where(eq(prescriptionsTable.doctorId, user.id)) as typeof query;
  }

  const rows = await query.orderBy(desc(prescriptionsTable.createdAt));

  const doctorIds = [...new Set(rows.map((r) => r.rx.doctorId).filter(Boolean))] as number[];
  const doctorUsers = doctorIds.length
    ? await db.select({ id: usersTable.id, firstName: usersTable.firstName, lastName: usersTable.lastName }).from(usersTable).where(eq(usersTable.id, doctorIds[0]))
    : [];

  const result = rows.map((r) => {
    const doc = doctorUsers.find((d) => d.id === r.rx.doctorId);
    return formatPrescription(r.rx, r.patient, doc);
  });

  res.json(result);
});

router.post("/prescriptions/", requireAuth, requireRole("doctor", "admin"), async (req, res) => {
  const { patient_id, appointment_id, medicines, instructions, status, valid_until } = req.body;

  if (!patient_id || !medicines) {
    res.status(400).json({ detail: "patient_id and medicines are required." });
    return;
  }

  const [rx] = await db.insert(prescriptionsTable).values({
    patientId: Number(patient_id),
    doctorId: req.user!.id,
    appointmentId: appointment_id ? Number(appointment_id) : null,
    medicines: medicines ?? [],
    instructions: instructions ?? "",
    status: status ?? "active",
    validUntil: valid_until ?? null,
  }).returning();

  await db.insert(notificationsTable).values({
    userId: Number(patient_id),
    title: "New Prescription",
    message: `Dr. ${req.user!.firstName} ${req.user!.lastName} has issued a new prescription for you.`,
    type: "prescription",
    relatedType: "prescription",
    relatedId: rx.id,
  });

  await logAction(req, "CREATE", "prescription", rx.id, `Created prescription for patient ${patient_id}`);
  res.status(201).json(formatPrescription(rx));
});

router.get("/prescriptions/:id/", requireAuth, async (req, res) => {
  const [rx] = await db.select().from(prescriptionsTable).where(eq(prescriptionsTable.id, Number(req.params.id)));
  if (!rx) { res.status(404).json({ detail: "Not found." }); return; }

  const user = req.user!;
  if (user.role === "patient" && rx.patientId !== user.id) {
    res.status(403).json({ detail: "Access denied." }); return;
  }
  if (user.role === "doctor" && rx.doctorId !== user.id) {
    res.status(403).json({ detail: "Access denied." }); return;
  }

  const [patient] = await db.select({ firstName: usersTable.firstName, lastName: usersTable.lastName }).from(usersTable).where(eq(usersTable.id, rx.patientId!));
  const [doctor] = await db.select({ firstName: usersTable.firstName, lastName: usersTable.lastName }).from(usersTable).where(eq(usersTable.id, rx.doctorId!));

  res.json(formatPrescription(rx, patient, doctor));
});

router.put("/prescriptions/:id/", requireAuth, requireRole("doctor", "admin"), async (req, res) => {
  const [existing] = await db.select().from(prescriptionsTable).where(eq(prescriptionsTable.id, Number(req.params.id)));
  if (!existing) { res.status(404).json({ detail: "Not found." }); return; }

  if (req.user!.role === "doctor" && existing.doctorId !== req.user!.id) {
    res.status(403).json({ detail: "Access denied." }); return;
  }

  const { medicines, instructions, status, valid_until } = req.body;
  const [updated] = await db.update(prescriptionsTable).set({
    medicines: medicines ?? existing.medicines,
    instructions: instructions ?? existing.instructions,
    status: status ?? existing.status,
    validUntil: valid_until ?? existing.validUntil,
    updatedAt: new Date(),
  }).where(eq(prescriptionsTable.id, Number(req.params.id))).returning();

  await logAction(req, "UPDATE", "prescription", updated.id);
  res.json(formatPrescription(updated));
});

router.delete("/prescriptions/:id/", requireAuth, requireRole("doctor", "admin"), async (req, res) => {
  const [existing] = await db.select().from(prescriptionsTable).where(eq(prescriptionsTable.id, Number(req.params.id)));
  if (!existing) { res.status(404).json({ detail: "Not found." }); return; }

  if (req.user!.role === "doctor" && existing.doctorId !== req.user!.id) {
    res.status(403).json({ detail: "Access denied." }); return;
  }

  await db.delete(prescriptionsTable).where(eq(prescriptionsTable.id, Number(req.params.id)));
  await logAction(req, "DELETE", "prescription", Number(req.params.id));
  res.status(204).send();
});

export default router;
