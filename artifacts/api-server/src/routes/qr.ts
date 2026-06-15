import { Router } from "express";
import { db, prescriptionsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { requireAuth } from "../lib/auth";

const router = Router();

function getSecret() {
  return process.env.JWT_SECRET || "dev-insecure-secret";
}

// GET /prescriptions/:id/qr/ — generate QR code for prescription
router.get("/prescriptions/:id/qr/", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const user = req.user!;

  const [rx] = await db.select({
    prescription: prescriptionsTable,
    patient: usersTable,
  })
    .from(prescriptionsTable)
    .leftJoin(usersTable, eq(prescriptionsTable.patientId, usersTable.id))
    .where(eq(prescriptionsTable.id, id));

  if (!rx) { res.status(404).json({ detail: "Prescription not found." }); return; }
  if (user.role === "patient" && rx.prescription.patientId !== user.id) {
    res.status(403).json({ detail: "Access denied." }); return;
  }

  const token = jwt.sign({ prescriptionId: id, type: "rx_verify" }, getSecret(), { expiresIn: "365d" });
  const baseUrl = process.env.FRONTEND_URL || "https://aethercare.replit.app";
  const verifyUrl = `${baseUrl}/verify-rx/${token}`;

  try {
    const QRCode = (await import("qrcode")).default;
    const format = (req.query.format as string) || "svg";

    if (format === "png") {
      const buffer = await QRCode.toBuffer(verifyUrl, { width: 256, margin: 2, color: { dark: "#0f766e", light: "#ffffff" } });
      res.setHeader("Content-Type", "image/png");
      res.send(buffer);
    } else {
      const svg = await QRCode.toString(verifyUrl, { type: "svg", width: 200, margin: 2, color: { dark: "#0f766e", light: "#ffffff" } });
      res.setHeader("Content-Type", "image/svg+xml");
      res.send(svg);
    }
  } catch (err) {
    res.status(500).json({ detail: "QR generation failed." });
  }
});

// GET /prescriptions/verify/:token/ — PUBLIC: verify a prescription by QR token
router.get("/prescriptions/verify/:token/", async (req, res) => {
  try {
    const payload = jwt.verify(req.params.token, getSecret()) as { prescriptionId: number; type: string };
    if (payload.type !== "rx_verify") { res.status(400).json({ detail: "Invalid token type." }); return; }

    const [rx] = await db.select({
      prescription: prescriptionsTable,
      patient: usersTable,
    })
      .from(prescriptionsTable)
      .leftJoin(usersTable, eq(prescriptionsTable.patientId, usersTable.id))
      .where(eq(prescriptionsTable.id, payload.prescriptionId));

    if (!rx) { res.status(404).json({ detail: "Prescription not found." }); return; }

    const medicines = Array.isArray(rx.prescription.medicines) ? rx.prescription.medicines : [];
    const patientName = rx.patient ? `${rx.patient.firstName} ${rx.patient.lastName}`.trim() : "";

    res.json({
      id: rx.prescription.id,
      patient_name: patientName,
      medicines,
      instructions: rx.prescription.instructions,
      status: rx.prescription.status,
      valid_until: rx.prescription.validUntil,
      issued_at: rx.prescription.createdAt,
      verified_at: new Date().toISOString(),
      hospital: "AetherCare Hospital",
    });
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      res.status(410).json({ detail: "This prescription QR has expired." });
    } else {
      res.status(400).json({ detail: "Invalid or tampered QR code." });
    }
  }
});

// GET /system/stats/ — system health for monitoring dashboard
router.get("/system/stats/", requireAuth, async (req, res) => {
  const { getConnectionStats } = await import("../lib/ws");
  const stats = getConnectionStats();
  const uptime = process.uptime();

  res.json({
    uptime_seconds: Math.floor(uptime),
    uptime_human: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
    memory: process.memoryUsage(),
    ws_connections: stats,
    node_version: process.version,
    env: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

export default router;
