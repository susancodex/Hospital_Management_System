import { Router } from "express";
import { db, usersTable, patientsTable, doctorsTable, appointmentsTable, medicalRecordsTable, prescriptionsTable, billingTable, labOrdersTable, pharmacyInventoryTable, insuranceClaimsTable, auditLogsTable, notificationsTable } from "@workspace/db";
import { requireAuth, requireRole } from "../lib/auth";
import { logAction } from "../lib/audit";

const router = Router();

// ── GET /backup/export/ ───────────────────────────────────────────────────────
// Full JSON export of all clinical data (admin only)
router.get("/backup/export/", requireAuth, requireRole("admin"), async (req, res) => {
  const { tables } = req.query as Record<string, string>;
  const requested = tables ? tables.split(",").map((t) => t.trim()) : ["all"];
  const all = requested.includes("all");

  const data: Record<string, unknown[]> = {};

  try {
    if (all || requested.includes("users")) {
      data.users = (await db.select({ id: usersTable.id, username: usersTable.username, email: usersTable.email, role: usersTable.role, firstName: usersTable.firstName, lastName: usersTable.lastName, isActive: usersTable.isActive, createdAt: usersTable.createdAt }).from(usersTable));
    }
    if (all || requested.includes("patients")) {
      data.patients = await db.select().from(patientsTable);
    }
    if (all || requested.includes("doctors")) {
      data.doctors = await db.select().from(doctorsTable);
    }
    if (all || requested.includes("appointments")) {
      data.appointments = await db.select().from(appointmentsTable);
    }
    if (all || requested.includes("medical_records")) {
      data.medical_records = await db.select().from(medicalRecordsTable);
    }
    if (all || requested.includes("prescriptions")) {
      data.prescriptions = await db.select().from(prescriptionsTable);
    }
    if (all || requested.includes("billing")) {
      data.billing = await db.select().from(billingTable);
    }
    if (all || requested.includes("lab_orders")) {
      data.lab_orders = await db.select().from(labOrdersTable);
    }
    if (all || requested.includes("pharmacy")) {
      data.pharmacy_inventory = await db.select().from(pharmacyInventoryTable);
    }
    if (all || requested.includes("insurance")) {
      data.insurance_claims = await db.select().from(insuranceClaimsTable);
    }
    if (all || requested.includes("audit_logs")) {
      data.audit_logs = await db.select().from(auditLogsTable);
    }

    const exportPayload = {
      export_version: "1.0",
      exported_at: new Date().toISOString(),
      exported_by: (req as any).user?.id,
      system: "AetherCare HMS",
      tables: Object.keys(data),
      record_counts: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, (v as unknown[]).length])),
      data,
    };

    await logAction(req, "CREATE", "backup_export", 0);

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="aethercare-backup-${new Date().toISOString().split("T")[0]}.json"`);
    res.json(exportPayload);
  } catch (err: any) {
    res.status(500).json({ detail: "Export failed.", error: err?.message });
  }
});

// ── GET /backup/stats/ ────────────────────────────────────────────────────────
router.get("/backup/stats/", requireAuth, requireRole("admin"), async (_req, res) => {
  const { count } = await import("drizzle-orm");

  const [uCount] = await db.select({ c: count() }).from(usersTable);
  const [pCount] = await db.select({ c: count() }).from(patientsTable);
  const [dCount] = await db.select({ c: count() }).from(doctorsTable);
  const [aCount] = await db.select({ c: count() }).from(appointmentsTable);
  const [mrCount] = await db.select({ c: count() }).from(medicalRecordsTable);
  const [rxCount] = await db.select({ c: count() }).from(prescriptionsTable);
  const [bCount] = await db.select({ c: count() }).from(billingTable);
  const [labCount] = await db.select({ c: count() }).from(labOrdersTable);
  const [phCount] = await db.select({ c: count() }).from(pharmacyInventoryTable);
  const [insCount] = await db.select({ c: count() }).from(insuranceClaimsTable);
  const [auditCount] = await db.select({ c: count() }).from(auditLogsTable);

  res.json({
    tables: [
      { name: "users", label: "Users", count: Number(uCount.c), icon: "users" },
      { name: "patients", label: "Patients", count: Number(pCount.c), icon: "patient" },
      { name: "doctors", label: "Doctors", count: Number(dCount.c), icon: "doctor" },
      { name: "appointments", label: "Appointments", count: Number(aCount.c), icon: "calendar" },
      { name: "medical_records", label: "Medical Records", count: Number(mrCount.c), icon: "file" },
      { name: "prescriptions", label: "Prescriptions", count: Number(rxCount.c), icon: "pill" },
      { name: "billing", label: "Billing", count: Number(bCount.c), icon: "billing" },
      { name: "lab_orders", label: "Lab Orders", count: Number(labCount.c), icon: "lab" },
      { name: "pharmacy", label: "Pharmacy Inventory", count: Number(phCount.c), icon: "pharmacy" },
      { name: "insurance", label: "Insurance Claims", count: Number(insCount.c), icon: "insurance" },
      { name: "audit_logs", label: "Audit Logs", count: Number(auditCount.c), icon: "shield" },
    ],
    last_check: new Date().toISOString(),
    db_status: "healthy",
    total_records: Number(uCount.c) + Number(pCount.c) + Number(aCount.c) + Number(mrCount.c) + Number(rxCount.c),
  });
});

export default router;
