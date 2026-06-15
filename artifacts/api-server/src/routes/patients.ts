import { Router } from "express";
import { db, usersTable, patientsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, requireRole, formatUser } from "../lib/auth";
import { logAction } from "../lib/audit";

const router = Router();

function formatPatient(r: { patients: typeof patientsTable.$inferSelect; users: typeof usersTable.$inferSelect | null }) {
  return {
    id: r.patients.id,
    user: r.users ? formatUser(r.users) : null,
    user_id: r.patients.userId,
    first_name: r.users?.firstName || "",
    last_name: r.users?.lastName || "",
    date_of_birth: r.patients.dateOfBirth,
    blood_group: r.patients.bloodGroup,
    address: r.patients.address,
    emergency_contact: r.patients.emergencyContact,
    allergies: r.patients.allergies,
    chronic_conditions: r.patients.chronicConditions,
    name: r.users ? `${r.users.firstName} ${r.users.lastName}`.trim() : "",
    email: r.users?.email || "",
  };
}

// GET list — admin/doctor: all patients; patient: only their own record
router.get("/patients/", requireAuth, async (req, res) => {
  const user = req.user!;
  const search = (req.query.search as string || "").toLowerCase();

  let rows: Array<{ patients: typeof patientsTable.$inferSelect; users: typeof usersTable.$inferSelect | null }>;

  if (user.role === "patient") {
    // Patients may only see their own record
    rows = await db
      .select()
      .from(patientsTable)
      .leftJoin(usersTable, eq(patientsTable.userId, usersTable.id))
      .where(eq(patientsTable.userId, user.id));
  } else {
    // admin / doctor: full list
    rows = await db
      .select()
      .from(patientsTable)
      .leftJoin(usersTable, eq(patientsTable.userId, usersTable.id))
      .orderBy(desc(patientsTable.id));
  }

  let results = rows.map(formatPatient);

  if (search) {
    results = results.filter(
      (p) => p.name.toLowerCase().includes(search) || (p.email || "").toLowerCase().includes(search)
    );
  }

  res.json(results);
});

// POST — admin only (doctors do not create patient accounts directly)
router.post("/patients/", requireAuth, requireRole("admin"), async (req, res) => {
  const { username, email, password, first_name, last_name, phone, date_of_birth, blood_group, address, emergency_contact, allergies, chronic_conditions } = req.body;
  const bcrypt = await import("bcrypt");
  const hashed = await bcrypt.hash(password || "changeme123", 12);
  const [user] = await db.insert(usersTable).values({
    username: username || email?.split("@")[0] || `patient_${Date.now()}`,
    email: email || `patient_${Date.now()}@hospital.com`,
    password: hashed,
    firstName: first_name || "",
    lastName: last_name || "",
    role: "patient",
    phone: phone || "",
  }).returning();
  const [patient] = await db.insert(patientsTable).values({
    userId: user.id,
    dateOfBirth: date_of_birth || null,
    bloodGroup: blood_group || "",
    address: address || "",
    emergencyContact: emergency_contact || "",
    allergies: allergies || "",
    chronicConditions: chronic_conditions || "",
  }).returning();
  await logAction(req, "CREATE", "patient", patient.id);
  const [row] = await db.select().from(patientsTable).leftJoin(usersTable, eq(patientsTable.userId, usersTable.id)).where(eq(patientsTable.id, patient.id));
  res.status(201).json(formatPatient(row));
});

// GET single — admin/doctor: any; patient: own only
router.get("/patients/:id/", requireAuth, async (req, res) => {
  const user = req.user!;
  const [row] = await db
    .select()
    .from(patientsTable)
    .leftJoin(usersTable, eq(patientsTable.userId, usersTable.id))
    .where(eq(patientsTable.id, Number(req.params.id)));
  if (!row) { res.status(404).json({ detail: "Not found." }); return; }
  if (user.role === "patient" && row.patients.userId !== user.id) {
    res.status(403).json({ detail: "Access denied." }); return;
  }
  res.json(formatPatient(row));
});

// PUT — admin: any; patient: own non-sensitive fields only; doctor: denied
router.put("/patients/:id/", requireAuth, async (req, res) => {
  const user = req.user!;
  const [row] = await db
    .select()
    .from(patientsTable)
    .leftJoin(usersTable, eq(patientsTable.userId, usersTable.id))
    .where(eq(patientsTable.id, Number(req.params.id)));
  if (!row) { res.status(404).json({ detail: "Not found." }); return; }

  if (user.role === "doctor") {
    res.status(403).json({ detail: "Doctors cannot modify patient records directly." }); return;
  }
  if (user.role === "patient" && row.patients.userId !== user.id) {
    res.status(403).json({ detail: "Access denied." }); return;
  }

  const { date_of_birth, blood_group, address, emergency_contact, allergies, chronic_conditions } = req.body;
  await db.update(patientsTable).set({
    dateOfBirth: date_of_birth || undefined,
    bloodGroup: blood_group || "",
    address: address || "",
    emergencyContact: emergency_contact || "",
    allergies: allergies || "",
    chronicConditions: chronic_conditions || "",
  }).where(eq(patientsTable.id, Number(req.params.id)));

  await logAction(req, "UPDATE", "patient", Number(req.params.id));
  const [updated] = await db.select().from(patientsTable).leftJoin(usersTable, eq(patientsTable.userId, usersTable.id)).where(eq(patientsTable.id, Number(req.params.id)));
  res.json(formatPatient(updated));
});

// DELETE — admin only
router.delete("/patients/:id/", requireAuth, requireRole("admin"), async (req, res) => {
  const [row] = await db.select().from(patientsTable).where(eq(patientsTable.id, Number(req.params.id)));
  if (!row) { res.status(404).json({ detail: "Not found." }); return; }
  await db.delete(patientsTable).where(eq(patientsTable.id, Number(req.params.id)));
  await logAction(req, "DELETE", "patient", Number(req.params.id));
  res.status(204).send();
});

export default router;
