import { Router } from "express";
import bcrypt from "bcrypt";
import { db, usersTable, doctorsTable, patientsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { generateTokens, verifyToken, requireAuth, formatUser } from "../lib/auth";
import { logger } from "../lib/logger";

const router = Router();

router.get("/auth-config/", (_req, res) => {
  res.json({ google_login_enabled: false, registration_enabled: true });
});

router.post("/token/", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ detail: "Username and password are required." });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (!user) {
    res.status(401).json({ detail: "No active account found with the given credentials." });
    return;
  }
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    res.status(401).json({ detail: "No active account found with the given credentials." });
    return;
  }
  const tokens = generateTokens({ id: user.id, username: user.username, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName });
  res.json({ ...tokens, user: formatUser(user) });
});

router.post("/token/refresh/", async (req, res) => {
  const { refresh } = req.body;
  if (!refresh) { res.status(400).json({ detail: "Refresh token required." }); return; }
  const payload = verifyToken(refresh);
  if (!payload) { res.status(401).json({ detail: "Token is invalid or expired." }); return; }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, Number(payload.sub)));
  if (!user) { res.status(401).json({ detail: "User not found." }); return; }
  const tokens = generateTokens({ id: user.id, username: user.username, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName });
  res.json({ access: tokens.access });
});

// Public self-registration: role is ALWAYS forced to "patient" server-side.
// Doctors and admins must be created by an admin via the admin user-management flow.
router.post("/register/", async (req, res) => {
  const { username, email, password, first_name, last_name, phone } = req.body;
  if (!username || !email || !password) {
    res.status(400).json({ detail: "Username, email, and password are required." });
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
  // Role is intentionally hard-coded to "patient" — never trust client-supplied role.
  const [user] = await db.insert(usersTable).values({
    username, email, password: hashed, firstName: first_name || "", lastName: last_name || "", role: "patient", phone: phone || "",
  }).returning();
  await db.insert(patientsTable).values({ userId: user.id });
  const tokens = generateTokens({ id: user.id, username: user.username, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName });
  res.status(201).json({ ...tokens, user: formatUser(user) });
});

router.post("/forgot-password/", async (req, res) => {
  res.json({ detail: "Password reset email sent if account exists." });
});

router.post("/change-password/", requireAuth, async (req, res) => {
  const { old_password, new_password } = req.body;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id));
  const valid = await bcrypt.compare(old_password, user.password);
  if (!valid) { res.status(400).json({ detail: "Old password is incorrect." }); return; }
  const hashed = await bcrypt.hash(new_password, 12);
  await db.update(usersTable).set({ password: hashed, updatedAt: new Date() }).where(eq(usersTable.id, req.user!.id));
  res.json({ detail: "Password updated successfully." });
});

router.get("/profile/", requireAuth, async (req, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id));
  res.json(formatUser(user));
});

router.get("/users/me/", requireAuth, async (req, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id));
  res.json(formatUser(user));
});

router.patch("/profile/", requireAuth, async (req, res) => {
  const { first_name, last_name, phone, email } = req.body;
  await db.update(usersTable).set({
    firstName: first_name || undefined,
    lastName: last_name || undefined,
    phone: phone || undefined,
    email: email || undefined,
    updatedAt: new Date(),
  }).where(eq(usersTable.id, req.user!.id));
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id));
  res.json(formatUser(user));
});

router.post("/google-login/", async (_req, res) => {
  res.status(501).json({ detail: "Google login not configured." });
});

export default router;
