import { Router } from "express";
import { db, insuranceProvidersTable, insuranceClaimsTable, usersTable, billingTable } from "@workspace/db";
import { eq, desc, and, ilike } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth";
import { logAction } from "../lib/audit";
import { broadcastToUser } from "../lib/ws";

const router = Router();

// ── GET /insurance-providers/ ─────────────────────────────────────────────────
router.get("/insurance-providers/", requireAuth, async (req, res) => {
  const providers = await db.select().from(insuranceProvidersTable).where(eq(insuranceProvidersTable.isActive, true)).orderBy(insuranceProvidersTable.name);
  res.json({ results: providers });
});

// ── POST /insurance-providers/ ────────────────────────────────────────────────
router.post("/insurance-providers/", requireAuth, requireRole("admin", "accountant"), async (req, res) => {
  const { name, code, type, contact_email, contact_phone, address, coverage_types } = req.body;
  if (!name) { res.status(400).json({ detail: "name is required." }); return; }

  const [provider] = await db.insert(insuranceProvidersTable).values({
    name,
    code: code || null,
    type: type || "health",
    contactEmail: contact_email || "",
    contactPhone: contact_phone || "",
    address: address || "",
    coverageTypes: coverage_types || [],
  }).returning();

  await logAction(req, "CREATE", "insurance_provider", provider.id);
  res.status(201).json(provider);
});

// ── GET /insurance-claims/ ────────────────────────────────────────────────────
router.get("/insurance-claims/", requireAuth, async (req, res) => {
  const user = req.user!;
  const { status, patient_id, provider_id } = req.query as Record<string, string>;

  const claims = await db.select({
    claim: insuranceClaimsTable,
    patient: { firstName: usersTable.firstName, lastName: usersTable.lastName, email: usersTable.email },
    provider: { name: insuranceProvidersTable.name, code: insuranceProvidersTable.code },
  })
    .from(insuranceClaimsTable)
    .leftJoin(usersTable, eq(insuranceClaimsTable.patientId, usersTable.id))
    .leftJoin(insuranceProvidersTable, eq(insuranceClaimsTable.providerId, insuranceProvidersTable.id))
    .where(user.role === "patient" ? eq(insuranceClaimsTable.patientId, user.id) : undefined)
    .orderBy(desc(insuranceClaimsTable.createdAt));

  const filtered = claims.filter((c) => {
    if (status && c.claim.status !== status) return false;
    if (patient_id && c.claim.patientId !== Number(patient_id)) return false;
    if (provider_id && c.claim.providerId !== Number(provider_id)) return false;
    return true;
  });

  res.json({ results: filtered.map((c) => ({
    ...c.claim,
    patient_name: c.patient ? `${c.patient.firstName} ${c.patient.lastName}`.trim() : "",
    provider_name: c.provider?.name || "",
    provider_code: c.provider?.code || "",
  })) });
});

// ── POST /insurance-claims/ ───────────────────────────────────────────────────
router.post("/insurance-claims/", requireAuth, requireRole("admin", "accountant", "reception"), async (req, res) => {
  const { patient_id, billing_id, provider_id, policy_number, membership_id, claim_amount, diagnosis_codes, notes } = req.body;
  if (!patient_id || !provider_id) { res.status(400).json({ detail: "patient_id and provider_id are required." }); return; }

  const claimNumber = `CLM-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  const [claim] = await db.insert(insuranceClaimsTable).values({
    claimNumber,
    patientId: Number(patient_id),
    billingId: billing_id ? Number(billing_id) : null,
    providerId: Number(provider_id),
    policyNumber: policy_number || "",
    membershipId: membership_id || "",
    claimAmount: claim_amount ? String(claim_amount) : "0",
    diagnosisCodes: diagnosis_codes || [],
    notes: notes || "",
    status: "pending",
    submittedAt: new Date(),
  }).returning();

  // Notify patient
  broadcastToUser(Number(patient_id), "notification", {
    title: "Insurance Claim Submitted",
    message: `Claim ${claimNumber} submitted to ${provider_id}. Status: pending.`,
  });

  await logAction(req, "CREATE", "insurance_claim", claim.id);
  res.status(201).json(claim);
});

// ── PATCH /insurance-claims/:id/ ─────────────────────────────────────────────
router.patch("/insurance-claims/:id/", requireAuth, requireRole("admin", "accountant"), async (req, res) => {
  const id = Number(req.params.id);
  const { status, approved_amount, rejection_reason, notes } = req.body;

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (status) updates.status = status;
  if (approved_amount !== undefined) updates.approvedAmount = String(approved_amount);
  if (rejection_reason !== undefined) updates.rejectionReason = rejection_reason;
  if (notes !== undefined) updates.notes = notes;
  if (status === "approved" || status === "rejected") updates.processedAt = new Date();

  const [claim] = await db.update(insuranceClaimsTable).set(updates).where(eq(insuranceClaimsTable.id, id)).returning();
  if (!claim) { res.status(404).json({ detail: "Claim not found." }); return; }

  if (claim.patientId && status) {
    broadcastToUser(claim.patientId, "notification", {
      title: `Claim ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: `Your insurance claim ${claim.claimNumber} has been ${status}. ${status === "rejected" ? rejection_reason || "" : `Amount: ${claim.approvedAmount}`}`,
    });
  }

  await logAction(req, "UPDATE", "insurance_claim", id);
  res.json(claim);
});

export default router;
