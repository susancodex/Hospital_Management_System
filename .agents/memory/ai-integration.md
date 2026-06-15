---
name: AI integration approach
description: How AI features are wired in this HMS project
---
# AI Integration

**Rule:** Replit OpenAI integration requires account upgrade. This user declined. Use `OPENAI_API_KEY` environment secret (user's own key) instead.

**How to apply:** All AI routes in `artifacts/api-server/src/routes/ai.ts` call `getOpenAIClient()` which reads `process.env.OPENAI_API_KEY`. When key is missing, routes return useful fallback responses rather than errors. Ask user to add key via Secrets tab.

**Why:** setupReplitAIIntegrations returned `status: "awaiting_account_upgrade"` — do not retry this call.
