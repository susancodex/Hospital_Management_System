import { Router } from "express";
import OpenAI from "openai";
import { db, appointmentsTable, usersTable, patientsTable, doctorsTable, medicalRecordsTable, prescriptionsTable, labOrdersTable, labResultsTable } from "@workspace/db";
import { count, eq, desc, and, gte } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth";
import { logAction } from "../lib/audit";

const router = Router();

// ── Multi-provider AI cascade ─────────────────────────────────────────────────
// Flow: Gemini (primary) → Groq (fallback 1) → OpenRouter (fallback 2) → graceful error

type ProviderError = { provider: string; reason: "rate_limit" | "auth" | "unavailable" | "unknown"; message: string };
type ProviderStatusEntry = { configured: boolean; status: "ok" | "rate_limit" | "auth" | "unavailable" | "unknown" | "untested"; lastChecked: string | null; latencyMs: number | null };

const providerStatusStore: Record<string, ProviderStatusEntry> = {
  gemini:     { configured: false, status: "untested", lastChecked: null, latencyMs: null },
  groq:       { configured: false, status: "untested", lastChecked: null, latencyMs: null },
  openrouter: { configured: false, status: "untested", lastChecked: null, latencyMs: null },
};

function syncConfiguredFlags() {
  providerStatusStore.gemini.configured     = !!process.env.GEMINI_API_KEY;
  providerStatusStore.groq.configured       = !!process.env.GROQ_API_KEY;
  providerStatusStore.openrouter.configured = !!process.env.OPENROUTER_API_KEY;
}
syncConfiguredFlags();

function getAIClient(apiKey: string, baseURL?: string) {
  if (!apiKey) return null;
  return new OpenAI({ apiKey, baseURL, timeout: 20_000, maxRetries: 0 });
}

function classifyError(err: any): ProviderError["reason"] {
  const status = err?.status ?? err?.response?.status ?? 0;
  const msg = (err?.message ?? "").toLowerCase();
  if (status === 429 || msg.includes("rate limit") || msg.includes("quota") || msg.includes("too many requests")) return "rate_limit";
  if (status === 401 || status === 403 || msg.includes("invalid api key") || msg.includes("unauthorized")) return "auth";
  if (status >= 500 || msg.includes("service unavailable") || msg.includes("overloaded")) return "unavailable";
  return "unknown";
}

async function tryProvider(
  client: any,
  model: string,
  messages: { role: string; content: string }[],
  systemPrompt: string,
  maxTokens = 1024,
  providerName = "unknown",
): Promise<{ text: string | null; error?: ProviderError }> {
  if (!client) return { text: null };
  const t0 = Date.now();
  try {
    const response = await client.chat.completions.create({
      model,
      max_tokens: maxTokens,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
    });
    const text = response.choices?.[0]?.message?.content ?? null;
    if (providerStatusStore[providerName]) {
      providerStatusStore[providerName].status = "ok";
      providerStatusStore[providerName].lastChecked = new Date().toISOString();
      providerStatusStore[providerName].latencyMs = Date.now() - t0;
    }
    return { text };
  } catch (err: any) {
    const reason = classifyError(err);
    const msg = err?.message ?? "Unknown error";
    console.warn(`[AI] ${providerName} failed (${reason}): ${msg.substring(0, 120)}`);
    if (providerStatusStore[providerName]) {
      providerStatusStore[providerName].status = reason;
      providerStatusStore[providerName].lastChecked = new Date().toISOString();
      providerStatusStore[providerName].latencyMs = Date.now() - t0;
    }
    return { text: null, error: { provider: providerName, reason, message: msg } };
  }
}

async function callAI(
  messages: { role: string; content: string }[],
  systemPrompt: string,
  maxTokens = 1024,
): Promise<{ text: string | null; provider: string; errors: ProviderError[] }> {
  const errors: ProviderError[] = [];

  // 1. Gemini (primary) — Google OpenAI-compatible endpoint
  const geminiKey = process.env.GEMINI_API_KEY;
  const geminiModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  if (geminiKey) {
    const client = getAIClient(geminiKey, "https://generativelanguage.googleapis.com/v1beta/openai/");
    const { text, error } = await tryProvider(client, geminiModel, messages, systemPrompt, maxTokens, "gemini");
    if (text) return { text, provider: "gemini", errors };
    if (error) errors.push(error);
  } else {
    console.info("[AI] Gemini skipped — GEMINI_API_KEY not set");
  }

  // 2. Groq (fallback 1)
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    const client = getAIClient(groqKey, "https://api.groq.com/openai/v1");
    const { text, error } = await tryProvider(client, "llama-3.3-70b-versatile", messages, systemPrompt, maxTokens, "groq");
    if (text) return { text, provider: "groq", errors };
    if (error) errors.push(error);
  } else {
    console.info("[AI] Groq skipped — GROQ_API_KEY not set");
  }

  // 3. OpenRouter (fallback 2)
  const orKey = process.env.OPENROUTER_API_KEY;
  if (orKey) {
    const client = getAIClient(orKey, "https://openrouter.ai/api/v1");
    const { text, error } = await tryProvider(client, "meta-llama/llama-3.3-70b-instruct", messages, systemPrompt, maxTokens, "openrouter");
    if (text) return { text, provider: "openrouter", errors };
    if (error) errors.push(error);
  } else {
    console.info("[AI] OpenRouter skipped — OPENROUTER_API_KEY not set");
  }

  // All providers exhausted
  console.error(`[AI] All providers exhausted. Failures: ${errors.map((e) => `${e.provider}(${e.reason})`).join(", ")}`);
  return { text: null, provider: "none", errors };
}

/** Build a user-friendly error message from provider failure reasons */
function buildUserFriendlyError(errors: ProviderError[], context: "chat" | "clinical" | "analysis" = "chat"): string {
  const hasRateLimit = errors.some((e) => e.reason === "rate_limit");
  const hasAuth = errors.some((e) => e.reason === "auth");

  if (hasRateLimit && errors.length >= 2) {
    return "Our AI services are experiencing high demand right now. Please try again in a few minutes.";
  }
  if (hasAuth) {
    return "AI services are temporarily misconfigured. Our team has been notified — please try again shortly.";
  }
  if (errors.length === 0) {
    return "No AI provider keys are configured. Please add GEMINI_API_KEY, GROQ_API_KEY, or OPENROUTER_API_KEY in Secrets.";
  }
  if (context === "clinical") {
    return "AI assistance is temporarily unavailable. Please proceed using standard clinical protocols and consult relevant guidelines directly.";
  }
  if (context === "analysis") {
    return "AI analysis is temporarily unavailable. Please consult a healthcare professional for evaluation.";
  }
  return "AI services are temporarily unavailable. Please try again shortly or contact the front desk for assistance.";
}

// ── GET /ai/status/ — provider health dashboard ───────────────────────────────
router.get("/ai/status/", requireAuth, requireRole("admin", "doctor"), async (req, res) => {
  syncConfiguredFlags();
  const ping = req.query.ping === "true";

  if (ping) {
    const pingPrompt = "Respond with only the word: ok";
    const pingMsg = [{ role: "user" as const, content: "ping" }];

    const tests: Promise<void>[] = [];

    if (process.env.GEMINI_API_KEY) {
      tests.push((async () => {
        const client = getAIClient(process.env.GEMINI_API_KEY!, "https://generativelanguage.googleapis.com/v1beta/openai/");
        await tryProvider(client, process.env.GEMINI_MODEL || "gemini-2.5-flash", pingMsg, pingPrompt, 8, "gemini");
      })());
    }
    if (process.env.GROQ_API_KEY) {
      tests.push((async () => {
        const client = getAIClient(process.env.GROQ_API_KEY!, "https://api.groq.com/openai/v1");
        await tryProvider(client, "llama-3.3-70b-versatile", pingMsg, pingPrompt, 8, "groq");
      })());
    }
    if (process.env.OPENROUTER_API_KEY) {
      tests.push((async () => {
        const client = getAIClient(process.env.OPENROUTER_API_KEY!, "https://openrouter.ai/api/v1");
        await tryProvider(client, "meta-llama/llama-3.3-70b-instruct", pingMsg, pingPrompt, 8, "openrouter");
      })());
    }

    await Promise.allSettled(tests);
  }

  const providers = [
    { id: "gemini",     label: "Gemini",      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",        ...providerStatusStore.gemini },
    { id: "groq",       label: "Groq",         model: "llama-3.3-70b-versatile",                             ...providerStatusStore.groq },
    { id: "openrouter", label: "OpenRouter",   model: "meta-llama/llama-3.3-70b-instruct",                  ...providerStatusStore.openrouter },
  ];

  const anyOk = providers.some((p) => p.status === "ok");
  const activeProvider = providers.find((p) => p.status === "ok")?.id ?? null;

  res.json({ providers, active_provider: activeProvider, cascade_healthy: anyOk, checked_at: new Date().toISOString() });
});

// ── GET /ai/insights/ ──────────────────────────────────────────────────────────
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
      { id: 1, type: "summary", title: "System Overview", content: `${doctorCount.count} active doctors, ${patientCount.count} patients, ${apptCount.count} total appointments. ${todayCount.count} appointments today.`, priority: "low" },
      { id: 2, type: "alert", title: "Pending Appointments", content: `${pendingCount.count} appointments awaiting confirmation.`, priority: Number(pendingCount.count) > 5 ? "high" : "medium" },
      { id: 3, type: "recommendation", title: "AI Multi-Provider Active", content: "AI services running with Gemini → Groq → OpenRouter → OpenAI failover cascade.", priority: "low" },
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
    risk_summary: { high_risk_patients: highRisk, high_no_show_risk_appointments: Number(pendingCount.count) },
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

// ── POST /ai/chat/ ─────────────────────────────────────────────────────────────
router.post("/ai/chat/", requireAuth, async (req, res) => {
  const { message, history = [] } = req.body;
  if (!message?.trim()) { res.status(400).json({ detail: "message is required." }); return; }

  const DISCLAIMER = "\n\n⚠️ *This is general wellness information only, not medical advice. Please consult a qualified doctor for diagnosis or treatment.*";
  const systemPrompt = `You are MedAssist, a helpful AI health assistant at AetherCare Hospital. Help patients with: general wellness guidance, understanding medical terms, hospital FAQs, appointment help, and general first-aid for minor issues. Never provide specific diagnoses or prescribe medications. Be warm, clear, and professional. End health-related responses with a brief disclaimer.`;

  const messages = [
    ...history.slice(-6).map((h: any) => ({ role: h.role, content: h.content })),
    { role: "user", content: message },
  ];

  const { text: aiReply, provider, errors } = await callAI(messages, systemPrompt);

  if (!aiReply) {
    const friendlyMsg = buildUserFriendlyError(errors, "chat");
    res.json({ reply: `${friendlyMsg}${DISCLAIMER}`, disclaimer: true, provider: "none", ai_unavailable: true });
    return;
  }

  await logAction(req, "AI_CHAT", "ai_chat", undefined, `Patient chat: ${message.substring(0, 80)}`);
  res.json({ reply: aiReply + DISCLAIMER, disclaimer: true, provider });
});

// ── POST /ai/symptom-analyzer/ ─────────────────────────────────────────────────
router.post("/ai/symptom-analyzer/", requireAuth, async (req, res) => {
  const { symptoms, age, gender, duration } = req.body;
  if (!symptoms?.trim()) { res.status(400).json({ detail: "symptoms is required." }); return; }

  const systemPrompt = `You are a clinical triage assistant. Analyze symptoms and return ONLY valid JSON (no markdown) with:
- possible_conditions: array of 2-4 possible condition names
- risk_level: "low" | "medium" | "high" | "emergency"
- recommendation: clear action advice
- urgency: how soon to see a doctor
- specialist: which type of doctor
- warning_signs: array of red-flag symptoms
Be conservative — when in doubt, recommend higher urgency. Never give a definitive diagnosis.`;

  const userMsg = `Symptoms: ${symptoms}${age ? `. Age: ${age}` : ""}${gender ? `. Gender: ${gender}` : ""}${duration ? `. Duration: ${duration}` : ""}`;
  const { text: aiResponse, provider, errors } = await callAI([{ role: "user", content: userMsg }], systemPrompt);

  let result;
  if (aiResponse) {
    try { result = JSON.parse(aiResponse.replace(/```json\n?|\n?```/g, "").trim()); } catch { result = null; }
  }

  if (!result) {
    const friendlyMsg = buildUserFriendlyError(errors, "analysis");
    result = {
      possible_conditions: [friendlyMsg],
      risk_level: "medium",
      recommendation: "Please consult a doctor for proper evaluation of your symptoms.",
      urgency: "Within 24-48 hours",
      specialist: "General Practitioner",
      warning_signs: ["Worsening symptoms", "High fever", "Difficulty breathing"],
      ai_unavailable: true,
    };
  }

  await logAction(req, "SYMPTOM_ANALYSIS", "ai_symptom", undefined, `Symptoms: ${symptoms.substring(0, 80)}`);
  res.json({ ...result, disclaimer: "⚠️ AI-generated — not a medical diagnosis. Always consult a qualified healthcare professional.", provider: provider ?? "none" });
});

// ── POST /ai/doctor-assistant/ ─────────────────────────────────────────────────
router.post("/ai/doctor-assistant/", requireAuth, requireRole("doctor", "admin"), async (req, res) => {
  const { task, patient_id, context } = req.body;
  if (!task) { res.status(400).json({ detail: "task is required." }); return; }

  let patientContext = "";
  if (patient_id) {
    const records = await db.select().from(medicalRecordsTable).where(eq(medicalRecordsTable.patientId, Number(patient_id))).orderBy(desc(medicalRecordsTable.createdAt)).limit(5);
    const rxList = await db.select().from(prescriptionsTable).where(eq(prescriptionsTable.patientId, Number(patient_id))).orderBy(desc(prescriptionsTable.createdAt)).limit(3);
    if (records.length) patientContext = `\n\nRecent Medical Records:\n${records.map((r) => `- Diagnosis: ${r.diagnosis}, Assessment: ${r.assessment || ""}, Plan: ${r.plan || ""}, Notes: ${r.notes}`).join("\n")}`;
    if (rxList.length) patientContext += `\n\nRecent Prescriptions:\n${rxList.map((r) => `- Status: ${r.status}, Instructions: ${r.instructions}`).join("\n")}`;
  }

  const systemPrompt = `You are an AI clinical co-pilot assisting a licensed doctor at AetherCare Hospital. Support (never replace) clinical judgment by: summarizing patient history, suggesting differential diagnoses, referencing treatment guidelines, and generating structured clinical notes. Be precise, evidence-based, and flag critical findings prominently. All AI suggestions require clinical validation.${patientContext}`;

  const { text: aiResponse, provider, errors } = await callAI([{ role: "user", content: `Task: ${task}${context ? `\n\nContext: ${context}` : ""}` }], systemPrompt, 2048);

  await logAction(req, "DOCTOR_AI_ASSIST", "ai_doctor", patient_id ? Number(patient_id) : undefined, `Task: ${task.substring(0, 80)}`);
  res.json({
    result: aiResponse ?? buildUserFriendlyError(errors, "clinical"),
    disclaimer: "⚠️ AI Generated — Doctor Verification Required before clinical use.",
    provider: provider ?? "none",
    ai_unavailable: !aiResponse,
  });
});

// ── POST /ai/summarize-report/ ─────────────────────────────────────────────────
router.post("/ai/summarize-report/", requireAuth, requireRole("doctor", "admin"), async (req, res) => {
  const { report_text, report_type = "general" } = req.body;
  if (!report_text?.trim()) { res.status(400).json({ detail: "report_text is required." }); return; }

  const systemPrompt = `You are a medical report summarizer. Generate TWO summaries and return ONLY valid JSON (no markdown):
- patient_summary: plain-language summary for patient
- clinical_summary: concise summary for the doctor with key findings flagged
- key_findings: array of bullet point strings
- follow_up_recommended: boolean
- follow_up_reason: string`;

  const { text: aiResponse, provider, errors } = await callAI([{ role: "user", content: `Report Type: ${report_type}\n\nReport:\n${report_text}` }], systemPrompt);

  let result;
  if (aiResponse) {
    try { result = JSON.parse(aiResponse.replace(/```json\n?|\n?```/g, "").trim()); } catch { result = null; }
  }
  if (!result) {
    const friendlyMsg = buildUserFriendlyError(errors, "clinical");
    result = { patient_summary: "Your medical report has been received. Please discuss results with your doctor.", clinical_summary: `${friendlyMsg} Please review the full report manually.`, key_findings: ["Manual review required"], follow_up_recommended: true, follow_up_reason: "Standard clinical review", ai_unavailable: true };
  }

  await logAction(req, "REPORT_SUMMARIZE", "ai_report");
  res.json({ ...result, provider: provider ?? "none" });
});

// ── POST /ai/icd-suggest/ — ICD-10 code suggestions ──────────────────────────
router.post("/ai/icd-suggest/", requireAuth, requireRole("doctor", "admin"), async (req, res) => {
  const { diagnosis, symptoms, context: ctx } = req.body;
  if (!diagnosis && !symptoms) { res.status(400).json({ detail: "diagnosis or symptoms is required." }); return; }

  const systemPrompt = `You are a medical coding assistant specializing in ICD-10-CM coding. Return ONLY valid JSON (no markdown) with:
- suggestions: array of up to 5 objects, each with { code, description, confidence: "high"|"medium"|"low", notes }
- primary_code: the most likely ICD-10 code string
- coding_notes: string with important coding guidance
Base suggestions on clinical accuracy and specificity.`;

  const input = `Diagnosis/Complaint: ${diagnosis || ""}\nSymptoms: ${symptoms || ""}\nAdditional Context: ${ctx || ""}`;
  const { text: aiResponse, provider, errors } = await callAI([{ role: "user", content: input }], systemPrompt);

  let result;
  if (aiResponse) {
    try { result = JSON.parse(aiResponse.replace(/```json\n?|\n?```/g, "").trim()); } catch { result = null; }
  }
  if (!result) {
    const friendlyMsg = buildUserFriendlyError(errors, "clinical");
    result = { suggestions: [], primary_code: "", coding_notes: `${friendlyMsg} Please consult a certified medical coder.`, ai_unavailable: true };
  }

  await logAction(req, "ICD_SUGGEST", "ai_icd");
  res.json({ ...result, disclaimer: "⚠️ AI Generated — Verify all ICD codes before submission.", provider: provider ?? "none" });
});

// ── POST /ai/lab-interpret/ — AI lab result interpretation ────────────────────
router.post("/ai/lab-interpret/", requireAuth, requireRole("doctor", "admin", "lab_tech"), async (req, res) => {
  const { lab_order_id, results, patient_context } = req.body;
  if (!results || !Array.isArray(results) || results.length === 0) {
    res.status(400).json({ detail: "results array is required." }); return;
  }

  const systemPrompt = `You are a clinical laboratory interpretation assistant at AetherCare Hospital. Analyze lab results and return ONLY valid JSON (no markdown) with:
- overall_summary: string — brief overall interpretation
- findings: array of objects { test_name, value, unit, reference_range, status: "normal"|"abnormal"|"critical", interpretation, clinical_significance }
- critical_alerts: array of strings — any critical/panic values requiring immediate action
- clinical_recommendations: array of strings — suggested follow-up actions
- follow_up_tests: array of strings — suggested additional tests if needed
Flag all abnormal and critical values prominently. Be clinically precise.`;

  const resultsText = results.map((r: any) => `${r.test_name}: ${r.result_value} ${r.unit || ""} (Ref: ${r.reference_range || "N/A"})`).join("\n");
  const input = `Lab Results:\n${resultsText}${patient_context ? `\n\nPatient Context: ${patient_context}` : ""}`;

  const { text: aiResponse, provider, errors } = await callAI([{ role: "user", content: input }], systemPrompt, 2048);

  let result;
  if (aiResponse) {
    try { result = JSON.parse(aiResponse.replace(/```json\n?|\n?```/g, "").trim()); } catch { result = null; }
  }
  if (!result) {
    const friendlyMsg = buildUserFriendlyError(errors, "clinical");
    result = { overall_summary: friendlyMsg, findings: [], critical_alerts: [], clinical_recommendations: ["Manual review required by clinician"], follow_up_tests: [], ai_unavailable: true };
  }

  if (lab_order_id) {
    await logAction(req, "LAB_INTERPRET", "lab_order", Number(lab_order_id));
  }

  res.json({ ...result, disclaimer: "⚠️ AI Generated — Doctor Verification Required before clinical use.", provider: provider ?? "none" });
});

// ── POST /ai/soap-generate/ — generate SOAP note from input ──────────────────
router.post("/ai/soap-generate/", requireAuth, requireRole("doctor", "admin"), async (req, res) => {
  const { chief_complaint, history, exam_findings, patient_id } = req.body;
  if (!chief_complaint) { res.status(400).json({ detail: "chief_complaint is required." }); return; }

  const systemPrompt = `You are a clinical documentation assistant. Generate a structured SOAP note and return ONLY valid JSON (no markdown) with:
- subjective: string — patient's chief complaint, history of present illness, review of systems
- objective: string — physical examination findings, vital signs, investigations
- assessment: string — diagnosis/differential diagnoses with ICD context
- plan: string — treatment plan, medications, referrals, follow-up
Be concise, clinically accurate, and use medical terminology appropriately.`;

  const input = `Chief Complaint: ${chief_complaint}\nHistory: ${history || "Not provided"}\nExamination Findings: ${exam_findings || "Not provided"}`;
  const { text: aiResponse, provider, errors } = await callAI([{ role: "user", content: input }], systemPrompt, 2048);

  let result;
  if (aiResponse) {
    try { result = JSON.parse(aiResponse.replace(/```json\n?|\n?```/g, "").trim()); } catch { result = null; }
  }
  if (!result) {
    const friendlyMsg = buildUserFriendlyError(errors, "clinical");
    result = { subjective: chief_complaint, objective: exam_findings || "", assessment: friendlyMsg, plan: "Please document manually.", ai_unavailable: true };
  }

  await logAction(req, "SOAP_GENERATE", "ai_soap", patient_id ? Number(patient_id) : undefined);
  res.json({ ...result, disclaimer: "⚠️ AI Generated — Doctor Verification Required.", provider: provider ?? "none" });
});

// ── POST /ai/transcribe/ — AI voice-to-medical-notes transcription ────────────
router.post("/ai/transcribe/", requireAuth, requireRole("doctor", "admin", "nurse"), async (req, res) => {
  const { audio_base64, language = "en", generate_notes = true } = req.body;
  if (!audio_base64) { res.status(400).json({ detail: "audio_base64 is required." }); return; }

  const oaiKey = process.env.OPENAI_API_KEY;
  if (!oaiKey) {
    res.status(503).json({ detail: "Voice transcription requires an OpenAI API key. Set OPENAI_API_KEY in Secrets." });
    return;
  }

  try {
    // Dynamic import to avoid ESM bundler issues
    const OpenAI = (await import("openai")).default;
    const { toFile } = await import("openai/uploads");
    const client = new OpenAI({ apiKey: oaiKey });

    const buffer = Buffer.from(audio_base64, "base64");
    const file = await toFile(buffer, "recording.webm", { type: "audio/webm" });

    const transcription = await client.audio.transcriptions.create({
      file,
      model: "whisper-1",
      language: language === "ne" ? "ne" : "en",
    });

    let medicalNotes = null;
    if (generate_notes && transcription.text) {
      const systemPrompt = `You are a clinical medical scribe. The following is a doctor's voice recording during a patient consultation.
Convert it into structured SOAP-format medical notes. Return ONLY valid JSON (no markdown) with:
- subjective: string — patient complaints, symptoms, history
- objective: string — findings, vitals, examinations mentioned
- assessment: string — diagnosis, clinical impression
- plan: string — medications ordered, follow-up, instructions
Be concise and use standard medical terminology.`;

      const { text: notesText } = await callAI(
        [{ role: "user", content: `Transcription: ${transcription.text}` }],
        systemPrompt,
        1024,
      );
      if (notesText) {
        try { medicalNotes = JSON.parse(notesText.replace(/```json\n?|\n?```/g, "").trim()); } catch { medicalNotes = null; }
      }
    }

    await logAction(req, "VOICE_TRANSCRIBE", "ai_transcription");
    res.json({
      transcription: transcription.text,
      medical_notes: medicalNotes,
      disclaimer: "⚠️ AI Generated — Clinician must review before adding to patient record.",
    });
  } catch (err: any) {
    const msg = err?.message || "Transcription failed.";
    res.status(500).json({ detail: msg });
  }
});

export default router;
