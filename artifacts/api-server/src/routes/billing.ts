import { Router } from "express";
import { db, billingTable, billingPaymentsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

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

router.get("/billing/", requireAuth, async (req, res) => {
  const rows = await db.select().from(billingTable).orderBy(desc(billingTable.id));
  let results = rows.map(formatBill);
  const { patient_id, status } = req.query as Record<string, string>;
  if (patient_id) results = results.filter((b) => String(b.patient_id) === patient_id);
  if (status) results = results.filter((b) => b.status === status);
  res.json(results);
});

router.post("/billing/", requireAuth, async (req, res) => {
  const { patient_id, doctor_id, appointment_id, amount, status, description, invoice_date, due_date } = req.body;
  const [bill] = await db.insert(billingTable).values({
    patientId: patient_id ? Number(patient_id) : null,
    doctorId: doctor_id ? Number(doctor_id) : null,
    appointmentId: appointment_id ? Number(appointment_id) : null,
    amount: amount || "0",
    status: status || "pending",
    description: description || "",
    invoiceDate: invoice_date || null,
    dueDate: due_date || null,
  }).returning();
  res.status(201).json(formatBill(bill));
});

router.get("/billing/:id/", requireAuth, async (req, res) => {
  const [bill] = await db.select().from(billingTable).where(eq(billingTable.id, Number(req.params.id)));
  if (!bill) { res.status(404).json({ detail: "Not found." }); return; }
  res.json(formatBill(bill));
});

router.put("/billing/:id/", requireAuth, async (req, res) => {
  const { amount, status, description, due_date } = req.body;
  await db.update(billingTable).set({ amount: amount || undefined, status: status || undefined, description: description || undefined, dueDate: due_date || undefined }).where(eq(billingTable.id, Number(req.params.id)));
  const [bill] = await db.select().from(billingTable).where(eq(billingTable.id, Number(req.params.id)));
  res.json(formatBill(bill));
});

router.delete("/billing/:id/", requireAuth, async (req, res) => {
  await db.delete(billingTable).where(eq(billingTable.id, Number(req.params.id)));
  res.status(204).send();
});

router.post("/billing/:id/esewa/initiate/", requireAuth, async (req, res) => {
  res.json({ detail: "eSewa payment initiation not configured.", redirect_url: null });
});

router.post("/billing/:id/bank-transfer/initiate/", requireAuth, async (req, res) => {
  res.json({ detail: "Bank transfer not configured.", redirect_url: null });
});

router.get("/billing-payments/", requireAuth, async (req, res) => {
  const rows = await db.select().from(billingPaymentsTable).orderBy(desc(billingPaymentsTable.id));
  res.json(rows.map(formatPayment));
});

router.post("/billing-payments/", requireAuth, async (req, res) => {
  const { billing_id, amount, payment_method, status, transaction_id } = req.body;
  const [payment] = await db.insert(billingPaymentsTable).values({
    billingId: billing_id ? Number(billing_id) : null,
    amount: amount || "0",
    paymentMethod: payment_method || "cash",
    status: status || "pending",
    transactionId: transaction_id || "",
  }).returning();
  res.status(201).json(formatPayment(payment));
});

router.get("/billing-payments/:id/", requireAuth, async (req, res) => {
  const [payment] = await db.select().from(billingPaymentsTable).where(eq(billingPaymentsTable.id, Number(req.params.id)));
  if (!payment) { res.status(404).json({ detail: "Not found." }); return; }
  res.json(formatPayment(payment));
});

router.put("/billing-payments/:id/", requireAuth, async (req, res) => {
  const { status, transaction_id } = req.body;
  await db.update(billingPaymentsTable).set({ status: status || undefined, transactionId: transaction_id || undefined }).where(eq(billingPaymentsTable.id, Number(req.params.id)));
  const [payment] = await db.select().from(billingPaymentsTable).where(eq(billingPaymentsTable.id, Number(req.params.id)));
  res.json(formatPayment(payment));
});

router.delete("/billing-payments/:id/", requireAuth, async (req, res) => {
  await db.delete(billingPaymentsTable).where(eq(billingPaymentsTable.id, Number(req.params.id)));
  res.status(204).send();
});

router.post("/billing-payments/:id/verify/", requireAuth, async (req, res) => {
  await db.update(billingPaymentsTable).set({ status: "verified" }).where(eq(billingPaymentsTable.id, Number(req.params.id)));
  const [payment] = await db.select().from(billingPaymentsTable).where(eq(billingPaymentsTable.id, Number(req.params.id)));
  res.json(formatPayment(payment));
});

export default router;
