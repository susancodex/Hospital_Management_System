---
name: RBAC and auth security decisions
description: Durable rules for role assignment and JWT secret handling in this HMS project
---
# RBAC & Auth Security Decisions

## Rule 1: Self-registration is locked to patient role

**Rule:** `POST /register/` must never accept `role` from the client. Role is hardcoded to `"patient"` on the server. Doctors and admins are created only by admins through a separate privileged flow.

**Why:** Accepting client-supplied role on self-registration is a broken access control vulnerability (OWASP A01). An attacker could self-register as admin/doctor and immediately receive privileged JWTs.

**How to apply:** Any time registration logic is touched, verify the insert uses `role: "patient"` literally, not `role: req.body.role || "patient"`. Admin-only user creation endpoints must be behind `requireRole("admin")`.

## Rule 2: JWT_SECRET must not have a hardcoded production fallback

**Rule:** In production (`NODE_ENV=production`), if `JWT_SECRET` env var is absent, the server must throw at startup — never fall back to a predictable hardcoded string.

**Why:** A known/guessable JWT secret allows token forgery. Any hardcoded string that appears in a public repo is permanently compromised.

**How to apply:** The IIFE in `artifacts/api-server/src/lib/auth.ts` throws in production, warns in dev. Set `JWT_SECRET` via Replit Secrets (minimum 32 chars random string) before deploying. Dev fallback is a clearly-labeled string, not a real secret.
