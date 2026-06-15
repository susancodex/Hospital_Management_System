---
name: Enterprise features
description: Key architectural decisions for AetherCare HMS enterprise features
---

## WebSocket
- `lib/ws.ts` uses a singleton `Map<userId, Set<WebSocket>>` for per-user broadcast (`broadcastToUser`).
- Server uses `createServer(app)` passed to `setupWebSocket(server)` in `index.ts` — not `app.listen`.
- Client connects at `/ws?token=JWT` via `useWebSocket.js` hook; Navbar shows live badge count.

## QR Prescriptions
- Stateless — token is a signed JWT (no DB column). GET `/prescriptions/:id/qr/` → SVG/PNG. Public verify at `/prescriptions/verify/:token/`.
- pdfkit MUST be dynamically imported: `(await import("pdfkit")).default` — avoids ESM/CJS bundler crash.

## i18n
- Init i18next ONLY in `main.tsx`. Importing it also in `App.jsx` causes duplicate React instance error and crashes HMR.
- Language stored in `localStorage('aethercare_lang')`. Translations: `i18n/en.json`, `i18n/ne.json`.

## Insurance
- Backend routes in `routes/insurance.ts` — providers + claims CRUD. Claims `PATCH` broadcasts WS notification to patient.
- Frontend: `pages/Insurance.jsx` with tabs (Claims/Providers) + full modal forms. Admin can approve/reject claims inline.

## Voice Transcription
- `VoiceRecorder.jsx` uses browser `MediaRecorder` → sends `audio/webm` as base64 to `/ai/transcribe/`.
- Integrated as a "Voice Notes" tab in `AiTriage.jsx` (available to doctor + admin roles).
- Gracefully fails with error message when OPENAI_API_KEY is absent.

## Monitoring Dashboard
- `pages/Monitoring.jsx` — live system health, active connections, request stats via recharts. Admin-only sidebar link.

## HIPAA Security
- `helmet()` with full CSP + HSTS applied in `app.ts`. Runs before all routes.

**Why:** These decisions prevent common re-introduction of bugs when adding new routes or pages.
