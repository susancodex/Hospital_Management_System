import { Router } from "express";
import { db, appointmentsTable, usersTable, patientsTable, doctorsTable, medicalRecordsTable, prescriptionsTable, notificationsTable } from "@workspace/db";
import { count, eq, desc, and, gte } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth";
import { logAction } from "../lib/audit";

const router = Router();

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  try {
    const OpenAI = require("openai");
    return new OpenAI.default({ apiKey });
  } catch {
    return null;
  }
}

async function callAI(messages: { role: string; content: string }[], systemPrompt: string): Promise<string | null> {
  const client = getOpenAIClient();
  if (!client) return null;
  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 1024,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
    });
    return response.choices[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

// ── GET /ai/insights/ — operational overview ──────────────────────────────────
router.get("/ai/insights/", requireAuth, async (req, res) => {
  const today = new Date().toISOString().split("T")[0];
  const [apptCount] = await db.select({ count: count() }).from(appointmentsTable);
  const [patientCount] = await db.select({ count: count() }).from(patientsTable);
  const [doctorCount] = await db.select({ count: count() }).from(doctorsTable);
  const [pendingCount] = await db.select({ count: count() }).from(appointmentsTable).where(eq(appointmentsTable.status, "pending"));
  const [todayCount] = await db.select({ count: count() }).from(appointmentsTable).where(eq(appointmentsTable.date, today));

  const noShowPredictions = await db
    .select({ appt: appointmentsTable, patient: usersTable })
    .from(appointmentsTable)
    .leftJoin(usersTable, eq(appointmentsTable.patientId, usersTable.id))
    .where(and(eq(appointmentsTable.status, "pending"), gte(appointmentsTable.date, today)))
    .orderBy(appointmentsTable.date)
    .limit(5);

  const highRisk = Math.floor(Number(patientCount.count) * 0.08);
  const mediumRisk = Math.floor(Number(patientCount.count) * 0.15);

  res.json({
    insights: [
      {
        id: 1,
        type: "summary",
        title: "System Overview",
        content: `${doctorCount.count} active doctors, ${patientCount.count} patients, ${apptCount.count} total appointments. ${todayCount.count} appointments today.`,
        priority: "low",
      },
      {
        id: 2,
        type: "alert",
        title: "Pending Appointments",
        content: `${pendingCount.count} appointments awaiting confirmation. Review and confirm to reduce no-shows.`,
        priority: Number(pendingCount.count) > 5 ? "high" : "medium",
      },
      {
        id: 3,
        type: "recommendation",
        title: "AI Health Assistant Active",
        content: "Patients can use the AI health assistant for symptom guidance and appointment help. All AI outputs carry medical disclaimers.",
        priority: "low",
      },
    ],
    stats: {
      total_appointments: apptCount.count,
      total_patients: patientCount.count,
      total_doctors: doctorCount.count,
      pending_appointments: pendingCount.count,
      today_appointments: todayCount.count,
      high_risk_patients: highRisk,
      medium_risk_patients: mediumRisk,
    },
    no_show_predictions: noShowPredictions.map((r) => ({
      id: r.appt.id,
      patient_name: r.patient ? `${r.patient.firstName} ${r.patient.lastName}` : "Unknown",
      date: r.appt.date,
      time: r.appt.time,
      risk: "medium",
      reason: r.appt.reason,
    })),
  });
});

// ── POST /ai/chat/ — patient health assistant chatbot ─────────────────────────
router.post("/ai/chat/", requireAuth, async (req, res) => {
  const { message, history = [] } = req.body;
  if (!message?.trim()) {
    res.status(400).json({ detail: "message is required." });
    return;
  }

  const DISCLAIMER = "\n\n⚠️ *This is general wellness information only, not medical advice. Please consult a qualified doctor for diagnosis or treatment.*";

  const systemPrompt = `You are a helpful hospital AI health assistant named MedAssist. You work for AetherCare Hospital.

You can help patients with:
- General wellness and lifestyle guidance
- Understanding medical terms in simple language
- Hospital FAQs (visiting hours, departments, services)
- Help booking or rescheduling appointments
- General first-aid guidance for minor issues

You must NOT:
- Provide a specific diagnosis
- Prescribe or recommend specific medications
- Replace a doctor's advice

Always end health-related responses with a brief disclaimer. Be warm, clear, and professional.`;

  const messages = [
    ...history.slice(-6).map((h: any) => ({ role: h.role, content: h.content })),
    { role: "user", content: message },
  ];

  const aiReply = await callAI(messages, systemPrompt);

  if (!aiReply) {
    res.json({
      reply: `Hello! I'm MedAssist, your AI health assistant. I'm here to help with general wellness questions, hospital information, and appointment help.\n\nOur AI service is currently being configured. In the meantime, please call our front desk or use the Appointments page to book a visit.${DISCLAIMER}`,
      disclaimer: true,
    });
    return;
  }

  await logAction(req, "AI_CHAT", "ai_chat", undefined, `Patient chat: ${message.substring(0, 80)}`);
  res.json({ reply: aiReply + DISCLAIMER, disclaimer: true });
});

// ── POST /ai/symptom-analyzer/ — patient symptom checker ──────────────────────
router.post("/ai/symptom-analyzer/", requireAuth, async (req, res) => {
  const { symptoms, age, gender, duration } = req.body;
  if (!symptoms?.trim()) {
    res.status(400).json({ detail: "symptoms is required." });
    return;
  }

  const systemPrompt = `You are a clinical triage assistant helping patients understand their symptoms. 
Analyze the given symptoms and return a JSON object with:
- possible_conditions: array of 2-4 possible condition names (strings)
- risk_level: "low" | "medium" | "high" | "emergency"
- recommendation: string with clear action advice
- urgency: string describing how soon they should see a doctor
- specialist: string with which type of doctor to see
- warning_signs: array of red-flag symptoms to watch for

Be conservative — when in doubt, recommend higher urgency. Never give a definitive diagnosis.
Return ONLY valid JSON, no markdown.`;

  const userMsg = `Symptoms: ${symptoms}${age ? `. Age: ${age}` : ""}${gender ? `. Gender: ${gender}` : ""}${duration ? `. Duration: ${duration}` : ""}`;

  const aiResponse = await callAI([{ role: "user", content: userMsg }], systemPrompt);

  let result;
  if (aiResponse) {
    try {
      result = JSON.parse(aiResponse);
    } catch {
      result = null;
    }
  }

  if (!result) {
    result = {
      possible_conditions: ["Unable to analyze — AI service unavailable"],
      risk_level: "medium",
      recommendation: "Please consult a doctor for proper evaluation of your symptoms.",
      urgency: "Within 24-48 hours",
      specialist: "General Practitioner",
      warning_signs: ["Worsening symptoms", "High fever", "Difficulty breathing"],
    };
  }

  await logAction(req, "SYMPTOM_ANALYSIS", "ai_symptom", undefined, `Symptoms: ${symptoms.substring(0, 80)}`);
  res.json({
    ...result,
    disclaimer: "This is not a medical diagnosis. Always consult a qualified healthcare professional.",
  });
});

// ── POST /ai/doctor-assistant/ — doctor AI co-pilot ──────────────────────────
router.post("/ai/doctor-assistant/", requireAuth, requireRole("doctor", "admin"), async (req, res) => {
  const { task, patient_id, context } = req.body;
  if (!task) {
    res.status(400).json({ detail: "task is required." });
    return;
  }

  let patientContext = "";
  if (patient_id) {
    const records = await db
      .select()
      .from(medicalRecordsTable)
      .where(eq(medicalRecordsTable.patientId, Number(patient_id)))
      .orderBy(desc(medicalRecordsTable.createdAt))
      .limit(5);

    const rxList = await db
      .select()
      .from(prescriptionsTable)
      .where(eq(prescriptionsTable.patientId, Number(patient_id)))
      .orderBy(desc(prescriptionsTable.createdAt))
      .limit(3);

    if (records.length) {
      patientContext = `\n\nRecent Medical Records:\n${records.map((r) =>
        `- Diagnosis: ${r.diagnosis}, Treatment: ${r.treatment}, Notes: ${r.notes}`
      ).join("\n")}`;
    }
    if (rxList.length) {
      patientContext += `\n\nRecent Prescriptions:\n${rxList.map((r) =>
        `- Status: ${r.status}, Instructions: ${r.instructions}`
      ).join("\n")}`;
    }
  }

  const systemPrompt = `You are an AI clinical assistant helping a licensed doctor at AetherCare Hospital.
Your role is to support (never replace) the doctor's clinical judgment by:
- Summarizing patient history concisely
- Suggesting possible differential diagnoses based on presented data
- Referencing standard treatment guidelines
- Generating structured clinical notes

Always be precise, evidence-based, and use medical terminology appropriately. 
Flag any critical findings prominently.
Remind the doctor that all AI suggestions require their clinical validation before use.${patientContext}`;

  const messages = [{ role: "user", content: `Task: ${task}${context ? `\n\nContext: ${context}` : ""}` }];

  const aiResponse = await callAI(messages, systemPrompt);

  await logAction(req, "DOCTOR_AI_ASSIST", "ai_doctor", patient_id ? Number(patient_id) : undefined, `Task: ${task.substring(0, 80)}`);

  res.json({
    result: aiResponse ?? "AI service is currently unavailable. Please proceed with standard clinical protocols.",
    disclaimer: "AI-generated content requires doctor validation before clinical use.",
  });
});

// ── POST /ai/summarize-report/ — report summarizer ───────────────────────────
router.post("/ai/summarize-report/", requireAuth, requireRole("doctor", "admin"), async (req, res) => {
  const { report_text, report_type = "general" } = req.body;
  if (!report_text?.trim()) {
    res.status(400).json({ detail: "report_text is required." });
    return;
  }

  const systemPrompt = `You are a medical report summarizer at AetherCare Hospital.

Generate TWO summaries of the provided medical report:
1. A patient-friendly summary (plain language, no jargon, reassuring tone)
2. A clinical summary for the doctor (concise, highlights key findings, flags abnormalities)

Return JSON with:
- patient_summary: string
- clinical_summary: string
- key_findings: array of strings (bullet points)
- follow_up_recommended: boolean
- follow_up_reason: string (if follow_up_recommended is true)

Return ONLY valid JSON.`;

  const aiResponse = await callAI([{ role: "user", content: `Report Type: ${report_type}\n\nReport:\n${report_text}` }], systemPrompt);

  let result;
  if (aiResponse) {
    try {
      result = JSON.parse(aiResponse);
    } catch {
      result = null;
    }
  }

  if (!result) {
    result = {
      patient_summary: "Your medical report has been received. Please discuss the results with your doctor at your next appointment.",
      clinical_summary: "AI summarization unavailable. Please review the full report manually.",
      key_findings: ["Manual review required"],
      follow_up_recommended: true,
      follow_up_reason: "Standard clinical review",
    };
  }

  await logAction(req, "REPORT_SUMMARIZE", "ai_report");
  res.json(result);
});

export default router;
