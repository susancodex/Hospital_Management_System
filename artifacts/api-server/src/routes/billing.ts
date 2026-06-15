import { Router } from "express";
import { db, billingTable, billingPaymentsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth";
import { logAction } from "../lib/audit";

const router = Router();

function formatBill(b: typeof billingTable.$inferSelect) {
  return {
    id: b.id,
    patient_id: b.patientId,
    doctor_id: b.doctorId,
    appointment_id: b.appointmentId,
    amount: b.amount,
    status: b.status,
    description: b.description,
    invoice_date: b.invoiceDate,
    due_date: b.dueDate,
    insurance_provider: b.insuranceProvider,
    claim_number: b.claimNumber,
    created_at: b.createdAt,
  };
}

function formatPayment(p: typeof billingPaymentsTable.$inferSelect) {
  return {
    id: p.id,
    billing_id: p.billingId,
    amount: p.amount,
    payment_method: p.paymentMethod,
    status: p.status,
    transaction_id: p.transactionId,
    created_at: p.createdAt,
  };
}

// GET list — admin: all; patient: own; doctor: bills they're associated with
router.get("/billing/", requireAuth, async (req, res) => {
  const user = req.user!;

  let query = db.select().from(billingTable).orderBy(desc(billingTable.id)).$dynamic();

  if (user.role === "patient") {
    query = query.where(eq(billingTable.patientId, user.id)) as typeof query;
  } else if (user.role === "doctor") {
    query = query.where(eq(billingTable.doctorId, user.id)) as typeof query;
  }

  const rows = await query;
  let results = rows.map(formatBill);

  const { status } = req.query as Record<string, string>;
  if (status) results = results.filter((b) => b.status === status);

  res.json(results);
});

// POST — admin only
router.post("/billing/", requireAuth, requireRole("admin"), async (req, res) => {
  const { patient_id, doctor_id, appointment_id, amount, status, description, invoice_date, due_date, insurance_provider, claim_number } = req.body;
  const [bill] = await db.insert(billingTable).values({
    patientId: patient_id ? Number(patient_id) : null,
    doctorId: doctor_id ? Number(doctor_id) : null,
    appointmentId: appointment_id ? Number(appointment_id) : null,
    amount: amount || "0",
    status: status || "pending",
    description: description || "",
    invoiceDate: invoice_date || null,
    dueDate: due_date || null,
    insuranceProvider: insurance_provider || "",
    claimNumber: claim_number || "",
  }).returning();
  await logAction(req, "CREATE", "billing", bill.id);
  res.status(201).json(formatBill(bill));
});

// GET single — admin: any; patient: own; doctor: associated
router.get("/billing/:id/", requireAuth, async (req, res) => {
  const user = req.user!;
  const [bill] = await db.select().from(billingTable).where(eq(billingTable.id, Number(req.params.id)));
  if (!bill) { res.status(404).json({ detail: "Not found." }); return; }
  if (user.role === "patient" && bill.patientId !== user.id) {
    res.status(403).json({ detail: "Access denied." }); return;
  }
  if (user.role === "doctor" && bill.doctorId !== user.id) {
    res.status(403).json({ detail: "Access denied." }); return;
  }
  res.json(formatBill(bill));
});

// PUT — admin only
router.put("/billing/:id/", requireAuth, requireRole("admin"), async (req, res) => {
  const [bill] = await db.select().from(billingTable).where(eq(billingTable.id, Number(req.params.id)));
  if (!bill) { res.status(404).json({ detail: "Not found." }); return; }
  const { amount, status, description, due_date, insurance_provider, claim_number } = req.body;
  await db.update(billingTable).set({
    amount: amount || undefined,
    status: status || undefined,
    description: description || undefined,
    dueDate: due_date || undefined,
    insuranceProvider: insurance_provider || undefined,
    claimNumber: claim_number || undefined,
  }).where(eq(billingTable.id, Number(req.params.id)));
  await logAction(req, "UPDATE", "billing", Number(req.params.id));
  const [updated] = await db.select().from(billingTable).where(eq(billingTable.id, Number(req.params.id)));
  res.json(formatBill(updated));
});

// DELETE — admin only
router.delete("/billing/:id/", requireAuth, requireRole("admin"), async (req, res) => {
  const [bill] = await db.select().from(billingTable).where(eq(billingTable.id, Number(req.params.id)));
  if (!bill) { res.status(404).json({ detail: "Not found." }); return; }
  await db.delete(billingTable).where(eq(billingTable.id, Number(req.params.id)));
  await logAction(req, "DELETE", "billing", Number(req.params.id));
  res.status(204).send();
});

router.post("/billing/:id/esewa/initiate/", requireAuth, async (req, res) => {
  res.json({ detail: "eSewa payment initiation not configured.", redirect_url: null });
});

router.post("/billing/:id/bank-transfer/initiate/", requireAuth, async (req, res) => {
  res.json({ detail: "Bank transfer not configured.", redirect_url: null });
});

// ── Billing Payments ──────────────────────────────────────────────────────────

// GET list — admin: all; patient: own (via billing); doctor: own
router.get("/billing-payments/", requireAuth, async (req, res) => {
  const user = req.user!;
  const rows = await db.select().from(billingPaymentsTable).orderBy(desc(billingPaymentsTable.id));

  if (user.role === "admin") {
    res.json(rows.map(formatPayment));
    return;
  }

  // For non-admin: fetch their billing IDs first, then filter payments
  let billingQuery = db.select({ id: billingTable.id }).from(billingTable).$dynamic();
  if (user.role === "patient") {
    billingQuery = billingQuery.where(eq(billingTable.patientId, user.id)) as typeof billingQuery;
  } else if (user.role === "doctor") {
    billingQuery = billingQuery.where(eq(billingTable.doctorId, user.id)) as typeof billingQuery;
  }
  const myBills = await billingQuery;
  const myBillIds = new Set(myBills.map((b) => b.id));
  res.json(rows.filter((p) => myBillIds.has(p.billingId!)).map(formatPayment));
});

// POST — admin only
router.post("/billing-payments/", requireAuth, requireRole("admin"), async (req, res) => {
  const { billing_id, amount, payment_method, status, transaction_id } = req.body;
  const [payment] = await db.insert(billingPaymentsTable).values({
    billingId: billing_id ? Number(billing_id) : null,
    amount: amount || "0",
    paymentMethod: payment_method || "cash",
    status: status || "pending",
    transactionId: transaction_id || "",
  }).returning();
  await logAction(req, "CREATE", "billing_payment", payment.id);
  res.status(201).json(formatPayment(payment));
});

// GET single — admin or own
router.get("/billing-payments/:id/", requireAuth, async (req, res) => {
  const user = req.user!;
  const [payment] = await db.select().from(billingPaymentsTable).where(eq(billingPaymentsTable.id, Number(req.params.id)));
  if (!payment) { res.status(404).json({ detail: "Not found." }); return; }

  if (user.role !== "admin" && payment.billingId) {
    const [bill] = await db.select().from(billingTable).where(eq(billingTable.id, payment.billingId));
    if (!bill) { res.status(404).json({ detail: "Not found." }); return; }
    if (user.role === "patient" && bill.patientId !== user.id) {
      res.status(403).json({ detail: "Access denied." }); return;
    }
    if (user.role === "doctor" && bill.doctorId !== user.id) {
      res.status(403).json({ detail: "Access denied." }); return;
    }
  }

  res.json(formatPayment(payment));
});

// PUT / verify — admin only
router.put("/billing-payments/:id/", requireAuth, requireRole("admin"), async (req, res) => {
  const { status, transaction_id } = req.body;
  await db.update(billingPaymentsTable).set({ status: status || undefined, transactionId: transaction_id || undefined }).where(eq(billingPaymentsTable.id, Number(req.params.id)));
  const [payment] = await db.select().from(billingPaymentsTable).where(eq(billingPaymentsTable.id, Number(req.params.id)));
  res.json(formatPayment(payment));
});

router.delete("/billing-payments/:id/", requireAuth, requireRole("admin"), async (req, res) => {
  await db.delete(billingPaymentsTable).where(eq(billingPaymentsTable.id, Number(req.params.id)));
  res.status(204).send();
});

router.post("/billing-payments/:id/verify/", requireAuth, requireRole("admin"), async (req, res) => {
  await db.update(billingPaymentsTable).set({ status: "verified" }).where(eq(billingPaymentsTable.id, Number(req.params.id)));
  const [payment] = await db.select().from(billingPaymentsTable).where(eq(billingPaymentsTable.id, Number(req.params.id)));
  res.json(formatPayment(payment));
});

export default router;
