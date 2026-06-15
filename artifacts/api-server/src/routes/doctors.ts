import { Router } from "express";
import { db, usersTable, doctorsTable } from "@workspace/db";
import { eq, ilike, or, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { formatUser } from "../lib/auth";

const router = Router();

async function getDoctorList(params: Record<string, string> = {}) {
  const rows = await db
    .select()
    .from(doctorsTable)
    .leftJoin(usersTable, eq(doctorsTable.userId, usersTable.id))
    .orderBy(desc(doctorsTable.id));

  let results = rows.map((r) => ({
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
  }));

  if (params.search) {
    const q = params.search.toLowerCase();
    results = results.filter((d) =>
      d.name.toLowerCase().includes(q) ||
      d.specialization.toLowerCase().includes(q) ||
      d.department.toLowerCase().includes(q)
    );
  }

  return results;
}

router.get("/doctors/", requireAuth, async (req, res) => {
  const results = await getDoctorList(req.query as Record<string, string>);
  res.json(results);
});

router.post("/doctors/", requireAuth, async (req, res) => {
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
  const results = await getDoctorList();
  const created = results.find((d) => d.id === doctor.id);
  res.status(201).json(created);
});

router.get("/doctors/:id/", requireAuth, async (req, res) => {
  const rows = await db.select().from(doctorsTable).leftJoin(usersTable, eq(doctorsTable.userId, usersTable.id)).where(eq(doctorsTable.id, Number(req.params.id)));
  if (!rows.length) { res.status(404).json({ detail: "Not found." }); return; }
  const r = rows[0];
  res.json({
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
  });
});

router.put("/doctors/:id/", requireAuth, async (req, res) => {
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
  const rows = await db.select().from(doctorsTable).leftJoin(usersTable, eq(doctorsTable.userId, usersTable.id)).where(eq(doctorsTable.id, Number(req.params.id)));
  if (!rows.length) { res.status(404).json({ detail: "Not found." }); return; }
  const r = rows[0];
  res.json({ id: r.doctors.id, specialization: r.doctors.specialization, department: r.doctors.department, name: r.users ? `${r.users.firstName} ${r.users.lastName}`.trim() : "" });
});

router.delete("/doctors/:id/", requireAuth, async (req, res) => {
  await db.delete(doctorsTable).where(eq(doctorsTable.id, Number(req.params.id)));
  res.status(204).send();
});

export default router;
