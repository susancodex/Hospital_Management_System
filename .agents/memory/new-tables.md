---
name: HMS new tables
description: Tables added beyond the original migration schema
---
# New Tables (post-migration additions)

Added in June 2026 as part of the full audit/redesign:
- `prescriptions` — doctor-issued prescriptions with JSONB medicines array
- `notifications` — in-app notifications per user
- `audit_logs` — full activity audit trail (action, resource, user, IP)
- `doctor_availability` — day-of-week availability slots

**Why:** Original migration only had users, doctors, patients, appointments, medical_records, medical_reports, billing, billing_payments.

**How to apply:** All in `lib/db/src/schema/hospital.ts`. Run `pnpm --filter @workspace/db run push` after schema changes.
