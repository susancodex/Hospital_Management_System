import { Router } from "express";
import { db, subscriptionPlansTable, hospitalSubscriptionsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth";
import { logAction } from "../lib/audit";

const router = Router();

// ── GET /subscription-plans/ ─────────────────────────────────────────────────
router.get("/subscription-plans/", requireAuth, async (_req, res) => {
  const plans = await db.select().from(subscriptionPlansTable).where(eq(subscriptionPlansTable.isActive, true)).orderBy(subscriptionPlansTable.priceMonthly);
  res.json({ results: plans });
});

// ── POST /subscription-plans/ ────────────────────────────────────────────────
router.post("/subscription-plans/", requireAuth, requireRole("admin"), async (req, res) => {
  const { name, code, description, price_monthly, price_yearly, max_doctors, max_patients, max_branches, features } = req.body;
  if (!name || !code) { res.status(400).json({ detail: "name and code are required." }); return; }

  const [plan] = await db.insert(subscriptionPlansTable).values({
    name,
    code: code.toUpperCase(),
    description: description || "",
    priceMonthly: String(price_monthly || 0),
    priceYearly: String(price_yearly || 0),
    maxDoctors: max_doctors ?? -1,
    maxPatients: max_patients ?? -1,
    maxBranches: max_branches ?? 1,
    features: features || [],
  }).returning();

  await logAction(req, "CREATE", "subscription_plan", plan.id);
  res.status(201).json(plan);
});

// ── GET /hospital-subscriptions/ ─────────────────────────────────────────────
router.get("/hospital-subscriptions/", requireAuth, requireRole("admin"), async (_req, res) => {
  const subs = await db.select({
    sub: hospitalSubscriptionsTable,
    plan: { name: subscriptionPlansTable.name, code: subscriptionPlansTable.code },
  }).from(hospitalSubscriptionsTable)
    .leftJoin(subscriptionPlansTable, eq(hospitalSubscriptionsTable.planId, subscriptionPlansTable.id))
    .orderBy(desc(hospitalSubscriptionsTable.createdAt));

  res.json({ results: subs.map((s) => ({ ...s.sub, plan_name: s.plan?.name, plan_code: s.plan?.code })) });
});

// ── POST /hospital-subscriptions/ ────────────────────────────────────────────
router.post("/hospital-subscriptions/", requireAuth, requireRole("admin"), async (req, res) => {
  const { hospital_id, plan_id, billing_cycle, start_date, end_date, trial_ends_at, notes } = req.body;
  if (!plan_id || !start_date) { res.status(400).json({ detail: "plan_id and start_date are required." }); return; }

  const [sub] = await db.insert(hospitalSubscriptionsTable).values({
    hospitalId: hospital_id ? Number(hospital_id) : null,
    planId: Number(plan_id),
    billingCycle: billing_cycle || "monthly",
    startDate: start_date,
    endDate: end_date || null,
    trialEndsAt: trial_ends_at || null,
    notes: notes || "",
    status: "active",
  }).returning();

  await logAction(req, "CREATE", "hospital_subscription", sub.id);
  res.status(201).json(sub);
});

// ── PATCH /subscription-plans/:id/ ───────────────────────────────────────────
router.patch("/subscription-plans/:id/", requireAuth, requireRole("admin"), async (req, res) => {
  const id = Number(req.params.id);
  const { name, description, price_monthly, price_yearly, max_doctors, max_patients, max_branches, features, is_active } = req.body;

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (price_monthly !== undefined) updates.priceMonthly = String(price_monthly);
  if (price_yearly !== undefined) updates.priceYearly = String(price_yearly);
  if (max_doctors !== undefined) updates.maxDoctors = max_doctors;
  if (max_patients !== undefined) updates.maxPatients = max_patients;
  if (max_branches !== undefined) updates.maxBranches = max_branches;
  if (features !== undefined) updates.features = features;
  if (is_active !== undefined) updates.isActive = is_active;

  const [plan] = await db.update(subscriptionPlansTable).set(updates).where(eq(subscriptionPlansTable.id, id)).returning();
  if (!plan) { res.status(404).json({ detail: "Plan not found." }); return; }

  await logAction(req, "UPDATE", "subscription_plan", id);
  res.json(plan);
});

export default router;
