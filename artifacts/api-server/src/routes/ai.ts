import { Router } from "express";
import { db, appointmentsTable, usersTable, patientsTable, doctorsTable } from "@workspace/db";
import { count, eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/ai/insights/", requireAuth, async (req, res) => {
  const [apptCount] = await db.select({ count: count() }).from(appointmentsTable);
  const [patientCount] = await db.select({ count: count() }).from(patientsTable);
  const [doctorCount] = await db.select({ count: count() }).from(doctorsTable);

  res.json({
    insights: [
      {
        id: 1,
        type: "summary",
        title: "System Overview",
        content: `The hospital has ${doctorCount.count} registered doctors and ${patientCount.count} patients, with ${apptCount.count} total appointments recorded.`,
        priority: "low",
      },
      {
        id: 2,
        type: "recommendation",
        title: "AI Health Assistant",
        content: "AI-powered diagnosis assistance and symptom analysis are available on the AI Triage page. Always consult a qualified doctor before making medical decisions.",
        priority: "medium",
      },
    ],
    stats: {
      total_appointments: apptCount.count,
      total_patients: patientCount.count,
      total_doctors: doctorCount.count,
    },
  });
});

export default router;
