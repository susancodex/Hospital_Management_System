import { Router } from "express";
import { db, labOrdersTable, labResultsTable, usersTable, appointmentsTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { requireAuth, requireRole, formatUser } from "../lib/auth";
import { logAction } from "../lib/audit";

const router = Router();

function generateOrderNumber() {
  const prefix = "LAB";
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}-${date}-${rand}`;
}

function formatOrder(order: typeof labOrdersTable.$inferSelect, patient?: typeof usersTable.$inferSelect | null, doctor?: typeof usersTable.$inferSelect | null) {
  return {
    id: order.id,
    order_number: order.orderNumber,
    patient_id: order.patientId,
    doctor_id: order.doctorId,
    appointment_id: order.appointmentId,
    tests: order.tests,
    status: order.status,
    priority: order.priority,
    clinical_notes: order.clinicalNotes,
    collected_at: order.collectedAt,
    completed_at: order.completedAt,
    created_at: order.createdAt,
    patient_name: patient ? `${patient.firstName} ${patient.lastName}`.trim() : "",
    doctor_name: doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}`.trim() : "",
  };
}

// GET /lab-orders/ — list (filtered by role)
router.get("/lab-orders/", requireAuth, async (req, res) => {
  const user = req.user!;
  const { status, priority } = req.query as Record<string, string>;

  let rows = await db
    .select({
      order: labOrdersTable,
      patient: usersTable,
    })
    .from(labOrdersTable)
    .leftJoin(usersTable, eq(labOrdersTable.patientId, usersTable.id))
    .orderBy(desc(labOrdersTable.id));

  if (user.role === "patient") {
    rows = rows.filter((r) => r.order.patientId === user.id);
  } else if (user.role === "doctor") {
    rows = rows.filter((r) => r.order.doctorId === user.id);
  }

  let results = rows.map((r) => formatOrder(r.order, r.patient ?? null));
  if (status) results = results.filter((o) => o.status === status);
  if (priority) results = results.filter((o) => o.priority === priority);

  res.json(results);
});

// POST /lab-orders/ — create new order
router.post("/lab-orders/", requireAuth, requireRole("doctor", "admin"), async (req, res) => {
  const user = req.user!;
  const { patient_id, appointment_id, tests, priority = "routine", clinical_notes } = req.body;

  if (!patient_id) { res.status(400).json({ detail: "patient_id is required." }); return; }
  if (!tests || !Array.isArray(tests) || tests.length === 0) { res.status(400).json({ detail: "At least one test is required." }); return; }

  const orderNumber = generateOrderNumber();

  const [order] = await db.insert(labOrdersTable).values({
    orderNumber,
    patientId: Number(patient_id),
    doctorId: user.id,
    appointmentId: appointment_id ? Number(appointment_id) : null,
    tests,
    status: "pending",
    priority,
    clinicalNotes: clinical_notes || "",
  }).returning();

  await logAction(req, "CREATE", "lab_order", order.id);
  const [patient] = await db.select().from(usersTable).where(eq(usersTable.id, order.patientId!));
  res.status(201).json(formatOrder(order, patient ?? null));
});

// GET /lab-orders/:id/ — single order with results
router.get("/lab-orders/:id/", requireAuth, async (req, res) => {
  const user = req.user!;
  const id = Number(req.params.id);

  const [row] = await db
    .select({ order: labOrdersTable, patient: usersTable })
    .from(labOrdersTable)
    .leftJoin(usersTable, eq(labOrdersTable.patientId, usersTable.id))
    .where(eq(labOrdersTable.id, id));

  if (!row) { res.status(404).json({ detail: "Not found." }); return; }

  if (user.role === "patient" && row.order.patientId !== user.id) {
    res.status(403).json({ detail: "Access denied." }); return;
  }

  const results = await db.select().from(labResultsTable).where(eq(labResultsTable.labOrderId, id)).orderBy(labResultsTable.id);

  res.json({ ...formatOrder(row.order, row.patient ?? null), results });
});

// PUT /lab-orders/:id/ — update status / notes
router.put("/lab-orders/:id/", requireAuth, requireRole("doctor", "admin", "lab_tech"), async (req, res) => {
  const id = Number(req.params.id);
  const [order] = await db.select().from(labOrdersTable).where(eq(labOrdersTable.id, id));
  if (!order) { res.status(404).json({ detail: "Not found." }); return; }

  const { status, priority, clinical_notes, collected_at, completed_at } = req.body;

  await db.update(labOrdersTable).set({
    status: status || undefined,
    priority: priority || undefined,
    clinicalNotes: clinical_notes !== undefined ? clinical_notes : undefined,
    collectedAt: collected_at ? new Date(collected_at) : (status === "collected" ? new Date() : undefined),
    completedAt: completed_at ? new Date(completed_at) : (status === "completed" ? new Date() : undefined),
    updatedAt: new Date(),
  }).where(eq(labOrdersTable.id, id));

  await logAction(req, "UPDATE", "lab_order", id, status ? `Status: ${status}` : undefined);
  const [updated] = await db.select({ order: labOrdersTable, patient: usersTable }).from(labOrdersTable).leftJoin(usersTable, eq(labOrdersTable.patientId, usersTable.id)).where(eq(labOrdersTable.id, id));
  res.json(formatOrder(updated.order, updated.patient ?? null));
});

// POST /lab-orders/:id/results/ — add/update results
router.post("/lab-orders/:id/results/", requireAuth, requireRole("doctor", "admin", "lab_tech"), async (req, res) => {
  const id = Number(req.params.id);
  const user = req.user!;
  const [order] = await db.select().from(labOrdersTable).where(eq(labOrdersTable.id, id));
  if (!order) { res.status(404).json({ detail: "Lab order not found." }); return; }

  const { results } = req.body;
  if (!results || !Array.isArray(results) || results.length === 0) {
    res.status(400).json({ detail: "results array is required." }); return;
  }

  const inserted = [];
  for (const r of results) {
    const [row] = await db.insert(labResultsTable).values({
      labOrderId: id,
      patientId: order.patientId,
      testName: r.test_name || "",
      testCode: r.test_code || "",
      resultValue: r.result_value || "",
      unit: r.unit || "",
      referenceRange: r.reference_range || "",
      status: r.status || "pending",
      abnormalFlag: r.abnormal_flag || "",
      reviewedBy: user.id,
      reportedAt: new Date(),
    }).returning();
    inserted.push(row);
  }

  // Auto-update order status to completed if results are in
  if (order.status !== "completed") {
    await db.update(labOrdersTable).set({ status: "completed", completedAt: new Date(), updatedAt: new Date() }).where(eq(labOrdersTable.id, id));
  }

  await logAction(req, "ADD_RESULTS", "lab_order", id, `${inserted.length} results added`);
  res.status(201).json({ results: inserted, message: `${inserted.length} results added successfully.` });
});

// DELETE /lab-orders/:id/ — admin only
router.delete("/lab-orders/:id/", requireAuth, requireRole("admin"), async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(labResultsTable).where(eq(labResultsTable.labOrderId, id));
  await db.delete(labOrdersTable).where(eq(labOrdersTable.id, id));
  await logAction(req, "DELETE", "lab_order", id);
  res.status(204).send();
});

export default router;
