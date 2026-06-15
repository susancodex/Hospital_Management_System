import { Router } from "express";
import { db, medicalRecordsTable, medicalReportsTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, formatUser } from "../lib/auth";

const router = Router();

function formatRecord(r: typeof medicalRecordsTable.$inferSelect) {
  return {
    id: r.id,
    patient_id: r.patientId,
    doctor_id: r.doctorId,
    appointment_id: r.appointmentId,
    diagnosis: r.diagnosis,
    treatment: r.treatment,
    prescription: r.prescription,
    notes: r.notes,
    created_at: r.createdAt,
    updated_at: r.updatedAt,
  };
}

function formatReport(r: typeof medicalReportsTable.$inferSelect) {
  return {
    id: r.id,
    patient_id: r.patientId,
    doctor_id: r.doctorId,
    title: r.title,
    report_type: r.reportType,
    file_url: r.fileUrl,
    description: r.description,
    created_at: r.createdAt,
  };
}

router.get("/medical-records/", requireAuth, async (req, res) => {
  const rows = await db.select().from(medicalRecordsTable).orderBy(desc(medicalRecordsTable.id));
  let results = rows.map(formatRecord);
  const { patient_id, doctor_id } = req.query as Record<string, string>;
  if (patient_id) results = results.filter((r) => String(r.patient_id) === patient_id);
  if (doctor_id) results = results.filter((r) => String(r.doctor_id) === doctor_id);
  res.json(results);
});

router.post("/medical-records/", requireAuth, async (req, res) => {
  const { patient_id, doctor_id, appointment_id, diagnosis, treatment, prescription, notes } = req.body;
  const [record] = await db.insert(medicalRecordsTable).values({
    patientId: patient_id ? Number(patient_id) : null,
    doctorId: doctor_id ? Number(doctor_id) : null,
    appointmentId: appointment_id ? Number(appointment_id) : null,
    diagnosis: diagnosis || "",
    treatment: treatment || "",
    prescription: prescription || "",
    notes: notes || "",
  }).returning();
  res.status(201).json(formatRecord(record));
});

router.get("/medical-records/:id/", requireAuth, async (req, res) => {
  const [record] = await db.select().from(medicalRecordsTable).where(eq(medicalRecordsTable.id, Number(req.params.id)));
  if (!record) { res.status(404).json({ detail: "Not found." }); return; }
  res.json(formatRecord(record));
});

router.put("/medical-records/:id/", requireAuth, async (req, res) => {
  const { diagnosis, treatment, prescription, notes } = req.body;
  await db.update(medicalRecordsTable).set({ diagnosis: diagnosis || "", treatment: treatment || "", prescription: prescription || "", notes: notes || "", updatedAt: new Date() }).where(eq(medicalRecordsTable.id, Number(req.params.id)));
  const [record] = await db.select().from(medicalRecordsTable).where(eq(medicalRecordsTable.id, Number(req.params.id)));
  res.json(formatRecord(record));
});

router.delete("/medical-records/:id/", requireAuth, async (req, res) => {
  await db.delete(medicalRecordsTable).where(eq(medicalRecordsTable.id, Number(req.params.id)));
  res.status(204).send();
});

router.get("/medical-reports/", requireAuth, async (req, res) => {
  const rows = await db.select().from(medicalReportsTable).orderBy(desc(medicalReportsTable.id));
  let results = rows.map(formatReport);
  const { patient_id, doctor_id } = req.query as Record<string, string>;
  if (patient_id) results = results.filter((r) => String(r.patient_id) === patient_id);
  if (doctor_id) results = results.filter((r) => String(r.doctor_id) === doctor_id);
  res.json(results);
});

router.post("/medical-reports/", requireAuth, async (req, res) => {
  const { patient_id, doctor_id, title, report_type, file_url, description } = req.body;
  const [report] = await db.insert(medicalReportsTable).values({
    patientId: patient_id ? Number(patient_id) : null,
    doctorId: doctor_id ? Number(doctor_id) : null,
    title: title || "Report",
    reportType: report_type || "",
    fileUrl: file_url || "",
    description: description || "",
  }).returning();
  res.status(201).json(formatReport(report));
});

router.get("/medical-reports/:id/", requireAuth, async (req, res) => {
  const [report] = await db.select().from(medicalReportsTable).where(eq(medicalReportsTable.id, Number(req.params.id)));
  if (!report) { res.status(404).json({ detail: "Not found." }); return; }
  res.json(formatReport(report));
});

router.put("/medical-reports/:id/", requireAuth, async (req, res) => {
  const { title, report_type, file_url, description } = req.body;
  await db.update(medicalReportsTable).set({ title: title || undefined, reportType: report_type || undefined, fileUrl: file_url || undefined, description: description || undefined }).where(eq(medicalReportsTable.id, Number(req.params.id)));
  const [report] = await db.select().from(medicalReportsTable).where(eq(medicalReportsTable.id, Number(req.params.id)));
  res.json(formatReport(report));
});

router.delete("/medical-reports/:id/", requireAuth, async (req, res) => {
  await db.delete(medicalReportsTable).where(eq(medicalReportsTable.id, Number(req.params.id)));
  res.status(204).send();
});

export default router;
