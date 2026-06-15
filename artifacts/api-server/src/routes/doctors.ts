import { Router } from "express";
import { db, usersTable, doctorsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, requireRole, formatUser } from "../lib/auth";
import { logAction } from "../lib/audit";

const router = Router();

function formatDoctor(r: { doctors: typeof doctorsTable.$inferSelect; users: typeof usersTable.$inferSelect | null }) {
  return {
    id: r.doctors.id,
    user: r.users ? formatUser(r.users) : null,
    user_id: r.doctors.userId,
    specialization: r.doctors.specialization,
    department: r.doctors.department,
    license_number: r.doctors.licenseNumber,
    experience: r.doctors.experience,
    bio: r.doctors.bio,
    consultation_fee: r.doctors.consultationFee,
    available: r.doctors.available,
    name: r.users ? `${r.users.firstName} ${r.users.lastName}`.trim() : "",
    email: r.users?.email || "",
  };
}

// GET list — all authenticated users (needed for appointment booking)
router.get("/doctors/", requireAuth, async (req, res) => {
  const rows = await db
    .select()
    .from(doctorsTable)
    .leftJoin(usersTable, eq(doctorsTable.userId, usersTable.id))
    .orderBy(desc(doctorsTable.id));

  let results = rows.map(formatDoctor);

  const search = (req.query.search as string || "").toLowerCase();
  if (search) {
    results = results.filter((d) =>
      d.name.toLowerCase().includes(search) ||
      d.specialization.toLowerCase().includes(search) ||
      d.department.toLowerCase().includes(search)
    );
  }

  res.json(results);
});

// POST — admin only
router.post("/doctors/", requireAuth, requireRole("admin"), async (req, res) => {
  const { username, email, password, first_name, last_name, phone, specialization, department, license_number, experience, bio, consultation_fee } = req.body;
  const bcrypt = await import("bcrypt");
  const hashed = await bcrypt.hash(password || "changeme123", 12);
  const [user] = await db.insert(usersTable).values({
    username: username || email?.split("@")[0] || `doctor_${Date.now()}`,
    email: email || `doctor_${Date.now()}@hospital.com`,
    password: hashed,
    firstName: first_name || "",
    lastName: last_name || "",
    role: "doctor",
    phone: phone || "",
  }).returning();
  const [doctor] = await db.insert(doctorsTable).values({
    userId: user.id,
    specialization: specialization || "",
    department: department || "",
    licenseNumber: license_number || "",
    experience: experience ? Number(experience) : 0,
    bio: bio || "",
    consultationFee: consultation_fee || "0",
  }).returning();
  await logAction(req, "CREATE", "doctor", doctor.id);
  const [row] = await db.select().from(doctorsTable).leftJoin(usersTable, eq(doctorsTable.userId, usersTable.id)).where(eq(doctorsTable.id, doctor.id));
  res.status(201).json(formatDoctor(row));
});

// GET single — all authenticated users
router.get("/doctors/:id/", requireAuth, async (req, res) => {
  const [row] = await db
    .select()
    .from(doctorsTable)
    .leftJoin(usersTable, eq(doctorsTable.userId, usersTable.id))
    .where(eq(doctorsTable.id, Number(req.params.id)));
  if (!row) { res.status(404).json({ detail: "Not found." }); return; }
  res.json(formatDoctor(row));
});

// PUT — admin or the doctor themselves (own profile only)
router.put("/doctors/:id/", requireAuth, async (req, res) => {
  const user = req.user!;
  const [row] = await db
    .select()
    .from(doctorsTable)
    .leftJoin(usersTable, eq(doctorsTable.userId, usersTable.id))
    .where(eq(doctorsTable.id, Number(req.params.id)));
  if (!row) { res.status(404).json({ detail: "Not found." }); return; }

  if (user.role === "patient") {
    res.status(403).json({ detail: "Access denied." }); return;
  }
  // Doctors can only edit their own profile
  if (user.role === "doctor" && row.doctors.userId !== user.id) {
    res.status(403).json({ detail: "Doctors can only edit their own profile." }); return;
  }

  const { specialization, department, license_number, experience, bio, consultation_fee, available } = req.body;
  await db.update(doctorsTable).set({
    specialization: specialization || "",
    department: department || "",
    licenseNumber: license_number || "",
    experience: experience ? Number(experience) : undefined,
    bio: bio || "",
    consultationFee: consultation_fee || undefined,
    available: available !== undefined ? Boolean(available) : undefined,
  }).where(eq(doctorsTable.id, Number(req.params.id)));

  await logAction(req, "UPDATE", "doctor", Number(req.params.id));
  const [updated] = await db.select().from(doctorsTable).leftJoin(usersTable, eq(doctorsTable.userId, usersTable.id)).where(eq(doctorsTable.id, Number(req.params.id)));
  res.json(formatDoctor(updated));
});

// DELETE — admin only
router.delete("/doctors/:id/", requireAuth, requireRole("admin"), async (req, res) => {
  const [row] = await db.select().from(doctorsTable).where(eq(doctorsTable.id, Number(req.params.id)));
  if (!row) { res.status(404).json({ detail: "Not found." }); return; }
  await db.delete(doctorsTable).where(eq(doctorsTable.id, Number(req.params.id)));
  await logAction(req, "DELETE", "doctor", Number(req.params.id));
  res.status(204).send();
});

export default router;
