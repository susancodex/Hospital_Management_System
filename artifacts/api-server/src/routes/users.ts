import { Router } from "express";
import bcrypt from "bcrypt";
import { db, usersTable, doctorsTable, patientsTable } from "@workspace/db";
import { eq, desc, ilike, or } from "drizzle-orm";
import { requireAuth, requireRole, formatUser } from "../lib/auth";
import { logAction } from "../lib/audit";

const router = Router();

// GET /users/ — admin: list all users with optional search & role filter
router.get("/users/", requireAuth, requireRole("admin"), async (req, res) => {
  const { search = "", role = "" } = req.query as Record<string, string>;

  let rows = await db
    .select()
    .from(usersTable)
    .orderBy(desc(usersTable.createdAt));

  let results = rows.map(formatUser);

  if (search) {
    const q = search.toLowerCase();
    results = results.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.first_name + " " + u.last_name).toLowerCase().includes(q)
    );
  }

  if (role) {
    results = results.filter((u) => u.role === role);
  }

  res.json({ results, count: results.length });
});

// POST /users/ — admin creates any user (doctor, admin, reception)
router.post("/users/", requireAuth, requireRole("admin"), async (req, res) => {
  const {
    username, email, password, first_name, last_name, phone, role,
    specialization, department, license_number, experience, bio, consultation_fee,
  } = req.body;

  if (!username || !email || !password || !role) {
    res.status(400).json({ detail: "username, email, password, and role are required." });
    return;
  }

  const allowedRoles = ["admin", "doctor", "reception", "patient"];
  if (!allowedRoles.includes(role)) {
    res.status(400).json({ detail: `Invalid role. Must be one of: ${allowedRoles.join(", ")}` });
    return;
  }

  const existing = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (existing.length > 0) {
    res.status(400).json({ username: ["A user with that username already exists."] });
    return;
  }

  const existingEmail = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existingEmail.length > 0) {
    res.status(400).json({ email: ["A user with that email already exists."] });
    return;
  }

  const hashed = await bcrypt.hash(password, 12);
  const [user] = await db.insert(usersTable).values({
    username,
    email,
    password: hashed,
    firstName: first_name || "",
    lastName: last_name || "",
    role,
    phone: phone || "",
  }).returning();

  // Create role-specific profile record
  if (role === "doctor") {
    await db.insert(doctorsTable).values({
      userId: user.id,
      specialization: specialization || "",
      department: department || "",
      licenseNumber: license_number || "",
      experience: experience ? Number(experience) : 0,
      bio: bio || "",
      consultationFee: consultation_fee || "0",
    });
  } else if (role === "patient") {
    await db.insert(patientsTable).values({ userId: user.id });
  }

  await logAction(req, "CREATE", "user", user.id);
  res.status(201).json(formatUser(user));
});

// GET /users/:id/ — admin: view any user
router.get("/users/:id/", requireAuth, requireRole("admin"), async (req, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, Number(req.params.id)));
  if (!user) { res.status(404).json({ detail: "Not found." }); return; }
  res.json(formatUser(user));
});

// PATCH /users/:id/ — admin: update user details
router.patch("/users/:id/", requireAuth, requireRole("admin"), async (req, res) => {
  const { first_name, last_name, email, phone, role, is_active } = req.body;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, Number(req.params.id)));
  if (!user) { res.status(404).json({ detail: "Not found." }); return; }

  await db.update(usersTable).set({
    firstName: first_name !== undefined ? first_name : user.firstName,
    lastName: last_name !== undefined ? last_name : user.lastName,
    email: email !== undefined ? email : user.email,
    phone: phone !== undefined ? phone : user.phone,
    role: role !== undefined ? role : user.role,
    isActive: is_active !== undefined ? is_active : user.isActive,
    updatedAt: new Date(),
  }).where(eq(usersTable.id, Number(req.params.id)));

  await logAction(req, "UPDATE", "user", Number(req.params.id));
  const [updated] = await db.select().from(usersTable).where(eq(usersTable.id, Number(req.params.id)));
  res.json(formatUser(updated));
});

// POST /users/:id/toggle-active/ — admin: activate or deactivate a user account
router.post("/users/:id/toggle-active/", requireAuth, requireRole("admin"), async (req, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, Number(req.params.id)));
  if (!user) { res.status(404).json({ detail: "Not found." }); return; }

  const newStatus = !user.isActive;
  await db.update(usersTable)
    .set({ isActive: newStatus, updatedAt: new Date() })
    .where(eq(usersTable.id, Number(req.params.id)));

  await logAction(req, newStatus ? "ACTIVATE" : "DEACTIVATE", "user", Number(req.params.id));
  res.json({ detail: `User ${newStatus ? "activated" : "deactivated"} successfully.`, is_active: newStatus });
});

// POST /users/:id/reset-password/ — admin: reset a user password
router.post("/users/:id/reset-password/", requireAuth, requireRole("admin"), async (req, res) => {
  const { new_password } = req.body;
  if (!new_password || new_password.length < 6) {
    res.status(400).json({ detail: "new_password must be at least 6 characters." });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, Number(req.params.id)));
  if (!user) { res.status(404).json({ detail: "Not found." }); return; }

  const hashed = await bcrypt.hash(new_password, 12);
  await db.update(usersTable)
    .set({ password: hashed, updatedAt: new Date() })
    .where(eq(usersTable.id, Number(req.params.id)));

  await logAction(req, "RESET_PASSWORD", "user", Number(req.params.id));
  res.json({ detail: "Password reset successfully." });
});

// DELETE /users/:id/ — admin: delete user (soft delete by deactivating)
router.delete("/users/:id/", requireAuth, requireRole("admin"), async (req, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, Number(req.params.id)));
  if (!user) { res.status(404).json({ detail: "Not found." }); return; }

  // Protect against deleting own account
  if (user.id === req.user!.id) {
    res.status(400).json({ detail: "You cannot delete your own account." });
    return;
  }

  await db.update(usersTable)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(usersTable.id, Number(req.params.id)));

  await logAction(req, "DELETE", "user", Number(req.params.id));
  res.json({ detail: "User deactivated successfully." });
});

export default router;
