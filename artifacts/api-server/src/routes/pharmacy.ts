import { Router } from "express";
import { db, pharmacyInventoryTable, pharmacyDispensingTable, usersTable, prescriptionsTable } from "@workspace/db";
import { eq, desc, lte, and } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth";
import { logAction } from "../lib/audit";

const router = Router();

function formatItem(item: typeof pharmacyInventoryTable.$inferSelect) {
  const now = new Date();
  const expiry = item.expiryDate ? new Date(item.expiryDate) : null;
  const isExpired = expiry ? expiry < now : false;
  const isExpiringSoon = expiry ? (expiry.getTime() - now.getTime()) < 30 * 24 * 60 * 60 * 1000 : false;
  const isLowStock = item.quantityInStock <= item.reorderLevel;

  return {
    id: item.id,
    name: item.name,
    generic_name: item.genericName,
    category: item.category,
    dosage_form: item.dosageForm,
    strength: item.strength,
    quantity_in_stock: item.quantityInStock,
    unit: item.unit,
    reorder_level: item.reorderLevel,
    expiry_date: item.expiryDate,
    manufacturer: item.manufacturer,
    batch_number: item.batchNumber,
    unit_price: item.unitPrice,
    is_controlled: item.isControlled,
    is_active: item.isActive,
    is_expired: isExpired,
    is_expiring_soon: isExpiringSoon,
    is_low_stock: isLowStock,
    stock_status: isExpired ? "expired" : isLowStock ? "low" : isExpiringSoon ? "expiring_soon" : "ok",
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  };
}

// GET /pharmacy/inventory/ — list all drugs
router.get("/pharmacy/inventory/", requireAuth, async (req, res) => {
  const { category, search, stock_status } = req.query as Record<string, string>;

  let rows = await db.select().from(pharmacyInventoryTable).where(eq(pharmacyInventoryTable.isActive, true)).orderBy(pharmacyInventoryTable.name);
  let results = rows.map(formatItem);

  if (category) results = results.filter((r) => r.category?.toLowerCase() === category.toLowerCase());
  if (search) results = results.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()) || r.generic_name?.toLowerCase().includes(search.toLowerCase()));
  if (stock_status) results = results.filter((r) => r.stock_status === stock_status);

  res.json(results);
});

// GET /pharmacy/inventory/low-stock/ — low stock and expired alerts
router.get("/pharmacy/inventory/low-stock/", requireAuth, requireRole("admin", "pharmacist", "doctor"), async (req, res) => {
  const rows = await db.select().from(pharmacyInventoryTable).where(eq(pharmacyInventoryTable.isActive, true));
  const items = rows.map(formatItem);
  const alerts = items.filter((i) => i.is_low_stock || i.is_expired || i.is_expiring_soon);

  res.json({
    total_alerts: alerts.length,
    low_stock: alerts.filter((a) => a.stock_status === "low"),
    expired: alerts.filter((a) => a.is_expired),
    expiring_soon: alerts.filter((a) => a.is_expiring_soon),
  });
});

// GET /pharmacy/inventory/:id/ — single item
router.get("/pharmacy/inventory/:id/", requireAuth, async (req, res) => {
  const [item] = await db.select().from(pharmacyInventoryTable).where(eq(pharmacyInventoryTable.id, Number(req.params.id)));
  if (!item) { res.status(404).json({ detail: "Not found." }); return; }
  res.json(formatItem(item));
});

// POST /pharmacy/inventory/ — create
router.post("/pharmacy/inventory/", requireAuth, requireRole("admin", "pharmacist"), async (req, res) => {
  const {
    name, generic_name, category, dosage_form, strength,
    quantity_in_stock, unit, reorder_level, expiry_date,
    manufacturer, batch_number, unit_price, is_controlled,
  } = req.body;

  if (!name) { res.status(400).json({ detail: "name is required." }); return; }

  const [item] = await db.insert(pharmacyInventoryTable).values({
    name,
    genericName: generic_name || "",
    category: category || "",
    dosageForm: dosage_form || "tablet",
    strength: strength || "",
    quantityInStock: quantity_in_stock ? Number(quantity_in_stock) : 0,
    unit: unit || "tablets",
    reorderLevel: reorder_level ? Number(reorder_level) : 10,
    expiryDate: expiry_date || null,
    manufacturer: manufacturer || "",
    batchNumber: batch_number || "",
    unitPrice: unit_price || "0",
    isControlled: is_controlled === true || is_controlled === "true",
  }).returning();

  await logAction(req, "CREATE", "pharmacy_inventory", item.id);
  res.status(201).json(formatItem(item));
});

// PUT /pharmacy/inventory/:id/ — update
router.put("/pharmacy/inventory/:id/", requireAuth, requireRole("admin", "pharmacist"), async (req, res) => {
  const id = Number(req.params.id);
  const [existing] = await db.select().from(pharmacyInventoryTable).where(eq(pharmacyInventoryTable.id, id));
  if (!existing) { res.status(404).json({ detail: "Not found." }); return; }

  const {
    name, generic_name, category, dosage_form, strength,
    quantity_in_stock, unit, reorder_level, expiry_date,
    manufacturer, batch_number, unit_price, is_controlled, is_active,
  } = req.body;

  await db.update(pharmacyInventoryTable).set({
    name: name || undefined,
    genericName: generic_name !== undefined ? generic_name : undefined,
    category: category !== undefined ? category : undefined,
    dosageForm: dosage_form || undefined,
    strength: strength !== undefined ? strength : undefined,
    quantityInStock: quantity_in_stock !== undefined ? Number(quantity_in_stock) : undefined,
    unit: unit !== undefined ? unit : undefined,
    reorderLevel: reorder_level !== undefined ? Number(reorder_level) : undefined,
    expiryDate: expiry_date !== undefined ? expiry_date : undefined,
    manufacturer: manufacturer !== undefined ? manufacturer : undefined,
    batchNumber: batch_number !== undefined ? batch_number : undefined,
    unitPrice: unit_price !== undefined ? unit_price : undefined,
    isControlled: is_controlled !== undefined ? (is_controlled === true || is_controlled === "true") : undefined,
    isActive: is_active !== undefined ? (is_active === true || is_active === "true") : undefined,
    updatedAt: new Date(),
  }).where(eq(pharmacyInventoryTable.id, id));

  await logAction(req, "UPDATE", "pharmacy_inventory", id);
  const [updated] = await db.select().from(pharmacyInventoryTable).where(eq(pharmacyInventoryTable.id, id));
  res.json(formatItem(updated));
});

// DELETE /pharmacy/inventory/:id/ — soft delete (admin only)
router.delete("/pharmacy/inventory/:id/", requireAuth, requireRole("admin"), async (req, res) => {
  const id = Number(req.params.id);
  await db.update(pharmacyInventoryTable).set({ isActive: false, updatedAt: new Date() }).where(eq(pharmacyInventoryTable.id, id));
  await logAction(req, "DELETE", "pharmacy_inventory", id);
  res.status(204).send();
});

// GET /pharmacy/dispense/ — list dispensing records
router.get("/pharmacy/dispense/", requireAuth, requireRole("admin", "pharmacist", "doctor"), async (req, res) => {
  const rows = await db
    .select({ dispensing: pharmacyDispensingTable, patient: usersTable })
    .from(pharmacyDispensingTable)
    .leftJoin(usersTable, eq(pharmacyDispensingTable.patientId, usersTable.id))
    .orderBy(desc(pharmacyDispensingTable.id))
    .limit(100);

  res.json(rows.map((r) => ({
    id: r.dispensing.id,
    prescription_id: r.dispensing.prescriptionId,
    patient_id: r.dispensing.patientId,
    patient_name: r.patient ? `${r.patient.firstName} ${r.patient.lastName}`.trim() : "",
    items: r.dispensing.items,
    total_amount: r.dispensing.totalAmount,
    status: r.dispensing.status,
    notes: r.dispensing.notes,
    dispensed_at: r.dispensing.dispensedAt,
    created_at: r.dispensing.createdAt,
  })));
});

// POST /pharmacy/dispense/ — dispense medication
router.post("/pharmacy/dispense/", requireAuth, requireRole("admin", "pharmacist"), async (req, res) => {
  const user = req.user!;
  const { prescription_id, patient_id, items, notes } = req.body;

  if (!patient_id) { res.status(400).json({ detail: "patient_id is required." }); return; }
  if (!items || !Array.isArray(items) || items.length === 0) { res.status(400).json({ detail: "items array is required." }); return; }

  let totalAmount = 0;
  for (const item of items) {
    if (item.inventory_id) {
      const [inv] = await db.select().from(pharmacyInventoryTable).where(eq(pharmacyInventoryTable.id, Number(item.inventory_id)));
      if (inv) {
        const qty = Number(item.quantity) || 1;
        totalAmount += Number(inv.unitPrice) * qty;
        const newQty = Math.max(0, inv.quantityInStock - qty);
        await db.update(pharmacyInventoryTable).set({ quantityInStock: newQty, updatedAt: new Date() }).where(eq(pharmacyInventoryTable.id, inv.id));
      }
    }
  }

  const [dispensing] = await db.insert(pharmacyDispensingTable).values({
    prescriptionId: prescription_id ? Number(prescription_id) : null,
    patientId: Number(patient_id),
    dispensedBy: user.id,
    items,
    totalAmount: totalAmount.toFixed(2),
    status: "dispensed",
    notes: notes || "",
    dispensedAt: new Date(),
  }).returning();

  await logAction(req, "DISPENSE", "pharmacy_dispensing", dispensing.id, `${items.length} items dispensed`);
  res.status(201).json({ id: dispensing.id, status: dispensing.status, total_amount: dispensing.totalAmount, dispensed_at: dispensing.dispensedAt });
});

export default router;
