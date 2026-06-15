---
name: AI integration approach
description: How to add OpenAI AI features in this HMS project (key sourcing decision)
---
# AI Integration Strategy

## Rule: Use OPENAI_API_KEY secret, not Replit integration

**Rule:** Do not call `setupReplitAIIntegrations` for OpenAI — it requires an account upgrade this user declined. All AI routes must read `process.env.OPENAI_API_KEY` directly (user's own key added via Replit Secrets tab).

**Why:** `setupReplitAIIntegrations({ providerSlug: "openai" })` returned `{ success: false, status: "awaiting_account_upgrade" }`. Retrying will not help.

**How to apply:** All AI routes use `getOpenAIClient()` in `artifacts/api-server/src/routes/ai.ts` which returns `null` when key is absent, triggering graceful fallback responses. When AI features don't work, ask user to add `OPENAI_API_KEY` to Secrets.
