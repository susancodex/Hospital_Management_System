import { Router } from "express";
import { db, usersTable, patientsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, formatUser } from "../lib/auth";

const router = Router();

async function getPatientList(params: Record<string, string> = {}) {
  const rows = await db
    .select()
    .from(patientsTable)
    .leftJoin(usersTable, eq(patientsTable.userId, usersTable.id))
    .orderBy(desc(patientsTable.id));

  let results = rows.map((r) => ({
    id: r.patients.id,
    user: r.users ? formatUser(r.users) : null,
    user_id: r.patients.userId,
    date_of_birth: r.patients.dateOfBirth,
    blood_group: r.patients.bloodGroup,
    address: r.patients.address,
    emergency_contact: r.patients.emergencyContact,
    allergies: r.patients.allergies,
    chronic_conditions: r.patients.chronicConditions,
    name: r.users ? `${r.users.firstName} ${r.users.lastName}`.trim() : "",
    email: r.users?.email || "",
  }));

  if (params.search) {
    const q = params.search.toLowerCase();
    results = results.filter((p) =>
      p.name.toLowerCase().includes(q) || (p.email || "").toLowerCase().includes(q)
    );
  }

  return results;
}

router.get("/patients/", requireAuth, async (req, res) => {
  const results = await getPatientList(req.query as Record<string, string>);
  res.json(results);
});

router.post("/patients/", requireAuth, async (req, res) => {
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
  const results = await getPatientList();
  const created = results.find((p) => p.id === patient.id);
  res.status(201).json(created);
});

router.get("/patients/:id/", requireAuth, async (req, res) => {
  const rows = await db.select().from(patientsTable).leftJoin(usersTable, eq(patientsTable.userId, usersTable.id)).where(eq(patientsTable.id, Number(req.params.id)));
  if (!rows.length) { res.status(404).json({ detail: "Not found." }); return; }
  const r = rows[0];
  res.json({
    id: r.patients.id,
    user: r.users ? formatUser(r.users) : null,
    user_id: r.patients.userId,
    date_of_birth: r.patients.dateOfBirth,
    blood_group: r.patients.bloodGroup,
    address: r.patients.address,
    emergency_contact: r.patients.emergencyContact,
    name: r.users ? `${r.users.firstName} ${r.users.lastName}`.trim() : "",
    email: r.users?.email || "",
  });
});

router.put("/patients/:id/", requireAuth, async (req, res) => {
  const { date_of_birth, blood_group, address, emergency_contact, allergies, chronic_conditions } = req.body;
  await db.update(patientsTable).set({
    dateOfBirth: date_of_birth || undefined,
    bloodGroup: blood_group || "",
    address: address || "",
    emergencyContact: emergency_contact || "",
    allergies: allergies || "",
    chronicConditions: chronic_conditions || "",
  }).where(eq(patientsTable.id, Number(req.params.id)));
  const rows = await db.select().from(patientsTable).leftJoin(usersTable, eq(patientsTable.userId, usersTable.id)).where(eq(patientsTable.id, Number(req.params.id)));
  const r = rows[0];
  res.json({ id: r.patients.id, name: r.users ? `${r.users.firstName} ${r.users.lastName}`.trim() : "" });
});

router.delete("/patients/:id/", requireAuth, async (req, res) => {
  await db.delete(patientsTable).where(eq(patientsTable.id, Number(req.params.id)));
  res.status(204).send();
});

export default router;
