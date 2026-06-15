---
name: Workflow & Artifact Setup
description: Port assignments, workflow commands, and artifact registration for AetherCare HMS
---

## Port Assignments
- **Frontend** (hospital-management): port `20044`, `BASE_PATH=/`
- **API server** (api-server): port `8080`, routes `/api`

## Workflow Commands
- API Server: `PORT=8080 pnpm --filter @workspace/api-server run dev`
- Frontend: `PORT=20044 BASE_PATH=/ pnpm --filter @workspace/hospital-management run dev`

## Artifact Registration
- artifact.toml files live in `artifacts/<slug>/.replit-artifact/artifact.toml`
- If `listArtifacts()` returns empty despite artifact.toml existing, use `verifyAndReplaceArtifactToml` with a temp copy of the same content — this re-registers it.
- hospital-management artifactId: `artifacts/hospital-management`
- api-server artifactId: `3B4_FFSkEVBkAeYMFRJ2e`

**Why:** The artifact registration can get out of sync from the platform state. Re-writing the TOML via verifyAndReplaceArtifactToml forces re-registration without losing existing content.

## DB Schema Push
Run: `pnpm --filter @workspace/db run push` (requires node_modules installed via `pnpm install` first).
