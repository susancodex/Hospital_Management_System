import { Router } from "express";
import { db, medicalRecordsTable, medicalReportsTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, requireRole, formatUser } from "../lib/auth";
import { logAction } from "../lib/audit";

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
    status: r.status,
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
    status: r.status,
    findings: r.findings,
    recommendations: r.recommendations,
    created_at: r.createdAt,
  };
}

// ── Medical Records ───────────────────────────────────────────────────────────

// GET list — admin/doctor: all (or filtered); patient: own only
router.get("/medical-records/", requireAuth, async (req, res) => {
  const user = req.user!;

  let query = db.select().from(medicalRecordsTable).orderBy(desc(medicalRecordsTable.id)).$dynamic();

  if (user.role === "patient") {
    query = query.where(eq(medicalRecordsTable.patientId, user.id)) as typeof query;
  } else if (user.role === "doctor") {
    // Doctor sees records for their patients (records they created)
    query = query.where(eq(medicalRecordsTable.doctorId, user.id)) as typeof query;
  }

  const rows = await query;
  res.json(rows.map(formatRecord));
});

// POST — doctor/admin only
router.post("/medical-records/", requireAuth, requireRole("doctor", "admin"), async (req, res) => {
  const { patient_id, doctor_id, appointment_id, diagnosis, treatment, prescription, notes, status } = req.body;
  if (!patient_id || !diagnosis) {
    res.status(400).json({ detail: "patient_id and diagnosis are required." });
    return;
  }
  const effectiveDoctorId = req.user!.role === "doctor" ? req.user!.id : (doctor_id ? Number(doctor_id) : null);
  const [record] = await db.insert(medicalRecordsTable).values({
    patientId: Number(patient_id),
    doctorId: effectiveDoctorId,
    appointmentId: appointment_id ? Number(appointment_id) : null,
    diagnosis: diagnosis || "",
    treatment: treatment || "",
    prescription: prescription || "",
    notes: notes || "",
    status: status || "draft",
  }).returning();
  await logAction(req, "CREATE", "medical_record", record.id);
  res.status(201).json(formatRecord(record));
});

// GET single — admin/doctor: any; patient: own only
router.get("/medical-records/:id/", requireAuth, async (req, res) => {
  const user = req.user!;
  const [record] = await db.select().from(medicalRecordsTable).where(eq(medicalRecordsTable.id, Number(req.params.id)));
  if (!record) { res.status(404).json({ detail: "Not found." }); return; }
  if (user.role === "patient" && record.patientId !== user.id) {
    res.status(403).json({ detail: "Access denied." }); return;
  }
  if (user.role === "doctor" && record.doctorId !== user.id) {
    res.status(403).json({ detail: "Access denied." }); return;
  }
  res.json(formatRecord(record));
});

// PUT — doctor (own records) or admin
router.put("/medical-records/:id/", requireAuth, requireRole("doctor", "admin"), async (req, res) => {
  const user = req.user!;
  const [record] = await db.select().from(medicalRecordsTable).where(eq(medicalRecordsTable.id, Number(req.params.id)));
  if (!record) { res.status(404).json({ detail: "Not found." }); return; }
  if (user.role === "doctor" && record.doctorId !== user.id) {
    res.status(403).json({ detail: "Access denied." }); return;
  }
  const { diagnosis, treatment, prescription, notes, status } = req.body;
  await db.update(medicalRecordsTable).set({
    diagnosis: diagnosis || "",
    treatment: treatment || "",
    prescription: prescription || "",
    notes: notes || "",
    status: status || undefined,
    updatedAt: new Date(),
  }).where(eq(medicalRecordsTable.id, Number(req.params.id)));
  await logAction(req, "UPDATE", "medical_record", Number(req.params.id));
  const [updated] = await db.select().from(medicalRecordsTable).where(eq(medicalRecordsTable.id, Number(req.params.id)));
  res.json(formatRecord(updated));
});

// DELETE — admin only
router.delete("/medical-records/:id/", requireAuth, requireRole("admin"), async (req, res) => {
  const [record] = await db.select().from(medicalRecordsTable).where(eq(medicalRecordsTable.id, Number(req.params.id)));
  if (!record) { res.status(404).json({ detail: "Not found." }); return; }
  await db.delete(medicalRecordsTable).where(eq(medicalRecordsTable.id, Number(req.params.id)));
  await logAction(req, "DELETE", "medical_record", Number(req.params.id));
  res.status(204).send();
});

// ── Medical Reports ───────────────────────────────────────────────────────────

// GET list — admin/doctor: all; patient: own only
router.get("/medical-reports/", requireAuth, async (req, res) => {
  const user = req.user!;

  let query = db.select().from(medicalReportsTable).orderBy(desc(medicalReportsTable.id)).$dynamic();

  if (user.role === "patient") {
    query = query.where(eq(medicalReportsTable.patientId, user.id)) as typeof query;
  } else if (user.role === "doctor") {
    query = query.where(eq(medicalReportsTable.doctorId, user.id)) as typeof query;
  }

  const rows = await query;
  res.json(rows.map(formatReport));
});

// POST — doctor/admin only
router.post("/medical-reports/", requireAuth, requireRole("doctor", "admin"), async (req, res) => {
  const { patient_id, doctor_id, title, report_type, file_url, description, status, findings, recommendations } = req.body;
  if (!title) { res.status(400).json({ detail: "title is required." }); return; }
  const effectiveDoctorId = req.user!.role === "doctor" ? req.user!.id : (doctor_id ? Number(doctor_id) : null);
  const [report] = await db.insert(medicalReportsTable).values({
    patientId: patient_id ? Number(patient_id) : null,
    doctorId: effectiveDoctorId,
    title,
    reportType: report_type || "",
    fileUrl: file_url || "",
    description: description || "",
    status: status || "draft",
    findings: findings || "",
    recommendations: recommendations || "",
  }).returning();
  await logAction(req, "CREATE", "medical_report", report.id);
  res.status(201).json(formatReport(report));
});

// GET single — admin/doctor: any; patient: own only
router.get("/medical-reports/:id/", requireAuth, async (req, res) => {
  const user = req.user!;
  const [report] = await db.select().from(medicalReportsTable).where(eq(medicalReportsTable.id, Number(req.params.id)));
  if (!report) { res.status(404).json({ detail: "Not found." }); return; }
  if (user.role === "patient" && report.patientId !== user.id) {
    res.status(403).json({ detail: "Access denied." }); return;
  }
  if (user.role === "doctor" && report.doctorId !== user.id) {
    res.status(403).json({ detail: "Access denied." }); return;
  }
  res.json(formatReport(report));
});

// PUT — doctor (own) or admin
router.put("/medical-reports/:id/", requireAuth, requireRole("doctor", "admin"), async (req, res) => {
  const user = req.user!;
  const [report] = await db.select().from(medicalReportsTable).where(eq(medicalReportsTable.id, Number(req.params.id)));
  if (!report) { res.status(404).json({ detail: "Not found." }); return; }
  if (user.role === "doctor" && report.doctorId !== user.id) {
    res.status(403).json({ detail: "Access denied." }); return;
  }
  const { title, report_type, file_url, description, status, findings, recommendations } = req.body;
  await db.update(medicalReportsTable).set({
    title: title || undefined,
    reportType: report_type || undefined,
    fileUrl: file_url || undefined,
    description: description || undefined,
    status: status || undefined,
    findings: findings || undefined,
    recommendations: recommendations || undefined,
  }).where(eq(medicalReportsTable.id, Number(req.params.id)));
  await logAction(req, "UPDATE", "medical_report", Number(req.params.id));
  const [updated] = await db.select().from(medicalReportsTable).where(eq(medicalReportsTable.id, Number(req.params.id)));
  res.json(formatReport(updated));
});

// DELETE — admin only
router.delete("/medical-reports/:id/", requireAuth, requireRole("admin"), async (req, res) => {
  const [report] = await db.select().from(medicalReportsTable).where(eq(medicalReportsTable.id, Number(req.params.id)));
  if (!report) { res.status(404).json({ detail: "Not found." }); return; }
  await db.delete(medicalReportsTable).where(eq(medicalReportsTable.id, Number(req.params.id)));
  await logAction(req, "DELETE", "medical_report", Number(req.params.id));
  res.status(204).send();
});

export default router;
